import { useState, useEffect } from 'react'
import { Filter, MapPin, Search, Heart, ChevronRight, Home, Building, Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { SparkService } from '../../../services/sparkService'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './PropertiesPageMobile.css'

export default function PropertiesPageMobile() {
    const [filter, setFilter] = useState('Casas');
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

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
                <button className="mpp-filter-btn"><Filter size={18} /></button>
            </div>

            <div className="mpp-quick-filters">
                <button className={filter === 'Apartamentos' ? 'active' : ''} onClick={() => setFilter('Apartamentos')}>
                    <Building size={14} className="filter-icon" /> Apartamentos
                </button>
                <button className={filter === 'Casas' ? 'active' : ''} onClick={() => setFilter('Casas')}>
                    <Home size={14} className="filter-icon" /> Casas
                </button>
                <button className={filter === 'Lotes' ? 'active' : ''} onClick={() => setFilter('Lotes')}>
                    <Map size={14} className="filter-icon" /> Lotes
                </button>
            </div>

            <div className="mpp-list-header">
                <h2>Top Propiedades</h2>
                <button>Ver todo</button>
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
