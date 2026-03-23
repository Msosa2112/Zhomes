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
    async getActiveListings(filter = "PropertyType Eq 'A' And MlsStatus Eq 'Active'", limit = 20) {
        return fetchFromSpark('listings', {
            _filter: filter,
            _limit: limit,
            _expand: 'Photos,PrimaryPhoto' // Si la doc indica cómo expandir media a priori
        });
    },

    /**
     * Trae los detalles exactos de una propiedad por su ID en Spark.
     */
    async getListingDetails(listingId) {
        return fetchFromSpark(`listings/${listingId}`);
    },

    /**
     * Trae la galería fotográfica de alta definición de una propiedad específica.
     */
    async getListingPhotos(listingId) {
        return fetchFromSpark(`listings/${listingId}/photos`);
    },

    /**
     * (Opcional) Trae agentes registrados bajo la oficina de la broker.
     */
    async getOfficeAgents() {
        return fetchFromSpark('contacts'); 
    }
};
