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

  // Credenciales desde variables de entorno (Ocultas al cliente)
  const SPARK_API_KEY = process.env.SPARK_API_KEY;

  if (!SPARK_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing Spark API Credentials in Vercel Environment Variables' 
    });
  }

  // Reconstruir la ruta para Spark API
  // Ejemplo: /api/spark?endpoint=listings&_filter=PropertyType Eq 'Residential'
  const sparkBaseUrl = 'https://api.sparkapi.com/v1';
  
  try {
    // Aquí iría el flujo de autenticación si Spark requiere un accessToken 
    // previo via OAuth2 (Client Credentials flow). 
    // Para simplificar, asumimos que estamos usando un API Token directo 
    // o enviando Key/Secret por headers según la doc de Spark.
    // 
    // NOTA: Si Spark usa OAuth2, se debe hacer un POST a /oauth2/token primero
    // y almacenar el token en memoria (ej. variable global o redis) con expiración.
    
    // Authorization header structure can vary based on Spark config.
    const response = await fetch(`${sparkBaseUrl}/${endpoint}?` + new URLSearchParams(queryParams), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPARK_API_KEY}`,
        'X-SparkApi-User-Agent': 'ZhomesApp/1.0',
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
