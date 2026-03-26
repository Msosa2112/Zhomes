/**
 * sparkService.js
 * 
 * Handles all requests from the React Frontend to the Vite/Vercel Proxy
 * for accessing Spark API (RESO Web API v3) data.
 * 
 * ZHomes Real Estate — OfficeKey: 20141212170001416260000000
 * Greater Louisville AOR — Louisville MLS
 */

const API_BASE_URL = '/api/spark';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

/**
 * Función genérica para hacer peticiones al proxy.
 * @param {string} endpoint - Ejemplo: 'Property', 'Member', 'Office'
 * @param {object} params - Parámetros OData ($filter, $top, $select, $expand, etc.)
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

/**
 * Auto-paginates through Spark API results.
 * Spark returns max 10 results per page with @odata.nextLink.
 * This function follows pagination until reaching the desired limit.
 */
async function fetchAllPages(endpoint, params = {}, maxResults = 50) {
    const allResults = [];
    let currentParams = { ...params };
    let pages = 0;
    const maxPages = Math.ceil(maxResults / 10) + 1;

    while (pages < maxPages && allResults.length < maxResults) {
        const data = await fetchFromSpark(endpoint, currentParams);
        const results = data.value || [];
        allResults.push(...results);

        const nextLink = data['@odata.nextLink'];
        if (!nextLink || results.length === 0) break;

        // Extract $skiptoken from the nextLink URL
        try {
            const nextUrl = new URL(nextLink);
            const skipToken = nextUrl.searchParams.get('$skiptoken');
            if (skipToken) {
                currentParams = { ...params, $skiptoken: skipToken };
            } else {
                break;
            }
        } catch {
            break;
        }
        pages++;
    }

    return { value: allResults.slice(0, maxResults) };
}

