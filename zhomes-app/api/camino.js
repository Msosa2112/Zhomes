/**
 * api/camino.js — Proxy on-demand para Camino AI
 *
 * Usado por el frontend cuando una propiedad no tiene neighborhood
 * data en Supabase todavía (nueva listing reciente).
 *
 * Primero busca en Supabase (cache). Si no existe o tiene error,
 * llama a Camino API y guarda el resultado.
 *
 * GET /api/camino?property_id=XXX
 * GET /api/camino?lat=38.25&lng=-85.75
 */

const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.VITE_SUPABASE_ANON_KEY;
const CAMINO_API_KEY = process.env.CAMINO_API_KEY;
const CAMINO_BASE    = 'https://api.getcamino.ai';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { property_id, lat, lng, radius = '1000' } = req.query;

  if (!property_id && (!lat || !lng)) {
    return res.status(400).json({ error: 'Provide property_id or lat+lng' });
  }

  // 1. Buscar en cache de Supabase primero
  if (property_id) {
    const cached = await fetch(
      `${SUPABASE_URL}/rest/v1/property_neighborhood?property_id=eq.${property_id}&sync_error=is.null&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    ).then(r => r.json()).catch(() => []);

    if (cached.length > 0) {
      return res.status(200).json({ source: 'cache', data: cached[0] });
    }
  }

  // 2. Si no hay cache, llamar Camino API
  if (!CAMINO_API_KEY) {
    return res.status(503).json({
      error: 'Neighborhood data not available yet. Will be synced shortly.',
      source: 'none'
    });
  }

  // Obtener lat/lng si solo se pasó property_id
  let resolvedLat = lat, resolvedLng = lng;
  if (property_id && (!lat || !lng)) {
    const prop = await fetch(
      `${SUPABASE_URL}/rest/v1/mls_properties?id=eq.${property_id}&select=lat,lng&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    ).then(r => r.json()).catch(() => []);

    if (!prop.length || !prop[0].lat) {
      return res.status(404).json({ error: 'Property coordinates not found' });
    }
    resolvedLat = prop[0].lat;
    resolvedLng = prop[0].lng;
  }

  try {
    const caminoRes = await fetch(`${CAMINO_BASE}/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CAMINO_API_KEY
      },
      body: JSON.stringify({
        location: { lat: parseFloat(resolvedLat), lon: parseFloat(resolvedLng) },
        radius: parseInt(radius),
        context: 'real estate evaluation: schools, transit, grocery, parks, restaurants, walkability'
      })
    });

    if (!caminoRes.ok) {
      throw new Error(`Camino ${caminoRes.status}`);
    }

    const data = await caminoRes.json();

    // Guardar en Supabase (servicio de escritura via service key no disponible aquí,
    // así que solo devolvemos el resultado — el sync semanal lo persistirá)
    return res.status(200).json({ source: 'camino_live', data });

  } catch (err) {
    return res.status(502).json({ error: err.message, source: 'error' });
  }
}
