import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_PROPERTIES } from '../data/mockData'
import { SupabasePropertyService } from '../services/supabasePropertyService'
import { supabase } from '../lib/supabaseClient'
import { SparkService } from '../services/sparkService'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

export function PropertiesProvider({ children }) {
    // Initialize with normalized mock data as fallback
    const normalizedMock = MOCK_PROPERTIES.map(p => ({
        ...p, id: String(p.id), images: p.images || [p.image],
        status: p.status || 'Active', exclusive: p.exclusive || false
    }))

    const [properties, setProperties] = useState(normalizedMock)
    const [zhomesAgents, setZhomesAgents] = useState([])
    const [zhomesOffice, setZhomesOffice] = useState(null)
    const [closedListings, setClosedListings] = useState([])
    const [allZHomesHistory, setAllZHomesHistory] = useState([])
    const [agentStats, setAgentStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAllData() {
            try {
                // All data comes from Supabase (synced 2x/day from Spark)
                const [supaPropsResult, closedPropsResult, agentsResult, officeResult] = await Promise.allSettled([
                    SupabasePropertyService.getProperties({ limit: 500 }),
                    SupabasePropertyService.getProperties({ status: 'Closed', limit: 500 }),
                    supabase.from('zhomes_agents').select('*').order('total_volume', { ascending: false }),
                    supabase.from('zhomes_office').select('*').limit(1).single()
                ]);

                // ── Properties ──
                const supaProps = supaPropsResult.status === 'fulfilled' ? supaPropsResult.value : [];
                if (supaProps.length > 0) {
                    let formattedProps = supaProps.map(p => SupabasePropertyService.formatForApp(p));
                    const seen = new Set();
                    formattedProps = formattedProps.filter(p => {
                        if (seen.has(p.address)) return false;
                        seen.add(p.address);
                        return true;
                    });
                    formattedProps.sort((a, b) => {
                        if (a.exclusive && !b.exclusive) return -1;
                        if (!a.exclusive && b.exclusive) return 1;
                        return b.price - a.price;
                    });
                    setProperties(formattedProps);
                    console.log(`✅ Loaded ${formattedProps.length} properties from Supabase`);
                } else {
                    console.warn('⚠️ Supabase returned 0 properties, using mock data');
                    setProperties(normalizedMock);
                }

                // ── Closed Listings ──
                const closedProps = closedPropsResult.status === 'fulfilled' ? closedPropsResult.value : [];
                if (closedProps.length > 0) {
                    const formatted = closedProps.map(p => SupabasePropertyService.formatForApp(p));
                    setClosedListings(formatted);
                    setAllZHomesHistory(formatted.filter(p => p.exclusive));
                    console.log(`✅ Loaded ${formatted.length} closed properties from Supabase`);
                }

                // ── ZHomes Agents (from synced table, fallback to Spark) ──
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
                    console.log(`✅ Loaded ${agents.length} agents + stats from Supabase`);
                } else {
                    // Fallback: single Spark call for agent list (table not ready yet)
                    console.warn('⚠️ Agents table empty/unavailable, fetching from Spark (1 call)...');
                    try {
                        const sparkData = await SparkService.getZHomesAgents();
                        const sparkAgents = sparkData?.value || [];
                        if (sparkAgents.length > 0) {
                            const agents = sparkAgents.map(a => ({
                                id: a.MemberKey,
                                name: a.MemberFullName,
                                firstName: a.MemberFirstName,
                                lastName: a.MemberLastName,
                                email: a.MemberEmail,
                                phone: a.MemberPreferredPhone || a.MemberMobilePhone || '',
                                mlsId: a.MemberMlsId,
                                status: a.MemberStatus,
                                license: a.MemberStateLicense,
                                type: a.MemberType,
                                office: a.OfficeName,
                                bio: a.MemberBio || '',
                                city: a.MemberCity || '',
                                state: a.MemberStateOrProvince || '',
                                source: 'Spark'
                            }));
                            setZhomesAgents(agents);
                            console.log(`✅ Loaded ${agents.length} agents from Spark (fallback)`);
                        }
                    } catch (e) {
                        console.warn('⚠️ Could not load agents:', e.message);
                    }
                }


                // ── ZHomes Office (from synced table) ──
                if (officeResult.status === 'fulfilled' && officeResult.value.data) {
                    const o = officeResult.value.data;
                    setZhomesOffice({
                        key: o.id, name: o.name, phone: o.phone, fax: o.fax,
                        email: o.email, address: o.address, city: o.city,
                        state: o.state, zip: o.zip, license: o.license,
                        brokerKey: o.broker_key, mlsId: o.mls_id, status: o.status,
                        source: 'Supabase'
                    });
                    console.log(`✅ Loaded office: ${o.name}`);
                }

            } catch (err) {
                console.warn('⚠️ Data loading error, using mock data:', err.message);
                setProperties(normalizedMock);
            } finally {
                setLoading(false);
            }
        }
        fetchAllData();
    }, [])

    const addProperty = (newProperty) => {
        const newId = Math.max(...properties.map(p => Number(p.id) || 0), 0) + 1
        const propertyWithId = {
            id: String(newId), ...newProperty,
            exclusive: false, images: newProperty.images || [newProperty.image],
            postedAt: new Date().toISOString()
        }
        setProperties(prev => [propertyWithId, ...prev])
        return propertyWithId
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
            closedListings,
            allZHomesHistory,
            agentStats
        }}>
            {children}
        </PropertyContext.Provider>
    )
}
