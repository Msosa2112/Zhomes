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
     * Build a filtered query base (shared between ZHomes and non-ZHomes queries)
     */
    _buildBaseQuery({ status, city, minPrice, maxPrice, minBeds, minBaths, minSqft, maxSqft, propertyType }, cols = '*') {
        let q = supabase.from('mls_properties').select(cols);

        // Status filter
        if (status === 'Active') {
            q = q.in('status', ['Active', 'Active Under Contract', 'Pending']);
        } else if (status === 'Closed') {
            q = q.in('status', ['Closed', 'Cancelled', 'Expired']);
        } else if (status) {
            q = q.eq('status', status);
        } else {
            // Default: active listings only
            q = q.in('status', ['Active', 'Active Under Contract', 'Pending']);
        }

        if (city)        q = q.ilike('city', `%${city}%`);
        if (minPrice)    q = q.gte('price', minPrice);
        if (maxPrice)    q = q.lte('price', maxPrice);
        if (minBeds)     q = q.gte('beds', minBeds);
        if (minBaths)    q = q.gte('baths', minBaths);
        if (minSqft)     q = q.gte('sqft', minSqft);
        if (maxSqft)     q = q.lte('sqft', maxSqft);
        if (propertyType) q = q.ilike('property_subtype', `%${propertyType}%`);

        return q;
    },

    /**
     * Get properties — ZHomes ALWAYS come first, no matter the limit.
     *
     * Strategy:
     *  1. Fetch ALL ZHomes matching the filters (no cap) → ordered by list_date DESC
     *  2. Fill remaining slots (limit - zhomesCount) with non-ZHomes → ordered by list_date DESC
     *  3. Combine: [zhomes..., nonZhomes...]
     *
     * Used by: PropertiesPageMobile, MapPageMobile, SwipeModePageMobile, PropertyContext
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
        cols = 'id, address, city, price, beds, baths, sqft, property_type, property_subtype, primary_photo, status, is_zhomes, lat, lng, close_price, list_date, agent_name, office_name'
    } = {}) {
        const filters = { status, city, minPrice, maxPrice, minBeds, minBaths, minSqft, maxSqft, propertyType };

        // ── 1. Always fetch ALL ZHomes matching the filter first ──
        const { data: zhomesData, error: e1 } = await this._buildBaseQuery(filters, cols)
            .eq('is_zhomes', true)
            .order('list_date', { ascending: false })   // newest ZHomes first
            .order('price',     { ascending: false });

        if (e1) console.error('ZHomes query error:', e1.message);
        const zhomes = zhomesData || [];

        // If zhomesOnly, return immediately (no fill needed)
        if (zhomesOnly) return zhomes;

        // ── 2. Fill remaining slots with non-ZHomes ──
        const remaining = Math.max(0, limit - zhomes.length);
        let nonZhomes = [];

        if (remaining > 0) {
            // Bypass Supabase default 1000 Max Rows limit by chunking 
            const chunkSize = 1000;
            const chunks = Math.ceil(remaining / chunkSize);
            const reqs = [];

            for (let i = 0; i < chunks; i++) {
                const chunkOffset = offset + (i * chunkSize);
                const chunkEnd = Math.min(offset + remaining - 1, chunkOffset + chunkSize - 1);
                
                reqs.push(
                    this._buildBaseQuery(filters, cols)
                    .eq('is_zhomes', false)
                    .not('lat', 'is', null)
                    .not('lng', 'is', null)
                    .order('list_date', { ascending: false })
                    .order('price',     { ascending: false })
                    .range(chunkOffset, chunkEnd)
                );
            }

            const results = await Promise.all(reqs);
            results.forEach(res => {
                if (res.error) console.error('NonZHomes query error:', res.error.message);
                if (res.data) nonZhomes.push(...res.data);
            });
        }

        // ── 3. Return ZHomes first, then fill ──
        return [...zhomes, ...nonZhomes];
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