export const SparkService = {

    // ═══════════════════════════════════
    //  PROPERTIES
    // ═══════════════════════════════════

    /**
     * Trae los listados activos de toda la MLS.
     */
    async getActiveListings(filter = "MlsStatus eq 'Active'", limit = 100) {
        return fetchAllPages('Property', {
            $filter: filter,
            $top: limit,
            $expand: 'Media'
        }, limit);
    },

    /**
     * Trae SOLO los listados de la oficina ZHomes Real Estate.
     * Incluye activos, pendientes y cerrados.
     */
    async getZHomesListings(statusFilter = '', limit = 50) {
        const baseFilter = `ListOfficeKey eq '${ZHOMES_OFFICE_KEY}'`;
        const filter = statusFilter ? `${baseFilter} and ${statusFilter}` : baseFilter;
        return fetchFromSpark('Property', {
            $filter: filter,
            $top: limit,
            $select: 'ListingKey,UnparsedAddress,ListPrice,ListAgentFullName,ListAgentKey,MlsStatus,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PropertySubType,Latitude,Longitude,ListingContractDate,CloseDate,OriginalListPrice,PublicRemarks,YearBuilt,LotSizeAcres',
            $expand: 'Media($select=MediaURL,ShortDescription)'
        });
    },

    /**
     * Trae los detalles exactos de una propiedad por su ListingKey.
     */
    async getListingDetails(listingId) {
        return fetchFromSpark(`Property('${listingId}')`, {
            $expand: 'Media'
        });
    },

    /**
     * Trae la galería fotográfica de una propiedad específica.
     */
    async getListingPhotos(listingId) {
        return fetchFromSpark('Media', {
            $filter: `ResourceRecordKey eq '${listingId}'`
        });
    },

    // ═══════════════════════════════════
    //  MEMBERS (AGENTS)
    // ═══════════════════════════════════

    /**
     * Trae TODOS los agentes registrados bajo la oficina ZHomes Real Estate.
     * Retorna: nombre, email, teléfono, MLS ID, licencia, etc.
     */
    async getZHomesAgents() {
        return fetchFromSpark('Member', {
            $filter: `OfficeKey eq '${ZHOMES_OFFICE_KEY}'`,
            $select: 'MemberKey,MemberFullName,MemberFirstName,MemberLastName,MemberEmail,MemberPreferredPhone,MemberMobilePhone,MemberOfficePhone,MemberMlsId,MemberStatus,MemberStateLicense,MemberType,MemberLocalType,MemberAddress1,MemberCity,MemberStateOrProvince,MemberPostalCode,OfficeName,OfficeKey,MemberBio'
        });
    },

    /**
     * Trae los detalles de un agente específico por su MemberKey.
     */
    async getAgentDetails(memberKey) {
        return fetchFromSpark(`Member('${memberKey}')`);
    },

    /**
     * Trae los listados de un agente específico por su ListAgentKey.
     */
    async getAgentListings(agentKey, limit = 50) {
        return fetchFromSpark('Property', {
            $filter: `ListAgentKey eq '${agentKey}'`,
            $top: limit,
            $select: 'ListingKey,UnparsedAddress,ListPrice,MlsStatus,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PropertySubType,ListAgentFullName',
            $expand: 'Media($top=1;$select=MediaURL)'
        });
    },

    // ═══════════════════════════════════
    //  OFFICE
    // ═══════════════════════════════════

    /**
     * Trae los datos de la oficina ZHomes Real Estate.
     */
    async getZHomesOffice() {
        return fetchFromSpark(`Office('${ZHOMES_OFFICE_KEY}')`);
    },

    /**
     * Trae todas las oficinas del MLS (para benchmarking/competencia).
     */
    async getOffices(limit = 20) {
        return fetchFromSpark('Office', {
            $top: limit,
            $select: 'OfficeKey,OfficeName,OfficePhone,OfficeEmail,OfficeAddress1,OfficeCity,OfficeStatus'
        });
    },

    // ═══════════════════════════════════
    //  OPEN HOUSES
    // ═══════════════════════════════════

    /**
     * Trae los Open Houses programados.
     */
    async getOpenHouses(limit = 20) {
        return fetchFromSpark('OpenHouse', {
            $top: limit
        });
    },

    // ═══════════════════════════════════
    //  CLOSED / OFF-MARKET PROPERTIES
    // ═══════════════════════════════════

    /**
     * Trae propiedades vendidas/cerradas (off-market) más recientes con fotos.
     */
    async getClosedProperties(limit = 50) {
        return fetchAllPages('Property', {
            $filter: "MlsStatus eq 'Closed'",
            $top: limit,
            $orderby: 'CloseDate desc',
            $select: 'ListingKey,UnparsedAddress,ListPrice,ClosePrice,MlsStatus,ListAgentFullName,ListAgentKey,ListOfficeKey,CloseDate,ListDate,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PropertySubType,Latitude,Longitude,YearBuilt',
            $expand: 'Media($top=5;$select=MediaURL,ShortDescription)'
        }, limit);
    },

    /**
     * Trae TODO el historial de propiedades de ZHomes (cualquier status).
     */
    async getAllZHomesHistory(limit = 200) {
        return fetchAllPages('Property', {
            $filter: `ListOfficeKey eq '${ZHOMES_OFFICE_KEY}'`,
            $top: limit,
            $orderby: 'ModificationTimestamp desc',
            $select: 'ListingKey,UnparsedAddress,ListPrice,ClosePrice,MlsStatus,ListAgentFullName,ListAgentKey,CloseDate,ListDate,BedroomsTotal,BathroomsTotalInteger,LivingArea,City,PropertySubType,Latitude,Longitude,YearBuilt,PublicRemarks',
            $expand: 'Media($top=3;$select=MediaURL,ShortDescription)'
        }, limit);
    },

    /**
     * Trae los cierres de un agente específico para generar stats.
     */
    async getAgentClosedDeals(memberKey, limit = 50) {
        return fetchFromSpark('Property', {
            $filter: `ListAgentKey eq '${memberKey}' and MlsStatus eq 'Closed'`,
            $top: limit,
            $orderby: 'CloseDate desc',
            $select: 'ListingKey,UnparsedAddress,ClosePrice,CloseDate,City'
        });
    },

    /**
     * Genera un reporte de rendimiento para TODOS los agentes de ZHomes.
     * Retorna un array con stats por agente: totalClosed, totalVolume, avgPrice, lastCloseDate.
     */
    async getAllAgentStats(agents) {
        const stats = await Promise.all(
            agents.map(async (agent) => {
                try {
                    const data = await this.getAgentClosedDeals(agent.MemberKey || agent.memberKey);
                    const deals = data.value || [];
                    const totalVolume = deals.reduce((sum, d) => sum + (d.ClosePrice || 0), 0);
                    return {
                        memberKey: agent.MemberKey || agent.memberKey,
                        name: agent.MemberFullName || agent.name,
                        totalClosed: deals.length,
                        totalVolume,
                        avgPrice: deals.length > 0 ? Math.round(totalVolume / deals.length) : 0,
                        lastCloseDate: deals[0]?.CloseDate || null,
                        recentDeals: deals.slice(0, 3).map(d => ({
                            address: d.UnparsedAddress,
                            price: d.ClosePrice,
                            date: d.CloseDate,
                            city: d.City
                        }))
                    };
                } catch {
                    return {
                        memberKey: agent.MemberKey || agent.memberKey,
                        name: agent.MemberFullName || agent.name,
                        totalClosed: 0, totalVolume: 0, avgPrice: 0, lastCloseDate: null, recentDeals: []
                    };
                }
            })
        );
        return stats.sort((a, b) => b.totalVolume - a.totalVolume);
    },

    // ═══════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════
    ZHOMES_OFFICE_KEY
};
