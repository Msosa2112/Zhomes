import { useState, useMemo, useEffect } from 'react'
import { Filter, MapPin, Search, Heart, ChevronRight, Home, Building, Map, ChevronDown, Tag, Lock } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react'
import { useProperties } from '../../../context/PropertyContext'
import { supabase } from '../../../lib/supabaseClient'
import AddressAutocomplete from '../../../components/shared/AddressAutocomplete'
import ZSlider from '../../../components/ui/ZSlider'
import './PropertiesPageMobile.css'

const formatPricePill = (price) => {
    if (!price) return '$0';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}M`;
    if (price >= 1000) return `$${Math.round(price / 1000)}K`;
    return `$${price}`;
};

const extractAIHighlights = (desc) => {
    if (!desc) return ['Luz natural', 'Excelente ubicación']
    const d = desc.toLowerCase()
    const traits = []
    if (d.includes('renovat') || d.includes('remodel')) traits.push('Recién remodelado')
    if (d.includes('pool') || d.includes('piscina')) traits.push('Piscina privada')
    if (d.includes('patio') || d.includes('yard')) traits.push('Patio amplio')
    if (d.includes('granite') || d.includes('stainless')) traits.push('Cocina moderna')
    if (d.includes('quiet') || d.includes('peaceful')) traits.push('Zona residencial tranquila')
    if (d.includes('view') || d.includes('vista')) traits.push('Vistas increíbles')
    if (d.includes('garage')) traits.push('Garaje privado')
    while (traits.length < 2) traits.push(traits.length === 0 ? 'Luz natural' : 'Espacios abiertos')
    return traits.slice(0, 3)
}

const normalize = (p, offMarket = false) => ({
    id: String(p.id),
    address: p.address || 'Dirección no disponible',
    city: p.city || 'Louisville, KY',
    price: p.price || 0,
    image: p.image || p.primary_photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
    beds: p.beds || 0,
    baths: p.baths || 0,
    sqft: p.sqft || 0,
    type: p.type || p.property_type || '',
    exclusive: p.exclusive || false,
    status: p.status || (offMarket ? 'Closed' : 'Active'),
    offMarket,
    aiBullets: extractAIHighlights(p.description || p.remarks),
    commuteMins: Math.floor(Math.random() * 20) + 12,
})

export default function PropertiesPageMobile() {
    const { properties: globalProperties, offMarketListings, loading: ctxLoading } = useProperties()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [typeFilter, setTypeFilter] = useState('Casas')
    const [showOffMarket, setShowOffMarket] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [activePopup, setActivePopup] = useState(null)
    const [bedFilter, setBedFilter] = useState('Cualquiera')
    const [bathFilter, setBathFilter] = useState('Cualquiera')
    const [priceMin, setPriceMin] = useState(0)
    const [priceMax, setPriceMax] = useState(2000000)
    const [sqftMin, setSqftMin] = useState(0)
    const [sqftMax, setSqftMax] = useState(10000)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '')

    const [user, setUser] = useState(null)
    const [favorites, setFavorites] = useState([])
    const [favToast, setFavToast] = useState(null)

    const showToast = (msg, isError = false) => {
        setFavToast({ msg, isError })
        setTimeout(() => setFavToast(null), 4000)
    }

    useEffect(() => {
        const checkUserAndFavs = async () => {
            let activeUser = null;
            const demoUser = localStorage.getItem('zhomes_demo_user');
            if (demoUser) {
                activeUser = JSON.parse(demoUser);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                activeUser = session?.user || null;
            }
            if (activeUser) {
                setUser(activeUser)
                // Only fetch favorites for real Supabase users (not demo)
                if (!activeUser.isDemo && activeUser.id && activeUser.id !== 'demo-client-001') {
                    const { data: favs, error } = await supabase
                        .from('user_favorites')
                        .select('property_id')
                        .eq('user_id', activeUser.id)
                    if (error) {
                        console.error('[ZH-FAV] Error loading favorites:', error)
                    }
                    if (favs) {
                        setFavorites(favs.map(f => String(f.property_id)))
                    }
                }
            }
        }
        checkUserAndFavs()
    }, [])

    const toggleFavorite = async (e, propertyId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            navigate('/login')
            return
        }

        // Demo users can't save favorites
        if (user.isDemo || user.id === 'demo-client-001') {
            showToast('Regístrate con email para guardar favoritos', true)
            return
        }

        const pid = String(propertyId)
        const isFav = favorites.includes(pid)

        if (isFav) {
            // Remove favorite
            setFavorites(prev => prev.filter(id => id !== pid))
            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', pid)
            if (error) {
                console.error('[ZH-FAV] Delete error:', error)
                setFavorites(prev => [...prev, pid])
                showToast('Error al quitar favorito: ' + error.message, true)
            } else {
                showToast('Eliminada de favoritos')
            }
        } else {
            // Add favorite
            setFavorites(prev => [...prev, pid])
            const { error } = await supabase
                .from('user_favorites')
                .insert({ user_id: user.id, property_id: pid })
            if (error) {
                console.error('[ZH-FAV] Insert error:', JSON.stringify(error))
                // If it's a duplicate, that's fine - it's already saved
                if (error.code === '23505') {
                    showToast('¡Ya la tenías guardada!')
                } else {
                    setFavorites(prev => prev.filter(id => id !== pid))
                    showToast('Error: ' + error.message, true)
                }
            } else {
                showToast('♥ Guardada en favoritos')
            }
        }
    }

    const getPercent = (val, min, max) => Math.round(((val - min) / (max - min)) * 100)

    // ── Build the correct property pools ──
    const { activePool, offMarketPool } = useMemo(() => {
        const active = (globalProperties || []).map(p => normalize(p, false))
        // Off Market = propiedades subidas desde la app (Fix&Flip, Exclusivas, etc.)
        const offMarket = (offMarketListings || []).map(p => normalize(p, true))

        return { activePool: active, offMarketPool: offMarket }
    }, [globalProperties, offMarketListings])

    const applyFilters = (pool) => {
        let filtered = [...pool]
        const typeStr = (p) => String(p.type || '').toLowerCase()

        if (typeFilter === 'Apartamentos') {
            filtered = filtered.filter(p => {
                const t = typeStr(p)
                return t.includes('condo') || t.includes('apartment') || t.includes('townhouse') || t.includes('townhome')
            })
        } else if (typeFilter === 'Lotes') {
            filtered = filtered.filter(p => {
                const t = typeStr(p)
                return t.includes('land') || t.includes('lot') || t.includes('farm') || t.includes('acreage')
            })
        } else {
            // 'Casas' = default: exclude condos and land, include everything else
            filtered = filtered.filter(p => {
                const t = typeStr(p)
                const isCondo = t.includes('condo') || t.includes('apartment') || t.includes('townhouse') || t.includes('townhome')
                const isLand = t.includes('land') || t.includes('lot') || t.includes('farm') || t.includes('acreage')
                return !isCondo && !isLand
            })
        }

        if (bedFilter !== 'Cualquiera') {
            const min = parseInt(bedFilter)
            if (!isNaN(min)) filtered = filtered.filter(p => p.beds >= min)
        }
        if (bathFilter !== 'Cualquiera') {
            const min = parseInt(bathFilter)
            if (!isNaN(min)) filtered = filtered.filter(p => p.baths >= min)
        }
        if (priceMin > 0) filtered = filtered.filter(p => p.price >= priceMin)
        if (priceMax < 2000000) filtered = filtered.filter(p => p.price <= priceMax)
        if (sqftMin > 0) filtered = filtered.filter(p => p.sqft >= sqftMin)
        if (sqftMax < 10000) filtered = filtered.filter(p => p.sqft <= sqftMax)

        if (searchQuery.trim()) {
            const qStr = searchQuery.toLowerCase();
            const terms = qStr.split(',').map(t => t.trim()).filter(t => t.length > 2); // Ignore very short parts like "KY" vs noise if they are just 2 letters alone wait no, zip/state is 2 letters. Let's use 1 letter.
            const allTerms = qStr.split(/[,\s]+/).filter(t => t.length > 1);

            filtered = filtered.filter(p => {
                const searchArea = `${p.address} ${p.city} ${p.zip || ''} ${p.type || ''}`.toLowerCase();
                
                // Direct full match (if typing manually "123 Main St")
                if (searchArea.includes(qStr)) return true;
                
                // If the user selected an autocomplete item, it's comma separated: "123 Main St, Miami, FL"
                if (terms.length > 0) {
                    // If any comma separated chunk exists in the search area ("123 main st" or "miami")
                    // But we want to ensure we don't just match "united states".
                    // Properties won't output "united states" in searchArea, so it safely returns false for that.
                    return terms.some(part => searchArea.includes(part));
                }

                // Fallback to basic word intersection for extreme cases
                if (allTerms.length > 0) {
                    return allTerms.some(part => searchArea.includes(part));
                }

                return false;
            });
        }

        return filtered
    }

    const displayProperties = useMemo(() => {
        const pool = showOffMarket ? offMarketPool : activePool
        const filtered = applyFilters(pool)
        
        let exactMatches = []
        let excl = []
        let rest = []

        if (searchQuery.trim()) {
            const qStrList = searchQuery.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0)
            const mainAddress = qStrList.length > 0 ? qStrList[0] : ''

            filtered.forEach(p => {
                const pAddress = p.address.toLowerCase()
                // Coincidencia prioritaria si la dirección tipeada es parte de la dirección de la propiedad
                if (mainAddress && pAddress.includes(mainAddress)) {
                    exactMatches.push(p)
                } else if (p.exclusive) {
                    excl.push(p)
                } else {
                    rest.push(p)
                }
            })
            return [...exactMatches, ...excl, ...rest]
        }

        // ZHomes exclusives always first
        excl = filtered.filter(p => p.exclusive)
        const others = filtered.filter(p => !p.exclusive)

        // Target $180k-$450k priority randomly for mass appeal
        const targetRangeProps = []
        const remainingProps = []

        others.forEach(p => {
            if (p.price >= 180000 && p.price <= 450000) {
                targetRangeProps.push(p)
            } else {
                remainingProps.push(p)
            }
        })

        // Pseudo-random stable sort based on UUIDs for the target range to shuffle them up nicely without jumping
        targetRangeProps.sort((a, b) => String(a.id).localeCompare(String(b.id)))
        // Sort remaining props starting from cheapest to most expensive, so $2M+ are at the end
        remainingProps.sort((a, b) => a.price - b.price)

        return [...excl, ...targetRangeProps, ...remainingProps]
    }, [showOffMarket, activePool, offMarketPool, typeFilter, bedFilter, bathFilter, priceMin, priceMax, sqftMin, sqftMax, searchQuery])

    const isLoading = ctxLoading

    return (
        <div className="mobile-props-page">
            {/* Toast notification for favorites */}
            {favToast && (
                <div style={{
                    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, padding: '10px 20px', borderRadius: '12px',
                    background: favToast.isError ? '#ef4444' : '#10b981',
                    color: 'white', fontWeight: 600, fontSize: '0.85rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '90vw',
                    textAlign: 'center', animation: 'slideDown 0.3s ease'
                }}>
                    {favToast.msg}
                </div>
            )}
            {/* ── Search bar ── */}
            <div className="mpp-header">
                <form className="mpp-search-bar" onSubmit={(e) => e.preventDefault()} style={{ flex: 1, margin: 0 }}>
                    <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
                    <AddressAutocomplete 
                        value={searchQuery} 
                        onChange={setSearchQuery} 
                        onSelect={setSearchQuery}
                        placeholder="Buscar por dirección o ciudad..." 
                    />
                </form>
                <motion.button
                    className="mpp-filter-btn"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{ borderRadius: '24px' }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Filter size={18} />
                </motion.button>
            </div>

            {/* ── Active / Off-Market toggle ── */}
            <div style={{ padding: '0 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                    onClick={() => setShowOffMarket(false)}
                    style={{
                        padding: '7px 16px',
                        borderRadius: 20,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        background: !showOffMarket ? 'var(--zhomes-red)' : 'var(--bg-tertiary)',
                        color: !showOffMarket ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                    }}
                >
                    <Tag size={13} /> En Venta
                    {!showOffMarket && (
                        <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                            {activePool.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setShowOffMarket(true)}
                    style={{
                        padding: '7px 16px',
                        borderRadius: 20,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        background: showOffMarket ? '#6366F1' : 'var(--bg-tertiary)',
                        color: showOffMarket ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                    }}
                >
                    <Lock size={13} /> Exclusivas
                    {showOffMarket && (
                        <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                            {offMarketPool.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Advanced filters overlay ── */}
            <AnimatePresence>
                {showAdvancedFilters && (
                    <motion.div
                        key="overlay"
                        className="mpp-dropdown-overlay"
                        onClick={() => setShowAdvancedFilters(false)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showAdvancedFilters && (
                    <motion.div
                        key="modal"
                        className="mpp-adv-dropdown-menu"
                        style={{ borderRadius: '24px', background: 'var(--bg-card)' }}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <div className="mpp-adv-dropdown-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', color: 'var(--zhomes-red)' }}><Filter size={18} /></div>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Filtros Avanzados</span>
                            </div>
                        </div>
                        <div className="mpp-adv-dropdown-body">
                            <div className="mpp-adv-group">
                                <label>Comodidades</label>
                                <div className="mpp-adv-checkboxes">
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Piscina</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Garaje</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Sótano</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Sin HOA</span></label>
                                </div>
                            </div>
                            <button className="mpp-adv-submit" onClick={() => setShowAdvancedFilters(false)}>Cerrar y Aplicar</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Type filters ── */}
            <div className="mpp-quick-filters">
                <button className={typeFilter === 'Casas' ? 'active' : ''} onClick={() => setTypeFilter('Casas')}>
                    <Home size={14} className="filter-icon" /> Casas
                </button>
                <button className={typeFilter === 'Apartamentos' ? 'active' : ''} onClick={() => setTypeFilter('Apartamentos')}>
                    <Building size={14} className="filter-icon" /> Apartamentos
                </button>
                <button className={typeFilter === 'Lotes' ? 'active' : ''} onClick={() => setTypeFilter('Lotes')}>
                    <Map size={14} className="filter-icon" /> Lotes
                </button>
            </div>

            {/* ── Secondary filters ── */}
            <div className="mpp-secondary-filters">
                <button className={`mpp-sec-filter-btn ${activePopup === 'cuartos' ? 'active' : ''}`} onClick={() => setActivePopup(activePopup === 'cuartos' ? null : 'cuartos')}>
                    {bedFilter !== 'Cualquiera' ? `${bedFilter} Cuartos` : 'Cuartos'} <ChevronDown size={14} />
                </button>
                <button className={`mpp-sec-filter-btn ${activePopup === 'banos' ? 'active' : ''}`} onClick={() => setActivePopup(activePopup === 'banos' ? null : 'banos')}>
                    {bathFilter !== 'Cualquiera' ? `${bathFilter} Baños` : 'Baños'} <ChevronDown size={14} />
                </button>
                <button className={`mpp-sec-filter-btn ${activePopup === 'sqft' ? 'active' : ''}`} onClick={() => setActivePopup(activePopup === 'sqft' ? null : 'sqft')}>
                    Sqft <ChevronDown size={14} />
                </button>
                <button className={`mpp-sec-filter-btn ${activePopup === 'precio' ? 'active' : ''}`} onClick={() => setActivePopup(activePopup === 'precio' ? null : 'precio')}>
                    Precio <ChevronDown size={14} />
                </button>
            </div>

            {activePopup && (
                <div className="mpp-filter-panel">
                    {activePopup === 'cuartos' && (
                        <div className="mpp-panel-content">
                            <h3>Habitaciones</h3>
                            <div className="mpp-panel-options">
                                {['Cualquiera', '1+', '2+', '3+', '4+', '5+'].map(val => (
                                    <button key={val} className={bedFilter === val ? 'active' : ''} onClick={() => setBedFilter(val)}>{val}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {activePopup === 'banos' && (
                        <div className="mpp-panel-content">
                            <h3>Baños</h3>
                            <div className="mpp-panel-options">
                                {['Cualquiera', '1+', '2+', '3+', '4+', '5+'].map(val => (
                                    <button key={val} className={bathFilter === val ? 'active' : ''} onClick={() => setBathFilter(val)}>{val}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {activePopup === 'precio' && (
                        <div className="mpp-panel-content">
                            <h3>Rango de Precio</h3>
                            <ZSlider
                                value={[priceMin, priceMax]}
                                min={0}
                                max={2000000}
                                step={10000}
                                onChange={([lo, hi]) => { setPriceMin(lo); setPriceMax(hi) }}
                                formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                            />
                            <div className="mpp-exact-inputs">
                                <label>Min <input
                                    type="number"
                                    value={priceMin || ''}
                                    min={0} max={priceMax}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/^0+(?!$)/, '');
                                        const v = raw === '' ? 0 : parseInt(raw, 10);
                                        if (!isNaN(v)) setPriceMin(Math.min(v, priceMax - 10000));
                                    }}
                                /></label>
                                <span>-</span>
                                <label>Max <input
                                    type="number"
                                    value={priceMax || ''}
                                    min={priceMin} max={2000000}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/^0+(?!$)/, '');
                                        const v = raw === '' ? 2000000 : parseInt(raw, 10);
                                        if (!isNaN(v)) setPriceMax(Math.max(v, priceMin + 10000));
                                    }}
                                /></label>
                            </div>
                        </div>
                    )}
                    {activePopup === 'sqft' && (
                        <div className="mpp-panel-content">
                            <h3>Tamaño (Sqft)</h3>
                            <ZSlider
                                value={[sqftMin, sqftMax]}
                                min={0}
                                max={10000}
                                step={100}
                                onChange={([lo, hi]) => { setSqftMin(lo); setSqftMax(hi) }}
                            />
                            <div className="mpp-exact-inputs">
                                <label>Min <input
                                    type="number"
                                    value={sqftMin || ''}
                                    min={0} max={sqftMax}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/^0+(?!$)/, '');
                                        const v = raw === '' ? 0 : parseInt(raw, 10);
                                        if (!isNaN(v)) setSqftMin(Math.min(v, sqftMax - 100));
                                    }}
                                /></label>
                                <span>-</span>
                                <label>Max <input
                                    type="number"
                                    value={sqftMax || ''}
                                    min={sqftMin} max={10000}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/^0+(?!$)/, '');
                                        const v = raw === '' ? 10000 : parseInt(raw, 10);
                                        if (!isNaN(v)) setSqftMax(Math.max(v, sqftMin + 100));
                                    }}
                                /></label>
                            </div>
                        </div>
                    )}
                    <button className="mpp-apply-btn" onClick={() => setActivePopup(null)}>Aplicar Filtro</button>
                </div>
            )}

            {/* ── List header ── */}
            <div className="mpp-list-header">
                <h2>
                    {showOffMarket ? (
                        <><Lock size={16} style={{ marginRight: 6, color: '#6366F1' }} />Exclusivas</>
                    ) : (
                        <><Tag size={16} style={{ marginRight: 6, color: 'var(--zhomes-red)' }} />En Venta</>
                    )}
                    {' '}
                    <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-secondary)' }}>
                        {displayProperties.length} propiedades
                    </span>
                </h2>
                <Link to="/swipe" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--zhomes-red)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none', boxShadow: '0 4px 10px rgba(227,30,36,0.3)' }}>
                    <Heart size={14} fill="currentColor" /> Match
                </Link>
            </div>

            {/* ── Property list ── */}
            <div className="mpp-list">
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--zhomes-red)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        Cargando propiedades...
                    </div>
                )}
                {!isLoading && displayProperties.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <p>No se encontraron propiedades con estos filtros.</p>
                        <button onClick={() => { setBedFilter('Cualquiera'); setBathFilter('Cualquiera'); setPriceMin(0); setPriceMax(2000000); setSqftMin(0); setSqftMax(10000); setSearchQuery('') }}
                            style={{ marginTop: 12, padding: '8px 20px', borderRadius: 20, border: 'none', background: 'var(--zhomes-red)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                            Limpiar filtros
                        </button>
                    </div>
                )}
                {!isLoading && displayProperties.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                    >
                        <Link to={`/propiedades/${p.id}`} className="mgc-card">
                            <img src={p.image} alt={p.address} className="mgc-img" />

                            {/* Status badge */}
                            {(() => {
                                let bg, label
                                if (p.offMarket) {
                                    bg = 'rgba(99,102,241,0.85)'
                                    const s = p.status
                                    label = s === 'Closed' ? <><Lock size={10}/> Vendida</> :
                                            s === 'Cancelled' ? <><Lock size={10}/> Cancelada</> :
                                            s === 'Expired' ? <><Lock size={10}/> Expirada</> :
                                            <><Lock size={10}/> Exclusiva</>
                                } else if (p.exclusive) {
                                    bg = 'var(--zhomes-red)'
                                    label = p.status === 'Pending' ? '🔥 Pending ZHomes' :
                                            p.status === 'Active Under Contract' ? '🔒 Bajo Contrato' :
                                            '⭐ ZHomes'
                                } else {
                                    bg = p.status === 'Pending' ? 'rgba(245,158,11,0.9)' :
                                         p.status === 'Active Under Contract' ? 'rgba(59,130,246,0.85)' :
                                         'rgba(16,185,129,0.85)'
                                    label = p.status === 'Pending' ? '🔥 Pending' :
                                            p.status === 'Active Under Contract' ? '🔒 Bajo Contrato' :
                                            '● En Venta'
                                }
                                return (
                                    <div style={{
                                        position: 'absolute', top: 12, left: 12,
                                        background: bg,
                                        color: '#fff', padding: '3px 10px', borderRadius: 12,
                                        fontSize: 11, fontWeight: 700, backdropFilter: 'blur(6px)',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>{label}</div>
                                )
                            })()}

                            <button 
                                className={`mgc-like-btn ${favorites.includes(String(p.id)) ? 'active' : ''}`}
                                onClick={e => toggleFavorite(e, p.id)}
                            >
                                <Heart size={16} color="var(--zhomes-red)" fill={favorites.includes(String(p.id)) ? "currentColor" : "none"} />
                            </button>

                            <div className="mgc-overlay">
                                <div className="mgc-ai-tags">
                                    {p.aiBullets.slice(0, 2).map((t, idx) => (
                                        <span key={idx} className="mgc-tag">{t}</span>
                                    ))}
                                    <span className="mgc-tag commute">🚗 {p.commuteMins} min</span>
                                </div>
                                <div className="mgc-location-badge"><MapPin size={10} /> {p.city}</div>
                                <h3 className="mgc-addr">{p.address}</h3>
                                <div className="mgc-stats-row">
                                    <span className="mgc-glass-pill">
                                        {p.offMarket && p.closePrice 
                                            ? `${formatPricePill(p.closePrice)} vendida`
                                            : formatPricePill(p.price)}
                                    </span>
                                    <span className="mgc-glass-pill">{p.beds}🛏 {p.baths}🚿</span>
                                    {p.sqft > 0 && <span className="mgc-glass-pill">{p.sqft.toLocaleString()} sqft</span>}
                                </div>
                                <button className="mgc-details-btn">Ver Detalles <ChevronRight size={16} /></button>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <div style={{ height: '120px' }} />
        </div>
    )
}
