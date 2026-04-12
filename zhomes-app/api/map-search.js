// api/map-search.js
// Endpoint de búsqueda AI para el mapa de ZHomes
// POST { query: "casa tranquila cerca de parques, menos de $280k, 3 cuartos" }
// → { priceMax, priceMin, beds, baths, type, keywords[] }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { query } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'Query required' });

  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI search not configured', filters: {} });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de búsqueda de propiedades inmobiliarias. 
Extrae filtros de búsqueda del texto en español y devuelve SOLO un JSON válido con estos campos (todos opcionales):
- priceMin: number (precio mínimo en USD)
- priceMax: number (precio máximo en USD) 
- beds: number (número mínimo de habitaciones)
- baths: number (número mínimo de baños)
- type: "Single Family" | "Condominium" | "Townhouse" | "Multifamily" | "Lots/Land" (tipo de propiedad)
- keywords: string[] (palabras clave de ubicación/ambiente como "tranquilo", "parque", "escuelas")

Ejemplos:
- "casa de 3 cuartos menos de 250 mil" → {"priceMax":250000,"beds":3}
- "apartamento cerca de escuelas" → {"type":"Condominium","keywords":["escuelas"]}
- "algo tranquilo con parque" → {"keywords":["tranquilo","parque"]}
- "quiero una casa grande y barata" → {"type":"Single Family"}

Solo devuelve el JSON, sin explicación.`
          },
          { role: 'user', content: query }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[map-search] OpenAI error:', err);
      return res.status(502).json({ error: 'AI service error', filters: {} });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    let filters = {};
    try { filters = JSON.parse(rawContent); } catch { filters = {}; }

    console.log(`[map-search] Query: "${query}" → Filters:`, filters);
    return res.status(200).json({ filters, query });

  } catch (err) {
    console.error('[map-search] Error:', err.message);
    return res.status(500).json({ error: err.message, filters: {} });
  }
}
