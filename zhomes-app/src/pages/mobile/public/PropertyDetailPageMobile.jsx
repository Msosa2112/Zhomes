import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Share, Heart, Play, BedDouble, Bath, Maximize, Star } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../../context/ThemeContext'
import { MOCK_PROPERTIES, REALTORS } from '../../../data/mockData'
import { SparkService } from '../../../services/sparkService'
import RealtorRevealModal from '../../../components/public/RealtorRevealModal'
import './PropertyDetailPageMobile.css'

// Fix to clear map layout size 
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => { map.invalidateSize(); }, 300);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}

export default function PropertyDetailPageMobile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [property, setProperty] = useState(null)
    const [loading, setLoading] = useState(true)
    const [realtorSelectorOpen, setRealtorSelectorOpen] = useState(false)
    const [viewerOpen, setViewerOpen] = useState(false)
    const [selectedRealtor, setSelectedRealtor] = useState(null)
    const { theme } = useTheme()

    const zhomesLogoMarker = new L.Icon({
        iconUrl: '/assets/logo/fav.png',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        className: 'zhomes-custom-marker'
    })

    const genericMarker = new L.divIcon({
        html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4))">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E31E24" stroke="none" width="32" height="32">
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                   <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
                 </svg>
               </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    })

    useEffect(() => {
        setLoading(true);
        SparkService.getListingDetails(id)
            .then(data => {
                const results = data.D?.Results;
                if (results && results.length > 0) {
                    const p = results[0];
                    setProperty({
                        id: String(p.Id),
                        address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                        city: `${p.StandardFields.City || ''}, ${p.StandardFields.StateOrProvince || ''}`,
                        price: p.StandardFields.ListPrice || 0,
                        image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                        beds: p.StandardFields.BedsTotal || 0,
                        baths: p.StandardFields.BathsTotal || 0,
                        sqft: p.StandardFields.BuildingAreaTotal || 0,
                        lat: p.StandardFields.Latitude || null,
                        lng: p.StandardFields.Longitude || null,
                        desc: p.StandardFields.PublicRemarks || 'Descripción no disponible',
                        exclusive: false
                    });
                } else {
                    throw new Error("Property not found in Spark or not format matched");
                }
            })
            .catch(err => {
                console.warn("Spark API error or token disabled. Fallback to mock data.", err);
                const fallbackProp = MOCK_PROPERTIES.find(p => p.id === parseInt(id)) || MOCK_PROPERTIES[0];
                setProperty({
                    ...fallbackProp,
                    id: String(fallbackProp.id),
                    desc: 'Hermosa casa completamente renovada en una de las mejores zonas de la ciudad. Cuenta con acabados modernos, concina concepto abierto con topes de granito y un patio trasero amplio ideal para el entretenimiento. Electrodomésticos de acero inoxidable incluidos.'
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{padding:'4rem 2rem', textAlign:'center', color:'#888'}}>Cargando detalles...</div>;
    if (!property) return null

    const activeRealtor = selectedRealtor
    const activeRealtorIndex = selectedRealtor ? REALTORS.findIndex(r => r.id === selectedRealtor.id) : -1

    const handleRealtorSelected = (realtor) => {
        setRealtorSelectorOpen(false)
        setSelectedRealtor(realtor)
        setViewerOpen(true) // Automatically show the video profile once selected!
    }

    const formatPriceK = (price) => {
        return price >= 1000 ? (price / 1000) + 'k' : price;
    }

    return (
        <div className="mobile-pdetail">
            <nav className="mpd-nav">
                <button onClick={() => navigate(-1)} className="mpd-icon-btn"><ArrowLeft size={20} /></button>
                <div className="mpd-nav-actions">
                    <button className="mpd-icon-btn"><Share size={18} /></button>
                    <button className="mpd-icon-btn"><Heart size={18} /></button>
                </div>
            </nav>

            <header className="mpd-hero">
                <img src={property.image} alt="Property" className="mpd-hero-bg" />
                <div className="mpd-hero-overlay">
                    {/* Botón de video movido al layout de flexbox superior */}
                </div>
            </header>

            <main className="mpd-content">
                <div className="mpd-accessories-row">
                    <button className="mpd-play-btn" onClick={() => {}}>
                        <Play fill="white" size={20} /> VIDEO TOUR
                    </button>
                    <div className="mpd-price-tab">
                        {formatPriceK(property.price)}
                    </div>
                </div>
                <div className="mpd-header-info">
                    <h1 className="mpd-addr">{property.address}</h1>
                    <div className="mpd-city"><MapPin size={14} /> {property.city}</div>
                </div>

                {activeRealtor ? (
                    <div className="mpd-agent-card" onClick={() => setViewerOpen(true)}>
                        <img src={activeRealtor.photo} alt={activeRealtor.name} style={{ border: '1px solid var(--zhomes-red)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{activeRealtor.name}</strong>
                            <span style={{ color: 'var(--zhomes-red)', fontWeight: 600 }}>★ Tu Asesor Elegido</span>
                        </div>
                    </div>
                ) : (
                    <div className="mpd-agent-card" onClick={() => setRealtorSelectorOpen(true)}>
                        <img src="/assets/logo/fav.png" alt="Zhomes" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '1.1rem' }}>Zhomes Real Estate</strong>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Elige a tu asesor ideal →</span>
                        </div>
                    </div>
                )}

                <div className="mpd-specs-inline">
                    <div className="mpd-spec-mini"><strong>{property.beds}</strong><span>habitaciones</span></div>
                    <div className="mpd-spec-mini"><strong>{property.baths}</strong><span>baños</span></div>
                    <div className="mpd-spec-mini"><strong>{property.sqft.toLocaleString()}</strong><span>sqft</span></div>
                </div>

                <div className="mpd-desc">
                    <h2>Acerca de esta propiedad</h2>
                    <p>{property.desc}</p>
                </div>

                <div className="mpd-map-wrap">
                    <h2>Ubicación</h2>
                    <div className="mpd-map-container">
                        <MapContainer 
                            center={[
                                Number(property.lat) || (38.15 + (property.id * 0.012)), 
                                Number(property.lng) || (-85.7 + (property.id * 0.015))
                            ]} 
                            zoom={13} 
                            zoomControl={false}
                            attributionControl={false}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <MapResizer />
                            <TileLayer 
                                url={theme === 'light' 
                                    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                                    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                } 
                            />
                            <Marker 
                                position={[
                                    Number(property.lat) || (38.15 + (property.id * 0.012)), 
                                    Number(property.lng) || (-85.7 + (property.id * 0.015))
                                ]}
                                icon={property.exclusive ? zhomesLogoMarker : genericMarker}
                            />
                        </MapContainer>
                    </div>
                </div>
            </main>

            <div style={{ height: '90px' }} />

            <AnimatePresence>
                {(realtorSelectorOpen || viewerOpen) && (
                    <RealtorRevealModal
                        isOpen={true}
                        onClose={() => {
                            setRealtorSelectorOpen(false);
                            setViewerOpen(false);
                        }}
                        onSelect={handleRealtorSelected}
                        contextProperty={property}
                        openDirectly={viewerOpen}
                        initialIndex={viewerOpen && activeRealtorIndex >= 0 ? activeRealtorIndex : undefined}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
