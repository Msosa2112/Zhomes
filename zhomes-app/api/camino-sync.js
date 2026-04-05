/**
 * api/camino-sync.js — Vercel Serverless Function
 *
 * Enriquece las propiedades en mls_properties con datos de entorno
 * de Camino AI (escuelas, transporte, tiendas, parques, restaurantes).
 *
 * Estrategia de sync:
 *   - Prioridad 1: Propiedades de ZHomes (is_zhomes = true) → siempre actualizadas
 *   - Prioridad 2: Propiedades sin neighborhood data (nuevas)
 *   - Prioridad 3: Propiedades con data >30 días (refresh semanal en cron)
 *   - Límite por ejecución: 200 propiedades para no exceder el plan gratuito (1000/mes)
 *
 * Camino API: https://api.getcamino.ai
 * Plan gratuito: 1,000 calls/month | 1 req/sec rate limit
 *
 * Cron: Domingo a medianoche (una vez por semana)
 * Llamada manual: GET /api/camino-sync?trigger=manual (con CRON_SECRET)
 */

const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const CAMINO_API_KEY = process.env.CAMINO_API_KEY;
const CAMINO_BASE    = 'https://api.getcamino.ai';
const BATCH_LIMIT    = 20;    // Free tier: 100 calls/month → 20/week × 4 semanas = 80/mes (margen seguro)
const RATE_LIMIT_MS  = 1100;  // 1 req/sec + margen

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().then(t => t.slice(0, 200)).catch(() => '');
    throw new Error(`Supabase ${res.status} [${path}]: ${text}`);
  }
  return options.method && options.method !== 'GET' ? res : res.json();
}

/** Obtiene propiedades a sincronizar en orden de prioridad */
async function getPropertiesToSync() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. ZHomes sin data o con data vieja
  const zhomesRes = await supabaseFetch(
    `mls_properties?select=id,lat,lng&is_zhomes=eq.true` +
    `&lat=not.is.null&lng=not.is.null` +
    `&status=in.(Active,Active Under Contract,Exclusiva)` +
    `&order=list_date.desc&limit=${BATCH_LIMIT}`
  );

  // 2. MLS sin data de neighborhood
  const noDataRes = await supabaseFetch(
    `mls_properties?select=id,lat,lng` +
    `&lat=not.is.null&lng=not.is.null` +
    `&id=not.in.(${(await supabaseFetch('property_neighborhood?select=property_id').catch(() => []))
      .map(r => r.property_id).join(',') || "''"})` +
    `&status=eq.Active&order=list_date.desc&limit=${BATCH_LIMIT}`
  ).catch(() => []);

  // 3. Data vieja (>30 días) — solo si queda cuota
  const staleRes = await supabaseFetch(
    `property_neighborhood?select=property_id,lat,lng&synced_at=lt.${thirtyDaysAgo}` +
    `&sync_error=is.null&limit=50`
  ).catch(() => []);

  // Merge y deduplicar, prioridad: zhomes > sin data > stale
  const seen = new Set();
  const all = [];

  for (const p of [...zhomesRes, ...noDataRes]) {
    if (!seen.has(p.id) && p.lat && p.lng) {
      seen.add(p.id);
      all.push({ id: p.id, lat: p.lat, lng: p.lng });
    }
  }
  for (const p of staleRes) {
    if (!seen.has(p.property_id) && p.lat && p.lng) {
      seen.add(p.property_id);
      all.push({ id: p.property_id, lat: p.lat, lng: p.lng });
    }
  }

  return all.slice(0, BATCH_LIMIT);
}

// ── Camino API ────────────────────────────────────────────────────────────────

/**
 * Llama a Camino API para obtener inteligencia de ubicación.
 * Retorna null si la llamada falla (no rompe el sync completo).
 */
async function fetchNeighborhood(lat, lng, radius = 1000) {
  if (!CAMINO_API_KEY) {
    throw new Error('CAMINO_API_KEY not configured');
  }

  const res = await fetch(`${CAMINO_BASE}/context`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CAMINO_API_KEY
    },
    body: JSON.stringify({
      location: { lat: parseFloat(lat), lon: parseFloat(lng) },
      radius,
      context: 'real estate evaluation: schools, transit, grocery stores, parks, restaurants, walkability, safety'
    })
  });

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error(`Camino ${res.status}`);

  return res.json();
}

/**
 * Transforma la respuesta de Camino al formato de nuestra tabla.
 */
