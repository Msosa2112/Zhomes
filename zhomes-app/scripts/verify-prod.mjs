// scripts/verify-prod.mjs
// Verifica los endpoints en vivo en producción (zhomesapp.com)
import 'dotenv/config';

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';

function ok(msg)     { console.log(`${GREEN}  ✔ ${msg}${RESET}`); }
function fail(msg)   { console.log(`${RED}  ✖ ${msg}${RESET}`); }
function info(msg)   { console.log(`${CYAN}  ℹ ${msg}${RESET}`); }
function warn(msg)   { console.log(`${YELLOW}  ⚠ ${msg}${RESET}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

const BASE        = 'https://zhomesapp.com';
const CRON_SECRET = process.env.CRON_SECRET;

header('══════════════════════════════════════════');
header('   VERIFICACIÓN EN PRODUCCIÓN — ZHOMESAPP  ');
header('══════════════════════════════════════════');

// ─── TEST 1: qstash-trigger ─────────────────────────────────────────────────
header('\n[TEST 1] /api/qstash-trigger → QStash encola el sync');
try {
  const t = Date.now();
  const res = await fetch(`${BASE}/api/qstash-trigger`, {
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      'x-vercel-cron': '1',              // simular header de Vercel Cron
    }
  });
  const elapsed = Date.now() - t;
  const data = await res.json();

  info(`Status: ${res.status} | Tiempo: ${elapsed}ms`);
  info(`Respuesta: ${JSON.stringify(data, null, 2)}`);

  if (res.ok && data.queued) {
    ok(`QStash trigger funcionando — Message ID: ${data.messageId}`);
    ok(`Sync de MLS encolado con reintentos garantizados`);
  } else if (res.ok && data.queued === false && data.reason) {
    warn(`Trigger respondió pero no encoló: ${data.reason}`);
    warn(`Verifica que QSTASH_TOKEN esté en las env vars de Vercel`);
  } else if (res.status === 401) {
    fail(`401 Unauthorized — verifica CRON_SECRET en Vercel env vars`);
  } else {
    warn(`Respuesta inesperada: ${JSON.stringify(data)}`);
  }
} catch (err) {
  fail(`Error de conexión: ${err.message}`);
}

// ─── TEST 2: commute-cache GET (MISS esperado) ──────────────────────────────
header('\n[TEST 2] /api/commute-cache → Commute cache Redis en prod');
try {
  const t = Date.now();
  const res = await fetch(`${BASE}/api/commute-cache?origin=Louisville+KY&dest=123+Main+St+Louisville+KY`);
  const elapsed = Date.now() - t;
  const data = await res.json();

  info(`Status: ${res.status} | Tiempo: ${elapsed}ms`);

  if (res.ok && data.hit === false) {
    ok(`Cache MISS correcto — llave nueva, no existe en Redis`);
    ok(`Endpoint operativo en producción`);
  } else if (res.ok && data.hit === true) {
    ok(`Cache HIT — el endpoint funciona y Redis tiene el dato`);
  } else {
    warn(`Respuesta: ${JSON.stringify(data)}`);
  }
} catch (err) {
  fail(`Error: ${err.message}`);
}

// ─── TEST 3: enqueue-lead ───────────────────────────────────────────────────
header('\n[TEST 3] /api/enqueue-lead → Cola de leads con delay 30min');
try {
  const t = Date.now();
  const res = await fetch(`${BASE}/api/enqueue-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentKey:        'TEST_AGENT_VERIFY_001',
      propertyId:      'TEST_PROP_001',
      propertyAddress: '123 Test St, Louisville KY',
      action:          'swiped_right',
      clientName:      'Verification Script',
    })
  });
  const elapsed = Date.now() - t;
  const data = await res.json();

  info(`Status: ${res.status} | Tiempo: ${elapsed}ms`);

  if (res.ok && data.enqueued) {
    ok(`Lead encolado en QStash — Message ID: ${data.messageId}`);
    ok(`Se entregará a /api/notify-lead en ${data.delayMinutes} minutos`);
  } else if (res.ok && !data.enqueued) {
    warn(`Lead no encolado: ${data.reason || JSON.stringify(data)}`);
    warn(`Verifica QSTASH_TOKEN en Vercel`);
  } else {
    fail(`Error ${res.status}: ${JSON.stringify(data)}`);
  }
} catch (err) {
  fail(`Error: ${err.message}`);
}

// ─── TEST 4: spark proxy ────────────────────────────────────────────────────
header('\n[TEST 4] /api/spark → Proxy MLS con Redis cache');
try {
  const t1 = Date.now();
  const res1 = await fetch(`${BASE}/api/spark?endpoint=Property&%24top=3&%24select=ListingId%2CCity%2CListPrice`);
  const elapsed1 = Date.now() - t1;
  const xCache1 = res1.headers.get('X-Cache') || 'no header';
  const data1 = await res1.json();

  info(`1er llamado — Status: ${res1.status} | Tiempo: ${elapsed1}ms | X-Cache: ${xCache1}`);

  if (res1.ok) {
    const count = data1.value?.length ?? 0;
    ok(`Spark respondió — ${count} propiedades`);

    // Segundo llamado — debe venir de Redis
    const t2 = Date.now();
    const res2 = await fetch(`${BASE}/api/spark?endpoint=Property&%24top=3&%24select=ListingId%2CCity%2CListPrice`);
    const elapsed2 = Date.now() - t2;
    const xCache2 = res2.headers.get('X-Cache') || 'no header';

    info(`2do llamado — Status: ${res2.status} | Tiempo: ${elapsed2}ms | X-Cache: ${xCache2}`);

    if (xCache2 === 'HIT') {
      ok(`Redis cache activo — segundo llamado desde memoria (${elapsed2}ms vs ${elapsed1}ms)`);
    } else {
      warn(`X-Cache: ${xCache2} — puede ser MISS si la llave ya expiró o Vercel no incluyó el header`);
    }
  } else {
    warn(`Spark respondió ${res1.status} — puede ser normal si API está limitada`);
    info(JSON.stringify(data1).slice(0, 200));
  }
} catch (err) {
  fail(`Error: ${err.message}`);
}

// ─── RESULTADO ───────────────────────────────────────────────────────────────
header('\n══════════════════════════════════════════');
ok(`${BOLD}Verificación de producción completada${RESET}`);
header('══════════════════════════════════════════\n');
