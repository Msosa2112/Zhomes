/**
 * Vercel Serverless Function — WalkScore API Proxy
 * 
 * Required because WalkScore API doesn't support CORS.
 * This function proxies requests from the frontend to WalkScore's API
 * server-side, bypassing the browser's CORS restrictions.
 * 
 * Environment variable: VITE_WALKSCORE_API_KEY (set in Vercel dashboard)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.VITE_WALKSCORE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'WalkScore API key not configured' });
  }

  const { address, lat, lon } = req.query;

  if (!address || !lat || !lon) {
    return res.status(400).json({ error: 'Missing required parameters: address, lat, lon' });
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      address,
      lat,
      lon,
      transit: '1',
      bike: '1',
      wsapikey: apiKey,
    });

    const response = await fetch(
      `https://api.walkscore.com/score?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`WalkScore API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Cache for 24 hours — Walk Scores don't change frequently
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(data);
  } catch (error) {
    console.error('WalkScore proxy error:', error.message);
    return res.status(502).json({ error: 'Failed to fetch WalkScore data' });
  }
}