function transformCaminoResponse(data, lat, lng, radius) {
  const places = data.relevant_places || {};

  // Extraer walkability del description (Camino no da score numérico directo)
  const desc = (data.area_description || '').toLowerCase();
  const insights = (data.context_insights || '').toLowerCase();
  const walkScore = desc.includes('excellent walkability') || insights.includes('excellent walkability') ? 90
    : desc.includes('good walkability') || insights.includes('walkable') ? 70
    : desc.includes('some walkability') ? 50
    : 40;

  const transitScore = (places.transit || []).length >= 5 ? 85
    : (places.transit || []).length >= 2 ? 65
    : (places.transit || []).length >= 1 ? 40
    : 20;

  const schoolScore = (places.schools || []).length >= 3 ? 85
    : (places.schools || []).length >= 1 ? 60
    : 30;

  return {
    area_description:   data.area_description || null,
    context_insights:   data.context_insights || null,
    walkability_score:  walkScore,
    transit_score:      transitScore,
    schools_score:      schoolScore,
    schools:            places.schools    || [],
    transit:            places.transit    || [],
    grocery:            places.grocery    || [],
    parks:              places.parks      || [],
    restaurants:        places.restaurants || [],
    total_places:       data.total_places_found || 0,
    lat:                parseFloat(lat),
    lng:                parseFloat(lng),
    radius_meters:      radius,
    synced_at:          new Date().toISOString(),
    sync_error:         null
  };
}

/** Upsert de un registro de neighborhood en Supabase */
async function upsertNeighborhood(propertyId, neighborhoodData) {
  await supabaseFetch('property_neighborhood', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ property_id: propertyId, ...neighborhoodData })
  });
}

/** Registra error de sync para una propiedad */
async function markSyncError(propertyId, error, lat, lng) {
  await supabaseFetch('property_neighborhood', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({
      property_id: propertyId,
      lat, lng,
      sync_error: error.message,
      synced_at: new Date().toISOString()
    })
  }).catch(() => {});
}

// ── Sync Logging ──────────────────────────────────────────────────────────────

async function createLog(triggeredBy) {
  try {
    const res = await supabaseFetch('sync_logs', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        status: 'running',
        triggered_by: triggeredBy,
        spark_api_version: 'camino-v1'
      })
    });
    return Array.isArray(res) ? res[0]?.id : null;
  } catch { return null; }
}

async function updateLog(logId, updates) {
  if (!logId) return;
  try {
    await supabaseFetch(`sync_logs?id=eq.${logId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...updates, completed_at: new Date().toISOString() })
    });
  } catch { /* non-critical */ }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Auth
  const cronSecret   = process.env.CRON_SECRET;
  const authHeader   = req.headers['authorization'];
  const triggeredBy  = req.query.trigger || (req.headers['x-vercel-cron'] ? 'cron' : 'manual');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not configured.' });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!CAMINO_API_KEY) {
    return res.status(500).json({ error: 'CAMINO_API_KEY not configured. Add it to Vercel environment variables.' });
  }

  const start = Date.now();
  const log = [];
  const logId = await createLog(triggeredBy);

  let synced = 0, skipped = 0, errors = 0;

  try {
    log.push('🏘️ Starting Camino neighborhood sync...');

    const properties = await getPropertiesToSync();
    log.push(`Found ${properties.length} properties to enrich`);

    if (!properties.length) {
      log.push('✅ Nothing to sync — all properties are up to date');
      await updateLog(logId, { status: 'success', duration_seconds: 0, details: { log } });
      return res.status(200).json({ success: true, synced: 0, log });
    }

    for (const property of properties) {
      try {
        const caminoData  = await fetchNeighborhood(property.lat, property.lng);
        const transformed = transformCaminoResponse(caminoData, property.lat, property.lng, 1000);
        await upsertNeighborhood(property.id, transformed);

        synced++;
        if (synced % 10 === 0) log.push(`  ... ${synced}/${properties.length} enriched`);

        // Respect Camino rate limit: 1 req/sec
        await sleep(RATE_LIMIT_MS);

      } catch (err) {
        if (err.message === 'RATE_LIMIT') {
          log.push(`⚠️ Rate limit hit at property ${synced + errors + 1} — waiting 5s`);
          await sleep(5000);
          skipped++;
        } else {
          await markSyncError(property.id, err, property.lat, property.lng);
          errors++;
          if (errors <= 5) log.push(`  ❌ ${property.id}: ${err.message}`);
        }
      }
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    log.push(`✅ Done in ${elapsed}s — synced: ${synced}, errors: ${errors}, skipped: ${skipped}`);

    const status = errors === 0 ? 'success' : synced > 0 ? 'partial' : 'failed';
    await updateLog(logId, {
      status,
      duration_seconds: elapsed,
      properties_upserted: synced,
      properties_skipped: skipped + errors,
      details: { log }
    });

    return res.status(200).json({ success: true, synced, errors, skipped, elapsed_seconds: elapsed, log });

  } catch (err) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.error('Camino sync error:', err);
    await updateLog(logId, {
      status: 'failed',
      duration_seconds: elapsed,
      error_message: err.message,
      details: { log }
    });
    return res.status(500).json({ success: false, error: err.message, log });
  }
}
