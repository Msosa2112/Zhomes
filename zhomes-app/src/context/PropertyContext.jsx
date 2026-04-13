import { createContext, useContext, useState, useEffect } from 'react'
import { SupabasePropertyService } from '../services/supabasePropertyService'
import { supabase } from '../lib/supabaseClient'
import { SparkService } from '../services/sparkService'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

export function PropertiesProvider({ children }) {
    const [properties, setProperties] = useState([])
    const [zhomesAgents, setZhomesAgents] = useState([])
    const [zhomesOffice, setZhomesOffice] = useState(null)
    const [offMarketListings, setOffMarketListings] = useState([])  // app-uploaded (Fix&Flip, exclusives)
    const [agentStats, setAgentStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAllData() {
            try {
                const [supaPropsResult, offMarketResult, agentsResult, officeResult] = await Promise.allSettled([
                    // Active = "En Venta": Active, Pending, Active Under Contract (from MLS)
                    SupabasePropertyService.getProperties({ status: 'Active', limit: 1000 }),
                    // Exclusivas = propiedades subidas desde la app (no MLS), status = 'Exclusiva'
                    SupabasePropertyService.getProperties({ status: 'Exclusiva', limit: 500 }),
                    supabase.from('zhomes_agents').select('*').order('full_name', { ascending: true }),
                    supabase.from('zhomes_office').select('*').limit(1).single()
                ]);

                // ── Active MLS listings (En Venta) ──
                const supaProps = supaPropsResult.status === 'fulfilled' ? supaPropsResult.value : [];
                if (supaProps.length > 0) {
                    let formattedProps = supaProps.map(p => SupabasePropertyService.formatForApp(p));
                    // Deduplicate by id (service returns ZHomes first)
                    const seen = new Set();
                    formattedProps = formattedProps.filter(p => {
                        if (seen.has(p.id)) return false;
                        seen.add(p.id);
                        return true;
                    });
                    setProperties(formattedProps);
                    const zhomesActive = formattedProps.filter(p => p.exclusive).length;
                    console.log(` Loaded ${formattedProps.length} active MLS properties (${zhomesActive} ZHomes)`);
                } else {
                    console.warn(' Supabase returned 0 active properties');
                    setProperties([]);
                }

                // ── Off Market: propiedades subidas desde la app (no vienen del MLS) ──
                const offMarketProps = offMarketResult.status === 'fulfilled' ? offMarketResult.value : [];
                if (offMarketProps.length > 0) {
                    const formatted = offMarketProps.map(p => SupabasePropertyService.formatForApp(p));
                    setOffMarketListings(formatted);
                    console.log(` Loaded ${formatted.length} off-market (app-uploaded) properties`);
                }

                // ── ZHomes Agents ──
                const supaAgents = agentsResult.status === 'fulfilled' ? (agentsResult.value.data || []) : [];

                if (supaAgents.length > 0) {
                    const agents = supaAgents.map(a => ({
                        id: a.id, name: a.full_name, firstName: a.first_name,
                        lastName: a.last_name, email: a.email, phone: a.phone || '',
                        mlsId: a.mls_id, status: a.status, license: a.license,
                        type: a.member_type, office: a.office_name, bio: a.bio || '',
                        city: a.city || '', state: a.state || '', source: 'Supabase'
                    }));
                    setZhomesAgents(agents);
                    const stats = supaAgents.map(a => ({
                        memberKey: a.id, name: a.full_name,
                        totalClosed: a.total_closed || 0, totalVolume: a.total_volume || 0,
                        avgPrice: a.avg_price || 0, lastCloseDate: a.last_close_date || null,
                        recentDeals: a.recent_deals || []
                    }));
                    setAgentStats(stats);
                    console.log(` Loaded ${agents.length} agents from Supabase`);
                } else {
                    console.warn(' Agents table empty, fetching from Spark...');
                    try {
                        const sparkData = await SparkService.getZHomesAgents();
                        const sparkAgents = sparkData?.value || [];
                        if (sparkAgents.length > 0) {
                            const agents = sparkAgents.map(a => ({
                                id: a.MemberKey, name: a.MemberFullName, firstName: a.MemberFirstName,
                                lastName: a.MemberLastName, email: a.MemberEmail,
                                phone: a.MemberPreferredPhone || a.MemberMobilePhone || '',
                                mlsId: a.MemberMlsId, status: a.MemberStatus, license: a.MemberStateLicense,
                                type: a.MemberType, office: a.OfficeName, bio: a.MemberBio || '',
                                city: a.MemberCity || '', state: a.MemberStateOrProvince || '', source: 'Spark'
                            }));
                            setZhomesAgents(agents);
                            console.log(` Loaded ${agents.length} agents from Spark (fallback)`);
                        }
                    } catch (e) {
                        console.warn(' Could not load agents:', e.message);
                    }
                }

                // ── ZHomes Office ──
                if (officeResult.status === 'fulfilled' && officeResult.value.data) {
                    const o = officeResult.value.data;
                    setZhomesOffice({
                        key: o.id, name: o.name, phone: o.phone, fax: o.fax,
                        email: o.email, address: o.address, city: o.city,
                        state: o.state, zip: o.zip, license: o.license,
                        brokerKey: o.broker_key, mlsId: o.mls_id, status: o.status,
                        source: 'Supabase'
                    });
                    console.log(` Loaded office: ${o.name}`);
                }

            } catch (err) {
                console.warn(' Data loading error:', err.message);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        }
        fetchAllData();
    }, [])

    /**
     * Add a new Off Market property — saves to Supabase mls_properties
     * with status='Off Market' and is_zhomes=true (always a ZHomes listing)
     */
    const addProperty = async (newProperty) => {
        try {
            const row = {
                address: newProperty.address || '',
                city: newProperty.city || 'Louisville',
                state: newProperty.state || 'KY',
                zip: newProperty.zip || null,
                price: Number(newProperty.price) || null,
                beds: Number(newProperty.beds) || 0,
                baths: Number(newProperty.baths) || 0,
                sqft: Number(newProperty.sqft) || 0,
                description: newProperty.description || null,
                primary_photo: newProperty.image || null,
                photos: newProperty.image ? [newProperty.image] : null,
                status: 'Exclusiva',
                property_subtype: newProperty.type || 'Single Family',
                is_zhomes: true,    // Off Market properties are always ZHomes exclusives
                spark_source: 'app',
                list_agent_name: newProperty.agentName || null,
                lat: newProperty.lat || null,
                lng: newProperty.lng || null,
                sync_timestamp: new Date().toISOString(),
                list_date: new Date().toISOString().split('T')[0],
            };

            const { data, error } = await supabase
                .from('mls_properties')
                .insert(row)
                .select()
                .single();

            if (error) throw error;

            // Add to local state immediately
            const formatted = SupabasePropertyService.formatForApp(data);
            setOffMarketListings(prev => [formatted, ...prev]);
            console.log(' Off Market property saved to Supabase:', data.id);
            return formatted;
        } catch (err) {
            console.error(' Failed to save off-market property:', err.message);
            // Fallback: add locally
            const localProp = {
                id: `local-${Date.now()}`,
                ...newProperty,
                status: 'Exclusiva',
                exclusive: true,
                images: [newProperty.image].filter(Boolean),
                postedAt: new Date().toISOString()
            };
            setOffMarketListings(prev => [localProp, ...prev]);
            return localProp;
        }
    }

    const zhomesListings = properties.filter(p => p.exclusive)
    const mlsListings = properties.filter(p => !p.exclusive)

    return (
        <PropertyContext.Provider value={{
            properties,
            loading,
            addProperty,
            zhomesAgents,
            zhomesOffice,
            zhomesListings,
            mlsListings,
            offMarketListings,   // NEW: app-uploaded off market (Fix&Flip, exclusives)
            agentStats
        }}>
            {children}
        </PropertyContext.Provider>
    )
}

