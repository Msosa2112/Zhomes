import { supabase } from '../lib/supabaseClient';

export const CommuteService = {
    /**
     * Calculates distances utilizing an internal database cache system to save API requests.
     * @param {string} originAddress - The starting address.
     * @param {Array<{id, address, label, ...}>} destinations - List of objects to fetch records for.
     */
    async getCommuteTimes(originAddress, destinations) {
        const results = [];
        const THRESHOLD_DAYS = 15;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - THRESHOLD_DAYS);

        // Standardize origin
        const stdOrigin = originAddress.toLowerCase().trim();
        const destsNeededFromApi = [];

        for (const dest of destinations) {
            const stdDest = dest.address.toLowerCase().trim();

            try {
                // 1. Check Supabase Cache Array
                const { data, error } = await supabase
                    .from('api_commute_cache')
                    .select('*')
                    .eq('origin_address', stdOrigin)
                    .eq('dest_address', stdDest)
                    .maybeSingle();

                if (data && new Date(data.created_at) > cutoffDate) {
                    // Valid cache hit!
                    results.push({
                        ...dest,
                        distance: data.distance_text,
                        duration: data.duration_text,
                        cached: true
                    });
                } else {
                    // Miss or expired
                    destsNeededFromApi.push({ destMeta: dest, stdOrigin, stdDest, dbId: data?.id });
                }
            } catch (err) {
                console.error("Cache Check Error:", err);
                destsNeededFromApi.push({ destMeta: dest, stdOrigin, stdDest, dbId: null });
            }
        }

        // 2. Fetch those missed from Google (if any)
        if (destsNeededFromApi.length > 0) {
            const newResults = await this.fetchFromGoogleDistanceMatrix(
                originAddress, 
                destsNeededFromApi.map(d => d.destMeta.address)
            );

            // Match back with meta and update database
            for (let i = 0; i < destsNeededFromApi.length; i++) {
                const reqMeta = destsNeededFromApi[i];
                const gResult = newResults[i];

                if (gResult.status === 'OK') {
                    const mappedResult = {
                        ...reqMeta.destMeta,
                        distance: gResult.distance.text,
                        duration: gResult.duration.text,
                        cached: false
                    };
                    results.push(mappedResult);

                    // Insert/Update Cache
                    const payload = {
                        origin_address: reqMeta.stdOrigin,
                        dest_address: reqMeta.stdDest,
                        distance_text: gResult.distance.text,
                        duration_text: gResult.duration.text,
                        created_at: new Date().toISOString()
                    };

                    if (reqMeta.dbId) {
                        // Update existing expired item
                        supabase.from('api_commute_cache').update(payload).eq('id', reqMeta.dbId).then();
                    } else {
                        // Insert new item
                        supabase.from('api_commute_cache').insert([payload]).then();
                    }
                } else {
                    results.push({
                        ...reqMeta.destMeta,
                        error: true
                    });
                }
            }
        }

        return results;
    },

    async fetchFromGoogleDistanceMatrix(origin, destAddresses) {
        return new Promise((resolve) => {
            if (!window.google || !window.google.maps) {
                resolve(destAddresses.map(() => ({ status: 'API_NOT_LOADED' })));
                return;
            }

            const service = new window.google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: destAddresses,
                travelMode: 'DRIVING',
                unitSystem: window.google.maps.UnitSystem.IMPERIAL,
            }, (response, status) => {
                if (status !== 'OK') {
                    resolve(destAddresses.map(() => ({ status: 'ERROR' })));
                    return;
                }
                resolve(response.rows[0].elements);
            });
        });
    }
};
