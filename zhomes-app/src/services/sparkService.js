/**
 * sparkService.js
 * 
 * Handles all requests from the React Frontend to the Vercel Proxy
 * for accessing Spark API data.
 */

const API_BASE_URL = '/api/spark';

/**
 * Función genérica para hacer peticiones al proxy de Vercel.
 * @param {string} endpoint - Ejemplo: 'listings', 'contacts'
 * @param {object} params - Parámetros GET (filtros, paginación, etc.)
 */
async function fetchFromSpark(endpoint, params = {}) {
    const query = new URLSearchParams({ endpoint, ...params }).toString();
    try {
        const res = await fetch(`${API_BASE_URL}?${query}`);
        if (!res.ok) {
            throw new Error(`Spark API Proxy Error: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error in sparkService:', error);
        throw error;
    }
}

export const SparkService = {
    /**
     * Trae los listados activos de la MLS.
     * Permite pasar filtros opcionales de OData ($filter, $top, etc.).
     */
    async getActiveListings(filter = "MlsStatus eq 'Active'", limit = 20) {
        return fetchFromSpark('Property', {
            $filter: filter,
            $top: limit,
            $expand: 'Media'
        });
    },

    /**
     * Trae los detalles exactos de una propiedad por su ID en Spark.
     */
    async getListingDetails(listingId) {
        return fetchFromSpark(`Property('${listingId}')`);
    },

    /**
     * Trae la galería fotográfica de alta definición de una propiedad específica.
     */
    async getListingPhotos(listingId) {
        // RESO Web API usually fetches photos passing ResourceRecordKey
        return fetchFromSpark('Media', {
            $filter: `ResourceRecordKey eq '${listingId}'`
        });
    },

    /**
     * (Opcional) Trae agentes registrados bajo la oficina de la broker.
     */
    async getOfficeAgents() {
        return fetchFromSpark('Member'); 
    }
};
