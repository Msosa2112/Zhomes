import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin, Heart, ChevronDown, Users, Map, LayoutGrid, BedDouble, Bath, Maximize } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useProperties } from '../../context/PropertyContext'
import RealtorRevealModal from '../../components/public/RealtorRevealModal'
import './PropertiesPage.css'

function formatPrice(p) {
    return '$' + p.toLocaleString()
}

// Icono personalizado para markers del mapa
function createPriceIcon(price, exclusive) {
    return new DivIcon({
        className: 'map-price-marker',
        html: `<div class="price-pin ${exclusive ? 'exclusive' : ''}">${formatPrice(price)}</div>`,
        iconSize: [90, 36],
        iconAnchor: [45, 36],
    })
}

export default function PropertiesPage() {
    const [zhomesOnly, setZhomesOnly] = useState(false)
    const [priceRange, setPriceRange] = useState([100000, 1000000])
    const [favorites, setFavorites] = useState(new Set())
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [viewMode, setViewMode] = useState('grid')
    const [realtorModalOpen, setRealtorModalOpen] = useState(false)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const { properties } = useProperties()

    const filtered = properties.filter(p => {
        if (zhomesOnly && !p.exclusive) return false
        if (p.price < priceRange[0] || p.price > priceRange[1]) return false
        return true
    })

    const toggleFav = (id, e) => {
        if (e) e.stopPropagation()
        setFavorites(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const handleContactRealtor = (prop, e) => {
        if (e) e.stopPropagation()
        setSelectedProperty(prop)
        setRealtorModalOpen(true)
    }

    const mapCenter = [38.2527, -85.7585]

    return (
        <div className="properties-page">
            {/* Header */}
            <div className="properties-hero">
                <h1 className="animate-fadeInUp">
                    Encuentra Tu <span className="text-red">Propiedad</span>
                </h1>
                <p className="animate-fadeInUp delay-1">
                    Explora las mejores propiedades disponibles en Louisville y alrededores.
                </p>
            </div>

            {/* Filters */}
            <div className="filters-bar animate-fadeInDown delay-2">
                <div className="filters-main">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar por dirección, ciudad..." className="input" />
                    </div>

                    <div className="zhomes-toggle" onClick={() => setZhomesOnly(!zhomesOnly)}>
                        <span className={`toggle-track ${zhomesOnly ? 'active' : ''}`}>
                            <span className="toggle-thumb"></span>
                        </span>
                        <span className={`toggle-label ${zhomesOnly ? 'active' : ''}`}>Solo ZHOMES</span>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Vista grid"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                            onClick={() => setViewMode('map')}
                            title="Vista mapa"
                        >
                            <Map size={16} />
                        </button>
                    </div>

                    <button className="btn btn-ghost" onClick={() => setFiltersOpen(!filtersOpen)}>
                        <SlidersHorizontal size={16} />
                        Filtros
                        <ChevronDown size={14} style={{ transform: filtersOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                {filtersOpen && (
                    <div className="filters-expanded animate-fadeIn">
                        <div className="filter-group">
                            <label>Precio Mínimo</label>
                            <input type="range" min="50000" max="1000000" step="25000" value={priceRange[0]}
                                onChange={e => setPriceRange([+e.target.value, priceRange[1]])} className="range-input" />
                            <span className="range-value">{formatPrice(priceRange[0])}</span>
                        </div>
                        <div className="filter-group">
                            <label>Precio Máximo</label>
                            <input type="range" min="50000" max="2000000" step="25000" value={priceRange[1]}
                                onChange={e => setPriceRange([priceRange[0], +e.target.value])} className="range-input" />
                            <span className="range-value">{formatPrice(priceRange[1])}</span>
                        </div>
                        <div className="filter-group">
                            <label>Habitaciones</label>
                            <div className="filter-chips">
                                {['Cualquiera', '2+', '3+', '4+', '5+'].map(v => (
                                    <button key={v} className="chip">{v}</button>
                                ))}
                            </div>
                        </div>
                        <div className="filter-group">
                            <label>Baños</label>
                            <div className="filter-chips">
                                {['Cualquiera', '1+', '2+', '3+', '4+'].map(v => (
                                    <button key={v} className="chip">{v}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="results-count animate-fadeIn delay-3">
                <p>{filtered.length} propiedades encontradas</p>
            </div>

            {/* MAP VIEW */}
            {viewMode === 'map' && (
                <div className="map-section animate-fadeIn">
                    <div className="map-wrapper">
                        <MapContainer center={mapCenter} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl={true}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            {filtered.map(prop => (
                                <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={createPriceIcon(prop.price, prop.exclusive)}>
                                    <Popup>
                                        <div className="map-popup">
                                            <img src={prop.image} alt={prop.address} />
                                            <div className="map-popup-info">
                                                <h4>{prop.address}</h4>
                                                <p>{prop.city}</p>
                                                <span className="map-popup-price">{formatPrice(prop.price)}</span>
                                                <div className="map-popup-specs">
                                                    <span>{prop.beds} hab</span>
                                                    <span>·</span>
                                                    <span>{prop.baths} baños</span>
                                                    <span>·</span>
                                                    <span>{prop.sqft.toLocaleString()} sqft</span>
                                                </div>
                                                <button className="btn btn-primary map-popup-btn"
                                                    onClick={() => { setSelectedProperty(prop); setRealtorModalOpen(true); }}>
                                                    <Users size={14} />
                                                    Contactar Realtor
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                    <div className="map-side-list">
                        {filtered.map(prop => (
                            <div key={prop.id} className="map-list-card" onClick={(e) => handleContactRealtor(prop, e)}>
                                <img src={prop.image} alt="" />
                                <div className="mlc-info">
                                    <span className="mlc-price">{formatPrice(prop.price)}</span>
                                    <span className="mlc-address">{prop.address}</span>
                                    <span className="mlc-specs">{prop.beds}h · {prop.baths}b · {prop.sqft.toLocaleString()}sqft</span>
                                </div>
                                {prop.exclusive && <span className="mlc-badge">Z</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GRID VIEW — Nuevo diseño de cards */}
            {viewMode === 'grid' && (
                <div className="properties-grid">
                    {filtered.map((prop, i) => (
                        <div key={prop.id} className="property-card animate-fadeInUp" style={{ animationDelay: `${0.1 * i}s` }}>
                            <div className="property-image">
                                <img src={prop.image} alt={prop.address} loading="lazy" />
                                {prop.exclusive && (
                                    <div className="exclusive-badge">
                                        <img src="/assets/logo/fav.png" alt="" />
                                        <span>ZHOMES</span>
                                    </div>
                                )}
                            </div>
                            <div className="property-info">
                                {/* Row: nombre y precio */}
                                <div className="property-header">
                                    <h3>{prop.address}</h3>
                                    <span className="property-price">{formatPrice(prop.price)}</span>
                                </div>
                                <p className="property-city">
                                    <MapPin size={14} />
                                    {prop.city}
                                </p>
                                {/* Specs como pills */}
                                <div className="property-specs">
                                    <div className="spec"><BedDouble size={14} /> {prop.beds} Hab</div>
                                    <div className="spec"><Bath size={14} /> {prop.baths} Baños</div>
                                    <div className="spec"><Maximize size={14} /> {prop.sqft.toLocaleString()} ft²</div>
                                </div>
                                {/* Acciones: View Detail + Heart */}
                                <div className="property-actions">
                                    <Link to={`/propiedades/${prop.id}`} className="property-detail-btn">Ver Detalle</Link>
                                    <button
                                        className={`property-heart-btn ${favorites.has(prop.id) ? 'active' : ''}`}
                                        onClick={(e) => toggleFav(prop.id, e)}
                                    >
                                        <Heart size={18} fill={favorites.has(prop.id) ? '#E31E24' : 'none'} />
                                    </button>
                                </div>
                                {/* CTA Realtor (aparece en hover) */}
                                <button className="btn property-contact-btn" onClick={(e) => handleContactRealtor(prop, e)}>
                                    <Users size={14} />
                                    ¿Interesado? Elige Tu Realtor
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RealtorRevealModal
                isOpen={realtorModalOpen}
                onClose={() => { setRealtorModalOpen(false); setSelectedProperty(null); }}
                contextProperty={selectedProperty}
            />
        </div>
    )
}
