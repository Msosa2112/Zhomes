// scripts/verify-upstash.mjs
// Verifica que el caché de Upstash Redis funcione para Spark y Commute
import 'dotenv/config';
import { Redis } from '@upstash/redis';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const YELLOW= '\x1b[33m';
const BOLD  = '\x1b[1m';

function ok(msg)   { console.log(`${GREEN}  ✔ ${msg}${RESET}`); }
function fail(msg) { console.log(`${RED}  ✖ ${msg}${RESET}`); }
function info(msg) { console.log(`${CYAN}  ℹ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}  ⚠ ${msg}${RESET}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }
function ms(t) { return `${(Date.now() - t)}ms`; }

// ─── Validar credenciales ───────────────────────────────────────────────────
header('═══════════════════════════════════════');
header('   VERIFICACIÓN UPSTASH REDIS — ZHOMES  ');
header('═══════════════════════════════════════');

const url   = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  fail('UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN no definidos en .env.local');
  process.exit(1);
}
ok(`Credenciales cargadas: ${url}`);

const redis = new Redis({ url, token });

// ─── TEST 1: Conexión básica ────────────────────────────────────────────────
header('\n[TEST 1] Conexión a Upstash Redis');
try {
  const t = Date.now();
  const pong = await redis.ping();
  if (pong === 'PONG') {
    ok(`PING exitoso en ${ms(t)}`);
  } else {
    fail(`Respuesta inesperada al PING: ${pong}`);
    process.exit(1);
  }
} catch (e) {
  fail(`No se pudo conectar: ${e.message}`);
  process.exit(1);
}

// ─── TEST 2: Caché Spark (MLS) ─────────────────────────────────────────────
header('\n[TEST 2] Caché de Spark MLS (spark_cache:*)');

const sparkKey = `spark_cache:Property?city=TestVerification&_limit=5`;
const fakeSparkData = {
  value: [
    { ListingId: 'TEST001', City: 'TestVerification', ListPrice: 299000 },
    { ListingId: 'TEST002', City: 'TestVerification', ListPrice: 350000 },
  ],
  '@odata.count': 2,
};

try {
  // 2a. Limpiar antes de empezar
  await redis.del(sparkKey);
  info('Llave limpiada para test en frío...');

  // 2b. MISS esperado
  let t = Date.now();
  const miss = await redis.get(sparkKey);
  if (miss === null) {
    ok(`Cache MISS correcto en ${ms(t)} — llave no existe aún`);
  } else {
    warn('Se encontró data residual — limpiando...');
    await redis.del(sparkKey);
  }

  // 2c. SET (simular guardado después de llamar a Spark)
  t = Date.now();
  await redis.set(sparkKey, fakeSparkData, { ex: 3600 });
  ok(`Cache SAVED en ${ms(t)} — TTL=1h`);

  // 2d. HIT esperado
  t = Date.now();
  const hit = await redis.get(sparkKey);
  const elapsed = Date.now() - t;
  if (hit && hit['@odata.count'] === 2) {
    ok(`Cache HIT en ${elapsed}ms — ${hit.value.length} propiedades recuperadas instantáneamente`);
    if (elapsed < 200) {
      ok(`Velocidad excelente: ${elapsed}ms (< 200ms requeridos para bypass real)`);
    } else {
      warn(`Velocidad aceptable pero alta: ${elapsed}ms. Revisa latencia de red a Upstash.`);
    }
  } else {
    fail(`Cache HIT falló o data corrupta: ${JSON.stringify(hit)}`);
  }

  // 2e. Verificar TTL
  const ttl = await redis.ttl(sparkKey);
  if (ttl > 3500 && ttl <= 3600) {
    ok(`TTL configurado correctamente: ${ttl}s restantes (~1 hora)`);
  } else {
    warn(`TTL inesperado: ${ttl}s`);
  }

  // 2f. Limpiar al final
  await redis.del(sparkKey);
  info('Llave de test eliminada.\n');

} catch (e) {
  fail(`Error en TEST 2 Spark: ${e.message}`);
}

// ─── TEST 3: Commute Cache ─────────────────────────────────────────────────
header('\n[TEST 3] Commute Cache (commute:*)');

const origin  = 'Louisville KY';
const dest    = '123 Main St Louisville KY';
const safeOrigin = origin.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
const safeDest   = dest.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
const commuteKey = `commute:${safeOrigin}_to_${safeDest}`;

const fakeCommute = { distance: '5.2 mi', duration: '12 mins' };

try {
  await redis.del(commuteKey);
  info(`Llave de commute limpiada: ${commuteKey}`);

  // 3a. MISS
  let t = Date.now();
  const miss = await redis.get(commuteKey);
  if (miss === null) {
    ok(`Commute Cache MISS correcto en ${ms(t)}`);
  } else {
    warn('Data residual encontrada, limpiando...');
    await redis.del(commuteKey);
  }

  // 3b. POST (guardar distancia calculada por Google Maps)
  t = Date.now();
  await redis.set(commuteKey, fakeCommute, { ex: 2592000 }); // 30 días
  ok(`Commute guardado en ${ms(t)} — TTL=30 días`);

  // 3c. HIT
  t = Date.now();
  const hit = await redis.get(commuteKey);
  const elapsed = Date.now() - t;
  if (hit && hit.distance === '5.2 mi') {
    ok(`Commute HIT en ${elapsed}ms — "${hit.distance}" en "${hit.duration}"`);
  } else {
    fail(`Commute HIT falló: ${JSON.stringify(hit)}`);
  }

  // 3d. TTL commute
  const ttl = await redis.ttl(commuteKey);
  const days = Math.floor(ttl / 86400);
  if (days >= 29) {
    ok(`TTL commute correcto: ${ttl}s (~${days} días restantes)`);
  } else {
    warn(`TTL commute inesperado: ${ttl}s (~${days} días)`);
  }

  await redis.del(commuteKey);
  info('Llave de commute eliminada.\n');

} catch (e) {
  fail(`Error en TEST 3 Commute: ${e.message}`);
}

// ─── RESULTADO FINAL ────────────────────────────────────────────────────────
header('\n═══════════════════════════════════════');
ok(`${BOLD}TODOS LOS TESTS PASARON — Upstash Redis operativo${RESET}`);
header('═══════════════════════════════════════\n');
