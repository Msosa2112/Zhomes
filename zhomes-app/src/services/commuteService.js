// Ya no necesitamos importar Supabase directamente para esto, 
// reducimos el footprint del cliente
export const CommuteService = {
    /**
     * Calculates distances utilizing Upstash Redis internal cache system via serverless proxy.
     * @param {string} originAddress - The starting address.
     * @param {Array<{id, address, label, ...}>} destinations - List of objects to fetch records for.
     */
    async getCommuteTimes(originAddress, destinations) {
        const results = [];
        const destsNeededFromApi = [];

        for (const dest of destinations) {
            try {
                // 1. Check Upstash Redis Cache via Serverless API
                const urlParams = new URLSearchParams({
                    origin: originAddress,
                    dest: dest.address
                });
                
                const response = await fetch(`/api/commute-cache?${urlParams.toString()}`);
                const data = await response.json();

                if (response.ok && data.hit && data.data) {
                    // Valid cache hit!
                    results.push({
                        ...dest,
                        distance: data.data.distance,
                        duration: data.data.duration,
                        cached: true
                    });
                } else {
                    // Miss
                    destsNeededFromApi.push({ destMeta: dest });
                }
            } catch (err) {
                console.error("Cache Check Error:", err);
                destsNeededFromApi.push({ destMeta: dest });
            }
        }

        // 2. Fetch those missed from Google (if any)
        if (destsNeededFromApi.length > 0) {
            const newResults = await this.fetchFromGoogleDistanceMatrix(
                originAddress, 
                destsNeededFromApi.map(d => d.destMeta.address)
            );

            // Match back with meta and update cache
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

                    // Guardar asíncronamente en Caché de Redis (Fire-and-forget)
                    fetch('/api/commute-cache', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            origin: originAddress,
                            dest: reqMeta.destMeta.address,
                            distance: gResult.distance.text,
                            duration: gResult.duration.text
                        })
                    }).catch(e => console.error("Error al guardar en caché:", e));

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
