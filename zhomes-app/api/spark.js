// api/spark.js
// Vercel Serverless Function Proxy for Spark API (Flexmls)

import { Redis } from '@upstash/redis';

// Inicialidad de forma segura con fallback para evitar crasheos si faltan vars
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default async function handler(req, res) {
  // Solo permitimos peticiones GET para evitar payloads indeseados si no es necesario
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, ...queryParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  // Credenciales desde variables de entorno con fallback al token provisto
  const SPARK_API_KEY = process.env.VITE_SPARK_API_KEY || process.env.SPARK_API_KEY;

  if (!SPARK_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing Spark API Credentials' 
    });
  }

  // Reso Web API v3 Endpoint provisto
  const sparkBaseUrl = 'https://replication.sparkapi.com/Version/3/Reso/OData';
  const searchParams = new URLSearchParams(queryParams).toString();
  
  try {
    // ── UPSTASH CACHE CHECK ──────────────────────────────────────────────────
    // Generar llave única basada en el endpoint y los parámetros exactos
    const cacheKey = `spark_cache:${endpoint}?${searchParams}`;

    // Validar si tenemos las credenciales de Upstash cargadas
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        // En Upstash REST, GET ya parsea el JSON por nosotros.
        const cachedData = await redis.get(cacheKey);
        
        if (cachedData) {
            console.log(`[Upstash] Cache HIT - Expidiendo instantáneo: ${cacheKey}`); 
            // Ponemos headers de control para saber que viene de Upstash
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cachedData); 
        }
        console.log(`[Upstash] Cache MISS - Consultando Spark: ${cacheKey}`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const response = await fetch(`${sparkBaseUrl}/${endpoint}?` + searchParams, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPARK_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error from Spark API',
        details: data
      });
    }

    // ── UPSTASH CACHE SAVE ───────────────────────────────────────────────────
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && data) {
        // Guardar en Redis y expirar en 1 HORA (3600 segundos)
        await redis.set(cacheKey, data, { ex: 3600 });
        console.log(`[Upstash] Cache SAVED - Llave expira en 1H: ${cacheKey}`);
    }
    res.setHeader('X-Cache', 'MISS');
    // ─────────────────────────────────────────────────────────────────────────

    // Retorna la data limpia al frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('Spark Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
