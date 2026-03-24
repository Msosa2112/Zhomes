// api/spark.js
// Vercel Serverless Function Proxy for Spark API (Flexmls)

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
  const SPARK_API_KEY = process.env.VITE_SPARK_API_KEY || process.env.SPARK_API_KEY || 'ayj1thvzmwsmpbn1ami7c8z85';

  if (!SPARK_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing Spark API Credentials' 
    });
  }

  // Reso Web API v3 Endpoint provisto
  const sparkBaseUrl = 'https://replication.sparkapi.com/Version/3/Reso/OData';
  
  try {
    // Aquí iría el flujo de autenticación si Spark requiere un accessToken 
    // previo via OAuth2 (Client Credentials flow). 
    // Para simplificar, asumimos que estamos usando un API Token directo 
    // o enviando Key/Secret por headers según la doc de Spark.
    // 
    // NOTA: Si Spark usa OAuth2, se debe hacer un POST a /oauth2/token primero
    // y almacenar el token en memoria (ej. variable global o redis) con expiración.
    
    // El endpoint normalmente será algo como 'Property' para listados
    const response = await fetch(`${sparkBaseUrl}/${endpoint}?` + new URLSearchParams(queryParams), {
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

    // Retorna la data limpia al frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('Spark Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
