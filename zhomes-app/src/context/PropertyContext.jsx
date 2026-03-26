import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_PROPERTIES } from '../data/mockData'
import { SparkService } from '../services/sparkService'
import { SupabasePropertyService } from '../services/supabasePropertyService'

const PropertyContext = createContext()

export function useProperties() {
    return useContext(PropertyContext)
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'

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

    // Fetch properties from Supabase + ZHomes agents from Spark
    useEffect(() => {
        async function fetchAllData() {
            try {
                // Phase 1: Properties from Supabase + Agents/Office from Spark (in parallel)
                const [supaPropsResult, closedPropsResult, agentsData, officeData] = await Promise.allSettled([
                    SupabasePropertyService.getProperties({ limit: 500 }),
                    SupabasePropertyService.getProperties({ status: 'Closed', limit: 500 }),
                    SparkService.getZHomesAgents(),
                    SparkService.getZHomesOffice()
                ]);

                // ── Process Properties from Supabase ──
                const supaProps = supaPropsResult.status === 'fulfilled' ? supaPropsResult.value : [];
                
                if (supaProps.length > 0) {
                    const formattedProps = supaProps.map(p => SupabasePropertyService.formatForApp(p));
                    
                    // Sort: ZHomes listings first, then by price descending
                    formattedProps.sort((a, b) => {
                        if (a.exclusive && !b.exclusive) return -1;
                        if (!a.exclusive && b.exclusive) return 1;
                        return b.price - a.price;
                    });

                    setProperties(formattedProps);
                    console.log(`✅ Loaded ${formattedProps.length} properties from Supabase`);
                } else {
                    console.warn("⚠️ Supabase returned 0 results, using mock data");
                    setProperties(normalizedMock);
                }

                // ── Process Closed Properties ── 
                const closedProps = closedPropsResult.status === 'fulfilled' ? closedPropsResult.value : [];
                if (closedProps.length > 0) {
                    const formattedClosed = closedProps.map(p => SupabasePropertyService.formatForApp(p));
                    setClosedListings(formattedClosed);
                    setAllZHomesHistory(formattedClosed.filter(p => p.exclusive));
                    console.log(`✅ Loaded ${formattedClosed.length} closed properties from Supabase`);
                }

                // ── Process ZHomes Agents ──
                const agents = agentsData.status === 'fulfilled' ? agentsData.value : null;
                const agentList = agents?.value || [];
                if (agentList.length > 0) {
                    const formattedAgents = agentList.map(a => ({
                        id: a.MemberKey,
                        name: a.MemberFullName,
                        firstName: a.MemberFirstName,
                        lastName: a.MemberLastName,
                        email: a.MemberEmail,
                        phone: a.MemberPreferredPhone || a.MemberMobilePhone || a.MemberOfficePhone || '',
                        mlsId: a.MemberMlsId,
                        status: a.MemberStatus,
                        license: a.MemberStateLicense,
                        type: a.MemberLocalType || a.MemberType,
                        office: a.OfficeName,
                        bio: a.MemberBio || '',
                        address: a.MemberAddress1 || '',
                        city: a.MemberCity || '',
                        state: a.MemberStateOrProvince || '',
                        zip: a.MemberPostalCode || '',
                        source: 'MLS'
                    }));
                    setZhomesAgents(formattedAgents);
                    console.log(`✅ Loaded ${formattedAgents.length} ZHomes agents from MLS`);
                }

                // ── Process ZHomes Office ──
                const office = officeData.status === 'fulfilled' ? officeData.value : null;
                if (office && office.OfficeName) {
                    setZhomesOffice({
                        key: office.OfficeKey,
                        name: office.OfficeName,
                        phone: office.OfficePhone,
                        fax: office.OfficeFax,
                        email: office.OfficeEmail,
                        address: office.OfficeAddress1,
                        city: office.OfficeCity,
                        state: office.OfficeStateOrProvince,
                        zip: office.OfficePostalCode,
                        license: office.OfficeCorporateLicense,
                        brokerKey: office.OfficeBrokerKey,
                        mlsId: office.OfficeMlsId,
                        status: office.OfficeStatus,
                        source: 'MLS'
                    });
                    console.log(`✅ Loaded ZHomes office: ${office.OfficeName}`);
                }

            } catch (err) {
                console.warn("⚠️ Data loading error, using mock data:", err.message);
                setProperties(normalizedMock);
            } finally {
                setLoading(false);
            }
        }
        fetchAllData();
    }, [])

    // ── Phase 2: Load agent stats (after agents loaded) ──
    useEffect(() => {
        if (loading || zhomesAgents.length === 0) return;

        async function fetchAgentStats() {
            try {
                const rawAgents = zhomesAgents.map(a => ({ MemberKey: a.id, MemberFullName: a.name }));
                const stats = await SparkService.getAllAgentStats(rawAgents);
                setAgentStats(stats);
                console.log(`✅ Loaded performance stats for ${stats.length} agents`);
            } catch (err) {
                console.warn('⚠️ Error loading agent stats:', err.message);
            }
        }
        fetchAgentStats();
    }, [loading, zhomesAgents])

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

    // Derived data
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
