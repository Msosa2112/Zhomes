/**
 * cmaService.js — Motor de CMA Profesional
 *
 * ZHomes Real Estate · Louisville, KY
 *
 * Metodología:  Principio de Sustitución + Matched Pair Analysis
 * Fuente:       Supabase mls_properties (status = Closed, lat/lng disponible)
 * Distancia:    Fórmula Haversine
 * Ajustes:      Estándar industria Mid-South / Louisville market
 */

import { supabase } from '../lib/supabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE AJUSTE — Louisville, KY Market
// Basadas en Matched Pair Analysis del mercado Mid-South
// ─────────────────────────────────────────────────────────────────────────────
const ADJUSTMENTS = {
    SQFT_PER_UNIT:      75,     // $ por sqft de diferencia
    BEDROOM:          7500,     // $ por bedroom de diferencia
    BATHROOM:         5000,     // $ por bathroom de diferencia
    GARAGE_PER_CAR:  12000,     // $ por espacio de garage
    POOL:            18000,     // $ por tener/no tener piscina
    BASEMENT:        20000,     // $ por tener/no tener sótano terminado
    YEAR_BUILT_STEP:  1500,     // $ por cada 5 años de diferencia de construcción
}

// ─────────────────────────────────────────────────────────────────────────────
// HAVERSINE — Distancia entre dos puntos GPS en millas
// ─────────────────────────────────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8   // Radio de la Tierra en millas
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDING BOX — Filtra lat/lng en Supabase antes de Haversine
// 1 grado lat ≈ 69 mi · 1 grado lng ≈ 55 mi (en KY)
// ─────────────────────────────────────────────────────────────────────────────
function getBoundingBox(lat, lng, radiusMiles) {
    const latDelta = radiusMiles / 69
    const lngDelta = radiusMiles / 55
    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE DE SIMILARIDAD — 0-100 (higher is better comp)
// ─────────────────────────────────────────────────────────────────────────────
function calcSimilarityScore(subject, comp, distMiles, daysAgo) {
    // Distancia (0 pts penalización a 0mi → 40 pts penalización a 1.5mi)
    const distScore = Math.min(40, (distMiles / 1.5) * 40)

    // Recencia (100% si < 30 días, 75% si > 90 días)
    const recencyFactor = daysAgo <= 30 ? 1.0
        : daysAgo <= 90  ? 0.9
        : daysAgo <= 180 ? 0.75
        : 0.6

    // Similaridad de superficie
    const sqftPct = subject.sqft && comp.sqft
        ? Math.abs(comp.sqft - subject.sqft) / subject.sqft
        : 0.2
    const sqftFactor = Math.max(0, 1 - sqftPct)

    // Similaridad de habitaciones
    const bedDiff = Math.abs((comp.beds || 0) - (subject.beds || 0))
    const bedFactor = Math.max(0, 1 - bedDiff * 0.15)

    // Fórmula compuesta
    const raw = (100 - distScore) * recencyFactor * sqftFactor * bedFactor
    return Math.round(Math.max(0, Math.min(100, raw)))
}

// ─────────────────────────────────────────────────────────────────────────────
// AJUSTE MONETARIO — cuánto hay que sumar/restar al comp para igualarlo al sujeto
// Regla: si comp es SUPERIOR → resta · si comp es INFERIOR → suma
// ─────────────────────────────────────────────────────────────────────────────
function calcAdjustments(subject, comp) {
    const items = []
    let total = 0

    // Sqft
    if (subject.sqft && comp.sqft) {
        const diff = subject.sqft - comp.sqft   // positivo → sujeto es mayor → adj positivo
        const amt = diff * ADJUSTMENTS.SQFT_PER_UNIT
        if (Math.abs(amt) >= 500) {
            items.push({ label: `GLA (${diff > 0 ? '+' : ''}${diff} sqft)`, amount: amt })
            total += amt
        }
    }

    // Bedrooms
    const bedDiff = (subject.beds || 0) - (comp.beds || 0)
    if (bedDiff !== 0) {
        const amt = bedDiff * ADJUSTMENTS.BEDROOM
        items.push({ label: `Habitaciones (${bedDiff > 0 ? '+' : ''}${bedDiff})`, amount: amt })
        total += amt
    }

    // Bathrooms
    const bathDiff = (subject.baths || 0) - (comp.baths || 0)
    if (Math.abs(bathDiff) >= 0.5) {
        const amt = Math.round(bathDiff * ADJUSTMENTS.BATHROOM)
        items.push({ label: `Baños (${bathDiff > 0 ? '+' : ''}${bathDiff.toFixed(1)})`, amount: amt })
        total += amt
    }

    // Garage
    const subGarage = subject.garage ? 1 : 0
    const compGarage = comp.garage ? 1 : 0
    if (subGarage !== compGarage) {
        const amt = (subGarage - compGarage) * ADJUSTMENTS.GARAGE_PER_CAR
        items.push({ label: `Garage`, amount: amt })
        total += amt
    }

    // Pool
    const subPool = subject.pool ? 1 : 0
    const compPool = comp.pool ? 1 : 0
    if (subPool !== compPool) {
        const amt = (subPool - compPool) * ADJUSTMENTS.POOL
        items.push({ label: `Piscina`, amount: amt })
        total += amt
    }

    // Año de construcción (ajuste por cada 5 años de diferencia)
    if (subject.yearBuilt && comp.yearBuilt) {
        const yearDiff = subject.yearBuilt - (comp.yearBuilt || subject.yearBuilt)
        const steps = Math.round(yearDiff / 5)
        if (steps !== 0) {
            const amt = steps * ADJUSTMENTS.YEAR_BUILT_STEP
            items.push({ label: `Año construcción (${yearDiff > 0 ? '+' : ''}${yearDiff} años)`, amount: amt })
            total += amt
        }
    }

    return { items, total }
}

// ─────────────────────────────────────────────────────────────────────────────
// AJUSTE DE MERCADO (time adjustment)
// Aplica apreciación del ~4% anual del mercado de Louisville si el comp
// se vendió hace más de 60 días
// ─────────────────────────────────────────────────────────────────────────────
function applyMarketTimeAdj(closePrice, daysAgo) {
    if (daysAgo <= 60) return { price: closePrice, adj: 0 }
    const annualRate = 0.04   // 4% apreciación anual Louisville market
    const factor = (daysAgo / 365) * annualRate
    const adj = Math.round(closePrice * factor)
    return { price: closePrice + adj, adj }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: runCMA
// ─────────────────────────────────────────────────────────────────────────────
export async function runCMA(subject) {
    const now = new Date()

    let soldComps = []
    let searchMethod = 'gps' // for transparency in the result

    // ─── TIER 1: GPS — Radio creciente, tiempo creciente ──────────────────
    // Eje 1: radio 1.5mi → 3mi → 5mi
    // Eje 2: ventana 180d → 365d → 730d (ajuste de mercado compensa antigüedad)
    const radiusCascade   = [1.5, 3.0, 5.0]
    const windowCascade   = [180, 365, 730]

    if (subject.lat && subject.lng) {
        outerLoop:
        for (const days of windowCascade) {
            const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000)
            const cutoffISO  = cutoffDate.toISOString().split('T')[0]

            for (const radiusMiles of radiusCascade) {
                const box = getBoundingBox(subject.lat, subject.lng, radiusMiles)

                const { data, error } = await supabase
                    .from('mls_properties')
                    .select('id, address, city, zip, subdivision, price, close_price, sqft, beds, baths, year_built, lat, lng, close_date, status, garage_yn, pool_features, basement, primary_photo, property_subtype, list_agent_name')
                    .in('status', ['Closed'])
                    .not('close_price', 'is', null)
                    .not('lat', 'is', null)
                    .not('lng', 'is', null)
                    .gte('lat', box.minLat)
                    .lte('lat', box.maxLat)
                    .gte('lng', box.minLng)
                    .lte('lng', box.maxLng)
                    .gte('close_date', cutoffISO)
                    .neq('id', subject.id)
                    .order('close_date', { ascending: false })
                    .limit(100)

                if (error) throw new Error('Error consultando comparables: ' + error.message)

                const sqftTolerance = days <= 180 ? 0.25 : 0.35  // más holgado si datos viejos
                const minSqft = subject.sqft ? subject.sqft * (1 - sqftTolerance) : 0
                const maxSqft = subject.sqft ? subject.sqft * (1 + sqftTolerance) : Infinity

                soldComps = (data || [])
                    .map(c => {
                        const dist = haversineDistance(subject.lat, subject.lng, c.lat, c.lng)
                        return { ...c, _distMiles: dist }
                    })
                    .filter(c =>
                        c._distMiles <= radiusMiles &&
                        (!subject.sqft || (c.sqft >= minSqft && c.sqft <= maxSqft)) &&
                        Math.abs((c.beds || 0) - (subject.beds || 0)) <= 2
                    )
                    .sort((a, b) => a._distMiles - b._distMiles)

                if (soldComps.length >= 3) {
                    searchMethod = days > 180 ? `gps_${days}d` : 'gps'
                    break outerLoop
                }
            }
        }
    }

    // ─── TIER 2: Misma Subdivisión ─────────────────────────────────────────
    // Alta confiabilidad: misma subdivisión = mismo micro-mercado
    if (soldComps.length < 3 && subject.subdivision) {
        searchMethod = 'subdivision'
        const cutoffISO = new Date(now - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data: subData } = await supabase
            .from('mls_properties')
            .select('id, address, city, zip, subdivision, price, close_price, sqft, beds, baths, year_built, lat, lng, close_date, status, garage_yn, pool_features, basement, primary_photo, property_subtype, list_agent_name')
            .in('status', ['Closed'])
            .not('close_price', 'is', null)
            .eq('subdivision', subject.subdivision)
            .gte('close_date', cutoffISO)
            .neq('id', subject.id)
            .order('close_date', { ascending: false })
            .limit(30)

        const minSqft = subject.sqft ? subject.sqft * 0.65 : 0
        const maxSqft = subject.sqft ? subject.sqft * 1.35 : Infinity

        const subdivComps = (subData || [])
            .filter(c =>
                (!subject.sqft || (c.sqft >= minSqft && c.sqft <= maxSqft)) &&
                Math.abs((c.beds || 0) - (subject.beds || 0)) <= 2
            )
            .map(c => ({
                ...c,
                _distMiles: c.lat && c.lng && subject.lat && subject.lng
                    ? haversineDistance(subject.lat, subject.lng, c.lat, c.lng)
                    : 0.5  // distancia estimada dentro de la subdivisión
            }))

        if (subdivComps.length > 0) {
            soldComps = [...soldComps, ...subdivComps]
                .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)  // deduplicar
                .sort((a, b) => {
                    const dateA = new Date(a.close_date).getTime()
                    const dateB = new Date(b.close_date).getTime()
                    return dateB - dateA  // más recientes primero
                })
        }
    }

    // ─── TIER 3: Mismo ZIP + specs similares ──────────────────────────────
    if (soldComps.length < 2 && subject.zip) {
        searchMethod = 'zip'
        const cutoffISO = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data: zipData } = await supabase
            .from('mls_properties')
            .select('id, address, city, zip, subdivision, price, close_price, sqft, beds, baths, year_built, lat, lng, close_date, status, garage_yn, pool_features, basement, primary_photo, property_subtype, list_agent_name')
            .in('status', ['Closed'])
            .not('close_price', 'is', null)
            .eq('zip', subject.zip)
            .gte('close_date', cutoffISO)
            .neq('id', subject.id)
            .order('close_date', { ascending: false })
            .limit(50)

        const minSqft = subject.sqft ? subject.sqft * 0.6 : 0
        const maxSqft = subject.sqft ? subject.sqft * 1.4 : Infinity

        const zipComps = (zipData || [])
            .filter(c =>
                (!subject.sqft || (c.sqft >= minSqft && c.sqft <= maxSqft)) &&
                Math.abs((c.beds || 0) - (subject.beds || 0)) <= 2
            )
            .map(c => ({
                ...c,
                _distMiles: c.lat && c.lng && subject.lat && subject.lng
                    ? haversineDistance(subject.lat, subject.lng, c.lat, c.lng)
                    : 1.5
            }))

        if (zipComps.length > 0) {
            soldComps = [...soldComps, ...zipComps]
                .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
                .sort((a, b) => new Date(b.close_date) - new Date(a.close_date))
        }
    }

    if (soldComps.length === 0) {
        throw new Error('No se encontraron ventas comparables en los últimos 180 días. Prueba con una propiedad en Louisville.')
    }

    // 2. Procesar los top 6 mejores comps
    const topComps = soldComps.slice(0, 6)

    const processedComps = topComps.map(comp => {
        const closeDate = new Date(comp.close_date)
        const daysAgo = Math.round((now - closeDate) / (1000 * 60 * 60 * 24))

        // Normalizar datos del comp
        const normalized = {
            ...comp,
            sqft: comp.sqft || 0,
            beds: comp.beds || 0,
            baths: comp.baths || 0,
            yearBuilt: comp.year_built || null,
            garage: comp.garage_yn || false,
            pool: (comp.pool_features || []).length > 0,
            basement: (comp.basement || []).length > 0,
        }

        // Tiempo en mercado adjustment
        const { price: timeAdjPrice, adj: timeAdj } = applyMarketTimeAdj(comp.close_price, daysAgo)

        // Ajustes de características
        const { items: adjItems, total: adjTotal } = calcAdjustments(subject, normalized)

        const adjustedPrice = Math.round(timeAdjPrice + adjTotal)
        const score = calcSimilarityScore(subject, normalized, comp._distMiles, daysAgo)

        return {
            id: comp.id,
            address: comp.address,
            city: comp.city,
            closePrice: comp.close_price,
            closeDate: comp.close_date,
            daysAgo,
            distMiles: Math.round(comp._distMiles * 100) / 100,
            sqft: normalized.sqft,
            beds: normalized.beds,
            baths: normalized.baths,
            yearBuilt: normalized.yearBuilt,
            garage: normalized.garage,
            pool: normalized.pool,
            photo: comp.primary_photo,
            pricePerSqft: normalized.sqft > 0 ? Math.round(comp.close_price / normalized.sqft) : null,
            timeAdj,
            adjustments: adjItems,
            adjustmentTotal: adjTotal,
            adjustedPrice,
            similarityScore: score,
            weight: score,   // el peso en el promedio ponderado
        }
    })

    // 3. Precio sugerido = promedio ponderado de los precios ajustados
    const totalWeight = processedComps.reduce((s, c) => s + c.weight, 0)
    const weightedSum = processedComps.reduce((s, c) => s + (c.adjustedPrice * c.weight), 0)
    const rawSuggested = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

    // Redondear al $1,000 más cercano
    const suggestedPrice = Math.round(rawSuggested / 1000) * 1000

    // 4. Rango de precio (±5% del sugerido, ajustado por dispersión de ajustes)
    const prices = processedComps.map(c => c.adjustedPrice)
    const minPrice = Math.round(Math.min(...prices) / 1000) * 1000
    const maxPrice = Math.round(Math.max(...prices) / 1000) * 1000
    const rangeLow  = Math.round(Math.max(suggestedPrice * 0.95, minPrice) / 1000) * 1000
    const rangeHigh = Math.round(Math.min(suggestedPrice * 1.05, maxPrice) / 1000) * 1000

    // 5. Stats de mercado
    const avgPricePerSqft = processedComps
        .filter(c => c.pricePerSqft)
        .reduce((s, c, _, arr) => s + c.pricePerSqft / arr.length, 0)

    const avgDaysAgo = Math.round(processedComps.reduce((s, c) => s + c.daysAgo, 0) / processedComps.length)
    const avgDist = Math.round(processedComps.reduce((s, c) => s + c.distMiles, 0) / processedComps.length * 100) / 100

    // 6. Comparar con precio de listado actual
    const listPrice = subject.price || 0
    const priceDiff = listPrice > 0 ? ((suggestedPrice - listPrice) / listPrice) * 100 : null
    const marketPosition = priceDiff === null ? 'unknown'
        : priceDiff > 3  ? 'underpriced'
        : priceDiff < -3 ? 'overpriced'
        : 'at_market'

    return {
        subject: {
            id: subject.id,
            address: subject.address,
            price: listPrice,
            sqft: subject.sqft,
            beds: subject.beds,
            baths: subject.baths,
            yearBuilt: subject.yearBuilt,
        },
        comps: processedComps,
        suggestedPrice,
        rangeLow,
        rangeHigh,
        listPrice,
        priceDiff: priceDiff !== null ? Math.round(priceDiff * 10) / 10 : null,
        marketPosition,
        marketStats: {
            avgPricePerSqft: Math.round(avgPricePerSqft),
            avgDaysAgo,
            avgDistMiles: avgDist,
            totalCompsFound: soldComps.length,
            compsUsed: processedComps.length,
        },
        adjustmentConstants: ADJUSTMENTS,
        searchMethod,
        generatedAt: now.toISOString(),
    }
}
