/**
 * api/neighborhood.js — Endpoint para obtener lugares cercanos (POIs) gratis
 * Usa OpenStreetMap (Overpass API) y almacena en caché en Supabase.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { property_id, lat, lng } = req.query;

    if (!property_id || !lat || !lng) {
        return res.status(400).json({ error: 'Faltan parámetros (property_id, lat, lng)' });
    }

    try {
        // 1. Verificar Caché en Supabase
        const cacheCheck = await fetch(
            `${SUPABASE_URL}/rest/v1/property_neighborhood_pois?property_id=eq.${property_id}&select=*`,
            {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            }
        ).then(r => r.json()).catch(() => []);

        if (cacheCheck && cacheCheck.length > 0) {
            return res.status(200).json({ source: 'cache', data: cacheCheck[0].pois_data });
        }

        // 2. Si no hay caché, pedir a OpenStreetMap (Overpass API)
        // Buscamos Escuelas, Comida y Estilo de vida (Parques, Gyms) en ~1.5 millas (2500 metros)
        const overpassQuery = `
            [out:json][timeout:15];
            (
              node["amenity"="school"](around:2500,${lat},${lng});
              node["amenity"~"restaurant|cafe|fast_food"](around:1500,${lat},${lng});
              node["leisure"~"park|fitness_centre"](around:2500,${lat},${lng});
              node["shop"~"supermarket|convenience"](around:1500,${lat},${lng});
            );
            out body 25;
        `;

        const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!overpassRes.ok) throw new Error('Overpass API falló');

        const osmData = await overpassRes.json();

        // 3. Formatear la data al patrón que usa nuestro mapa visual
        let schools = [];
        let dining = [];
        let lifestyle = [];

        // Función auxiliar para calcular distancia (básica en millas)
        const getDist = (lat1, lon1, lat2, lon2) => {
            const radlat1 = Math.PI * lat1/180;
            const radlat2 = Math.PI * lat2/180;
            const theta = lon1-lon2;
            const radtheta = Math.PI * theta/180;
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) dist = 1;
            dist = Math.acos(dist) * 180/Math.PI * 60 * 1.1515; // en Millas
            return dist.toFixed(1) + ' mi';
        };

        const elements = osmData.elements || [];
        
        elements.forEach(el => {
            if (!el.tags || !el.tags.name) return;
            const distance = getDist(parseFloat(lat), parseFloat(lng), el.lat, el.lon);
            const poi = { name: el.tags.name, lat: el.lat, lng: el.lon, dist: distance };

            if (el.tags.amenity === 'school') {
                poi.type = 'Escuela';
                poi.rating = (Math.random() * (9.5 - 7.0) + 7.0).toFixed(1); // Simulamos rating temporalmente
                if (schools.length < 5) schools.push(poi);
            } 
            else if (['restaurant', 'cafe', 'fast_food'].includes(el.tags.amenity)) {
                poi.type = el.tags.cuisine ? el.tags.cuisine.charAt(0).toUpperCase() + el.tags.cuisine.slice(1) : (el.tags.amenity === 'cafe' ? 'Café' : 'Restaurante');
                if (dining.length < 5) dining.push(poi);
            } 
            else if (['park', 'fitness_centre'].includes(el.tags.leisure) || ['supermarket', 'convenience'].includes(el.tags.shop)) {
                if (el.tags.leisure === 'park') poi.type = 'Parque';
                else if (el.tags.leisure === 'fitness_centre') poi.type = 'Gym';
                else poi.type = 'Supermercado';
                if (lifestyle.length < 5) lifestyle.push(poi);
            }
        });

        // Retornamos un objeto de datos estructurado como la maqueta
        const finalPois = { 
            schools, dining, lifestyle, 
            commute: [
                { name: 'Ruta Principal', time: '🚗 ~ mins', lat: parseFloat(lat) + 0.01, lng: parseFloat(lng) + 0.01 }
            ] 
        };

        // 4. Guardar secretamente en Supabase Caché en un paso de fondo (No bloquea la respuesta al cliente)
        fetch(`${SUPABASE_URL}/rest/v1/property_neighborhood_pois`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                property_id: property_id,
                pois_data: finalPois
            })
        }).catch(err => console.error('Cache save error:', err));

        return res.status(200).json({ source: 'live_osm', data: finalPois });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
