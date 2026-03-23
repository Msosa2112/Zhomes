import { useState } from 'react'
import { ArrowLeft, MapPin, Share, Heart, Play, BedDouble, Bath, Maximize, Star } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { MOCK_PROPERTIES, REALTORS } from '../../../data/mockData'
import RealtorRevealModal from '../../../components/public/RealtorRevealModal'
import './PropertyDetailPageMobile.css'

export default function PropertyDetailPageMobile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const property = MOCK_PROPERTIES.find(p => p.id === parseInt(id))
    const [realtorSelectorOpen, setRealtorSelectorOpen] = useState(false)
    const [viewerOpen, setViewerOpen] = useState(false)
    const [selectedRealtor, setSelectedRealtor] = useState(null)

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
                    <p>Hermosa casa completamente renovada en una de las mejores zonas de la ciudad. Cuenta con acabados modernos, concina concepto abierto con topes de granito y un patio trasero amplio ideal para el entretenimiento. Electrodomésticos de acero inoxidable incluidos.</p>
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
