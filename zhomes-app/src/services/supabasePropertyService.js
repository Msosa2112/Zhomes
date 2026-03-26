/**
 * Supabase Property Service
 * 
 * Queries the synced mls_properties table in Supabase for fast,
 * filterable property searches. Replaces direct Spark API calls
 * for consumer-facing features (search, map, swipe).
 */
import { supabase } from '../lib/supabaseClient';

const PAGE_SIZE = 50;

export const SupabasePropertyService = {

    /**
     * Get all properties with optional filters.
     * Used by: PropertiesPageMobile, MapPageMobile, SwipeModePageMobile
     */
    async getProperties({ 
        status = null, 
        city = null, 
        minPrice = null, 
        maxPrice = null,
        minBeds = null,
        minBaths = null,
        minSqft = null,
        maxSqft = null,
        propertyType = null,
        zhomesOnly = false,
        limit = 200,
        offset = 0,
        orderBy = 'price',
        ascending = false
    } = {}) {
        let query = supabase
            .from('mls_properties')
            .select('*')
            .not('lat', 'is', null)
            .not('lng', 'is', null);

        // Status filter
        if (status === 'Active') {
            query = query.in('status', ['Active', 'Active Under Contract', 'Pending']);
        } else if (status === 'Closed') {
            query = query.eq('status', 'Closed');
        } else if (status) {
            query = query.eq('status', status);
        }

        // Location
        if (city) query = query.ilike('city', `%${city}%`);

        // Price range
        if (minPrice) query = query.gte('price', minPrice);
        if (maxPrice) query = query.lte('price', maxPrice);

        // Property attributes
        if (minBeds) query = query.gte('beds', minBeds);
        if (minBaths) query = query.gte('baths', minBaths);
        if (minSqft) query = query.gte('sqft', minSqft);
        if (maxSqft) query = query.lte('sqft', maxSqft);

        // Property type
        if (propertyType) query = query.ilike('property_subtype', `%${propertyType}%`);

        // ZHomes only
        if (zhomesOnly) query = query.eq('is_zhomes', true);

        // Order & Pagination
        query = query
            .order(orderBy, { ascending })
            .range(offset, offset + limit - 1);

        const { data, error } = await query;
        if (error) {
            console.error('SupabasePropertyService error:', error.message);
            return [];
        }
        return data || [];
    },

    /**
     * Get a single property by ID
     */
    async getPropertyById(id) {
        const { data, error } = await supabase
            .from('mls_properties')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('Property fetch error:', error.message);
            return null;
        }
        return data;
    },

    /**
     * Get property counts by status
     */
    async getCounts() {
        const { data, error } = await supabase
            .from('mls_properties')
            .select('status')
        
        if (error || !data) return { total: 0, active: 0, closed: 0 };

        return {
            total: data.length,
            active: data.filter(p => ['Active', 'Pending', 'Active Under Contract'].includes(p.status)).length,
            closed: data.filter(p => p.status === 'Closed').length,
            zhomes: data.filter(p => p.is_zhomes).length,
        };
    },

    /**
     * Search properties by address text
     */
    async searchByAddress(query, limit = 20) {
        const { data, error } = await supabase
            .from('mls_properties')
            .select('id, address, city, price, beds, baths, sqft, primary_photo, status, is_zhomes')
            .ilike('address', `%${query}%`)
            .order('price', { ascending: false })
            .limit(limit);
        
        if (error) return [];
        return data || [];
    },

    /**
     * Format a Supabase property row to match the app's expected format
     */
    formatForApp(p) {
        return {
            id: p.id,
            address: p.address || '',
            city: p.city || 'Louisville, KY',
            price: p.price || p.close_price || 0,
            closePrice: p.close_price || 0,
            image: p.primary_photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
            images: p.photos || [p.primary_photo].filter(Boolean),
            beds: p.beds || 0,
            baths: Math.round(p.baths || 0),
            sqft: p.sqft || 0,
            type: p.property_subtype || '',
            description: p.description || '',
            lat: p.lat,
            lng: p.lng,
            exclusive: p.is_zhomes || false,
            status: p.status || 'Active',
            listAgentName: p.list_agent_name || '',
            listAgentKey: p.list_agent_key || '',
            closeDate: p.close_date || null,
            listDate: p.list_date || null,
            yearBuilt: p.year_built || null,
            subdivision: p.subdivision || '',
            lotSize: p.lot_size || null,
            garage: p.garage_yn || false,
            pool: (p.pool_features || []).length > 0,
            basement: (p.basement || []).length > 0,
            fireplace: p.fireplace_yn || false,
            source: 'MLS'
        };
    }
};
