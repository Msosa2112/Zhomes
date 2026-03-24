import { useState, useEffect } from 'react'
import { Filter, MapPin, Search, Heart, ChevronRight, Home, Building, Map, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { SparkService } from '../../../services/sparkService'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './PropertiesPageMobile.css'

export default function PropertiesPageMobile() {
    const [filter, setFilter] = useState('Casas');
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const [activePopup, setActivePopup] = useState(null); // 'cuartos', 'banos', 'sqft', 'precio'
    const [bedFilter, setBedFilter] = useState('Cualquiera');
    const [bathFilter, setBathFilter] = useState('Cualquiera');
    
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(2000000);
    const [sqftMin, setSqftMin] = useState(0);
    const [sqftMax, setSqftMax] = useState(10000);

    const getPercent = (val, min, max) => Math.round(((val - min) / (max - min)) * 100);

    useEffect(() => {
        let sparkFilter = "MlsStatus Eq 'Active'";
        if (filter === 'Apartamentos') sparkFilter += " And PropertySubType Eq 'Condominium'";
        if (filter === 'Casas') sparkFilter += " And PropertySubType Eq 'Single Family Residence'";
        if (filter === 'Lotes') sparkFilter += " And PropertyType Eq 'Land'";

        setLoading(true);
        SparkService.getActiveListings(sparkFilter, 20)
            .then(data => {
                const results = data.D?.Results;
                if (results && results.length > 0) {
                    setProperties(results.map(p => ({
                        id: String(p.Id),
                        address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                        city: `${p.StandardFields.City || ''}, ${p.StandardFields.StateOrProvince || ''}`,
                        price: p.StandardFields.ListPrice || 0,
                        image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                    })));
                } else {
                    throw new Error("No data returned from Spark API");
                }
            })
            .catch(err => {
                console.warn("Spark API Failed (App Pending Approval). Falling back to mock data.", err);
                setProperties(MOCK_PROPERTIES.sort(() => 0.5 - Math.random()).slice(0, 8));
            })
            .finally(() => setLoading(false));
    }, [filter]);

    return (
        <div className="mobile-props-page">
            <div className="mpp-header">
                <div className="mpp-search-bar">
                    <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
                    <input type="text" placeholder="Buscar propiedades..." />
                </div>
                
                <motion.button 
                    className="mpp-filter-btn" 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{ borderRadius: '24px' }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Filter size={18} />
                </motion.button>
            </div>

            <AnimatePresence>
                {showAdvancedFilters && (
                    <motion.div 
                        key="overlay"
                        className="mpp-dropdown-overlay" 
                        onClick={() => setShowAdvancedFilters(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAdvancedFilters && (
                    <motion.div 
                        key="modal"
                        className="mpp-adv-dropdown-menu"
                        style={{ borderRadius: '24px', background: 'var(--bg-card)' }}
                        initial={{ opacity: 0, scale: 0.95, y: -10, originX: 0.9, originY: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <div className="mpp-adv-dropdown-header">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <div style={{display: 'flex', color: 'var(--zhomes-red)'}}>
                                    <Filter size={18} />
                                </div>
                                <span style={{fontWeight: 700, fontSize:'1rem', color: 'var(--text-primary)'}}>Filtros Avanzados</span>
                            </div>
                        </div>
                        
                        <div className="mpp-adv-dropdown-body">
                            <div className="mpp-adv-group">
                                <label>Ordenar Por</label>
                                <select className="mpp-adv-select">
                                    <option>Más Recientes</option>
                                    <option>Precio: Menor a Mayor</option>
                                    <option>Precio: Mayor a Menor</option>
                                </select>
                            </div>
                            
                            <div className="mpp-adv-group">
                                <label>Comodidades</label>
                                <div className="mpp-adv-checkboxes">
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Piscina</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Garaje</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Sótano</span></label>
                                    <label className="mpp-adv-checkplate"><input type="checkbox" /> <span>Sin HOA</span></label>
                                </div>
                            </div>

                            <div className="mpp-adv-group">
                                <label>Año de Construcción</label>
                                <div style={{display: 'flex', gap: '8px'}}>
                                    <input type="number" placeholder="Min" className="mpp-adv-input" style={{flex: 1}}/>
                                    <input type="number" placeholder="Max" className="mpp-adv-input" style={{flex: 1}}/>
                                </div>
                            </div>
                            
                            <button className="mpp-adv-submit" onClick={() => setShowAdvancedFilters(false)}>Cerrar y Aplicar</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mpp-quick-filters">
                <button className={filter === 'Casas' ? 'active' : ''} onClick={() => setFilter('Casas')}>
                    <Home size={14} className="filter-icon" /> Casas
                </button>
                <button className={filter === 'Apartamentos' ? 'active' : ''} onClick={() => setFilter('Apartamentos')}>
                    <Building size={14} className="filter-icon" /> Apartamentos
                </button>
                <button className={filter === 'Lotes' ? 'active' : ''} onClick={() => setFilter('Lotes')}>
                    <Map size={14} className="filter-icon" /> Lotes
                </button>
            </div>

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
                            <h3>Cantidad de Habitaciones</h3>
                            <div className="mpp-panel-options">
                                {['Cualquiera', '1+', '2+', '3+', '4+', '5+'].map(val => (
                                    <button key={val} className={bedFilter === val ? 'active' : ''} onClick={() => setBedFilter(val)}>{val}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {activePopup === 'banos' && (
                        <div className="mpp-panel-content">
                            <h3>Cantidad de Baños</h3>
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
                            <div className="mpp-dual-slider">
                                <div className="mpp-slider-track"></div>
                                <div className="mpp-slider-range" style={{ 
                                    left: `${getPercent(priceMin, 0, 2000000)}%`, 
                                    width: `${getPercent(priceMax, 0, 2000000) - getPercent(priceMin, 0, 2000000)}%` 
                                }}></div>
                                <input 
                                    type="range" min="0" max="2000000" step="10000" 
                                    value={priceMin} 
                                    onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10000))} 
                                />
                                <input 
                                    type="range" min="0" max="2000000" step="10000" 
                                    value={priceMax} 
                                    onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10000))} 
                                />
                            </div>
                            <div className="mpp-exact-inputs">
                                <label>
                                    Min
                                    <input type="number" value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} />
                                </label>
                                <span>-</span>
                                <label>
                                    Max
                                    <input type="number" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} />
                                </label>
                            </div>
                        </div>
                    )}
                    {activePopup === 'sqft' && (
                        <div className="mpp-panel-content">
                            <h3>Tamaño (Sqft)</h3>
                            <div className="mpp-dual-slider">
                                <div className="mpp-slider-track"></div>
                                <div className="mpp-slider-range" style={{ 
                                    left: `${getPercent(sqftMin, 0, 10000)}%`, 
                                    width: `${getPercent(sqftMax, 0, 10000) - getPercent(sqftMin, 0, 10000)}%` 
                                }}></div>
                                <input 
                                    type="range" min="0" max="10000" step="100" 
                                    value={sqftMin} 
                                    onChange={(e) => setSqftMin(Math.min(Number(e.target.value), sqftMax - 100))} 
                                />
                                <input 
                                    type="range" min="0" max="10000" step="100" 
                                    value={sqftMax} 
                                    onChange={(e) => setSqftMax(Math.max(Number(e.target.value), sqftMin + 100))} 
                                />
                            </div>
                            <div className="mpp-exact-inputs">
                                <label>
                                    Min
                                    <input type="number" value={sqftMin} onChange={e => setSqftMin(Number(e.target.value))} />
                                </label>
                                <span>-</span>
                                <label>
                                    Max
                                    <input type="number" value={sqftMax} onChange={e => setSqftMax(Number(e.target.value))} />
                                </label>
                            </div>
                        </div>
                    )}
                    <button className="mpp-apply-btn" onClick={() => setActivePopup(null)}>Aplicar Filtro</button>
                </div>
            )}

            <div className="mpp-list-header">
                <h2>Top Propiedades</h2>
                <Link to="/swipe" style={{display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--zhomes-red)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none', boxShadow: '0 4px 10px rgba(227,30,36,0.3)'}}>
                    <Heart size={14} fill="currentColor" /> Zhomes Match
                </Link>
            </div>

            <div className="mpp-list">
                {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Buscando propiedades en tiempo real...</div>}
                {!loading && properties.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No se encontraron propiedades.</div>}
                {!loading && properties.map((p, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        key={p.id}
                    >
                        <Link to={`/propiedades/${p.id}`} className="mgc-card">
                            <img src={p.image} alt={p.address} className="mgc-img" />
                            
                            <button className="mgc-like-btn" onClick={(e)=>{e.preventDefault();}}>
                                <Heart size={16} color="var(--zhomes-red)" />
                            </button>

                            <div className="mgc-overlay">
                                <div className="mgc-location-badge">
                                    <MapPin size={10} /> {p.city}
                                </div>
                                <h3 className="mgc-addr">{p.address}</h3>
                                
                                <div className="mgc-stats-row">
                                    <span className="mgc-glass-pill">${(p.price/1000).toFixed(1)}k/m</span>
                                    <span className="mgc-glass-pill">⭐ {(4.5 + Math.random()*0.5).toFixed(1)} revs</span>
                                </div>

                                <button className="mgc-details-btn">
                                    Ver Detalles <ChevronRight size={16} />
                                </button>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            {/* Scroll clearance */}
            <div style={{ height: '120px' }} />
        </div>
    )
}
