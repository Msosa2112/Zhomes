// api/commute-cache.js
// Vercel Serverless Function Proxy for Google Maps Commute Caching via Upstash Redis

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default async function handler(req, res) {
  // Solo POST y GET
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { origin, dest } = req.method === 'GET' ? req.query : req.body;

  if (!origin || !dest) {
    return res.status(400).json({ error: 'Origin and dest are required' });
  }

  // Estandarizar
  const stdOrigin = origin.toLowerCase().trim();
  const stdDest = dest.toLowerCase().trim();
  
  // Como los origin y dest pueden tener espacios, no es problema para una key si los limpiamos un poco
  const safeOrigin = stdOrigin.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const safeDest = stdDest.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  const cacheKey = `commute:${safeOrigin}_to_${safeDest}`;

  try {
    // ── READ OPERATION ──
    if (req.method === 'GET') {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ hit: true, data: cachedData });
        }
      }
      return res.status(200).json({ hit: false });
    }

    // ── WRITE OPERATION ──
    if (req.method === 'POST') {
      const { distance, duration } = req.body;
      if (!distance || !duration) {
         return res.status(400).json({ error: 'Missing distance or duration payload' });
      }

      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const payload = { distance, duration };
        // Expira en 30 dias (30 * 24 * 60 * 60 = 2592000s)
        await redis.set(cacheKey, payload, { ex: 2592000 });
        return res.status(200).json({ success: true, saved: true, cacheKey });
      }
      
      return res.status(200).json({ success: true, saved: false, reason: 'Redis not configured' });
    }

  } catch (error) {
    console.error('Commute Cache Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
