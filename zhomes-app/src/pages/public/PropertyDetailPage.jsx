import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    ArrowLeft, Heart, Share2, MapPin, BedDouble, Bath, Maximize, Calendar,
    Home, Car, Trees, Thermometer, Shield, Users, Phone, MessageCircle, Mail,
    ChevronLeft, ChevronRight, X, Check, Play, Zap, FileText, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import 'leaflet/dist/leaflet.css'
import { MOCK_PROPERTIES, REALTORS } from '../../data/mockData'
import RealtorRevealModal from '../../components/public/RealtorRevealModal'
import NeighborhoodMap from '../../components/public/NeighborhoodMap'
import './PropertyDetailPage.css'

function formatPrice(p) {
    return '$' + p.toLocaleString()
}

// Simulated extra images per property (using different crops of same source)
function getPropertyImages(prop) {
    const base = prop.image.split('?')[0]
    return [
        `${base}?w=1600&h=900&fit=crop`,
        `${base}?w=1600&h=900&fit=crop&crop=left`,
        `${base}?w=1600&h=900&fit=crop&crop=right`,
        `${base}?w=1600&h=900&fit=crop&crop=top`,
    ]
}

function getFeatures(prop) {
    const features = []
    if (prop.sqft >= 3000) features.push({ icon: Home, label: 'Casa Amplia', desc: `${prop.sqft.toLocaleString()} ft² de espacio` })
    if (prop.beds >= 4) features.push({ icon: BedDouble, label: 'Múltiples Habitaciones', desc: `${prop.beds} habitaciones espaciosas` })
    if (prop.baths >= 3) features.push({ icon: Bath, label: 'Baños Completos', desc: `${prop.baths} baños de lujo` })
    features.push({ icon: Car, label: 'Garage', desc: prop.sqft > 2500 ? 'Garage para 2 autos' : 'Garage para 1 auto' })
    features.push({ icon: Trees, label: 'Jardín', desc: 'Patio trasero privado' })
    features.push({ icon: Thermometer, label: 'Climatización', desc: 'A/C central y calefacción' })
    return features
}

export default function PropertyDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const property = MOCK_PROPERTIES.find(p => p.id === parseInt(id))
    const [favorite, setFavorite] = useState(false)
    const [offerStatus, setOfferStatus] = useState('idle') // idle, generating, sent
    const [videoModal, setVideoModal] = useState(false)
    const [realtorSelectorOpen, setRealtorSelectorOpen] = useState(false)
    const [selectedRealtor, setSelectedRealtor] = useState(null)

    // Scroll handling for cinematic navbar
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 100)
        window.addEventListener('scroll', handler)
        return () => window.removeEventListener('scroll', handler)
    }, [])

    if (!property) return null

    const images = getPropertyImages(property)
    const features = getFeatures(property)
    const pricePerSqft = Math.round(property.price / property.sqft)
    const assignedRealtor = property.exclusive ? REALTORS[0] : REALTORS[1]

    const handleInstantOfferClick = () => {
        setRealtorSelectorOpen(true)
    }

    const handleRealtorSelected = (realtor) => {
        setRealtorSelectorOpen(false)
        setSelectedRealtor(realtor)
        setOfferStatus('generating')

        // Simulating AI Contract Generation
        setTimeout(() => {
            setOfferStatus('sent')
            setTimeout(() => setOfferStatus('idle'), 3000)
        }, 2500)
    }

    return (
        <div className="cinematic-page">
            {/* Cinematic Navbar */}
            <nav className={`cinematic-nav ${scrolled ? 'scrolled' : ''}`}>
                <button onClick={() => navigate(-1)} className="nav-btn-back">
                    <ArrowLeft size={20} />
                    <span>Volver</span>
                </button>
                <div className={`nav-title ${scrolled ? 'visible' : ''}`}>
                    {property.address}
                </div>
                <div className="nav-actions">
                    <button className="nav-icon" onClick={() => setFavorite(!favorite)}>
                        <Heart size={20} fill={favorite ? '#E31E24' : 'none'} color={favorite ? '#E31E24' : 'currentColor'} />
                    </button>
                    <button className="nav-icon"><Share2 size={20} /></button>
                </div>
            </nav>

            {/* Immersive Hero */}
            <header className="cinematic-hero">
                <img src={images[0]} alt={property.address} className="hero-bg" />
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="hero-badges">
                            {property.exclusive && <span className="badge badge-exclusive"><Sparkles size={12} /> Exclusiva ZHOMES</span>}
                            <span className="badge badge-live"><div className="dot-pulse"></div> Open House Live</span>
                        </div>
                        <h1 className="hero-address">{property.address}</h1>
                        <p className="hero-city">{property.city}</p>
                        <div className="hero-price">{formatPrice(property.price)}</div>

                        <div className="hero-specs">
                            <span><BedDouble size={18} /> {property.beds} Beds</span>
                            <span><Bath size={18} /> {property.baths} Baths</span>
                            <span><Maximize size={18} /> {property.sqft.toLocaleString()} sqft</span>
                        </div>
                    </motion.div>
                </div>

                <button className="play-video-btn" onClick={() => setVideoModal(true)}>
                    <div className="play-icon"><Play size={24} fill="white" /></div>
                    <span>Ver Video Tour</span>
                </button>
            </header>

            {/* Instant Action Bar */}
            <div className="action-bar-sticky">
                <div className="action-price">
                    <span className="label">Precio de Lista</span>
                    <span className="val">{formatPrice(property.price)}</span>
                </div>
                <div className="action-buttons">
                    <button className="btn-action secondary">
                        <MessageCircle size={18} /> Chat IA
                    </button>
                    <button
                        className={`btn-action primary ${offerStatus}`}
                        onClick={handleInstantOfferClick}
                        disabled={offerStatus !== 'idle'}
                    >
                        {offerStatus === 'idle' && <><Zap size={18} /> Oferta Instantánea</>}
                        {offerStatus === 'generating' && <><div className="spinner"></div> Generando Contrato...</>}
                        {offerStatus === 'sent' && <><CheckCircle2 size={18} /> Enviado a {selectedRealtor?.name.split(' ')[0]}</>}
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="cinematic-content">
                <div className="content-left">
                    <section className="section-specs">
                        <h3>Detalles Inteligentes</h3>
                        <div className="features-grid-cinematic">
                            {features.map((f, i) => (
                                <div key={i} className="feature-card-cine">
                                    <div className="fc-icon"><f.icon size={24} /></div>
                                    <div>
                                        <h4>{f.label}</h4>
                                        <p>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="section-desc">
                        <h3>Sobre esta propiedad</h3>
                        <p className="description-text">
                            Bienvenido a esta espectacular residencia en {property.city}.
                            Esta joya arquitectónica cuenta con acabados de primera, iluminación natural optimizada
                            y un diseño pensado para el estilo de vida moderno.
                            <br /><br />
                            Equipada con tecnología Smart Home integrada y eficiencia energética certificada.
                            Perfecta para quienes buscan lujo y comodidad sin compromisos.
                        </p>
                    </section>

                    <section className="section-map">
                        <h3>Ubicación & Vibe</h3>
                        <div className="map-frame">
                            <NeighborhoodMap lat={parseFloat(property.lat) || 38.2527} lng={parseFloat(property.lng) || -85.7585} propertyId={property.id} address={property.address} />
                        </div>
                    </section>
                </div>

                <div className="content-right">
                    <div className="realtor-card-cine glass-card">
                        <h3>Agente Asignado</h3>
                        <div className="rc-profile">
                            <img src={assignedRealtor.photo} alt={assignedRealtor.name} className="rc-assigned-photo" />
                            <div>
                                <h4>{assignedRealtor.name}</h4>
                                <p>Top 1% Agent</p>
                            </div>
                        </div>
                        <div className="rc-stats">
                            <div><strong>12</strong><br />Deals</div>
                            <div><strong>4.9</strong><br />Rating</div>
                            <div><strong>1h</strong><br />Resp. Time</div>
                        </div>
                        <button className="btn-contact full">Agendar Visita (IA)</button>
                    </div>

                    <div className="mortgage-card-cine glass-card">
                        <h3>Tu Pago Mensual</h3>
                        <div className="mc-price">$2,430<span>/mes</span></div>
                        <div className="mc-bar">
                            <div className="fill" style={{ width: '70%' }}></div>
                        </div>
                        <p className="mc-note">Pre-aprobado por ZHOMES Capital</p>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {videoModal && (
                    <motion.div
                        className="video-modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setVideoModal(false)}
                    >
                        <div className="video-modal-content">
                            <button className="close-video"><X size={24} /></button>
                            <div className="video-placeholder">
                                <Play size={64} />
                                <h3>Video Tour Simulada</h3>
                            </div>
                        </div>
                    </motion.div>
                )}
                <RealtorRevealModal
                    isOpen={realtorSelectorOpen}
                    onClose={() => setRealtorSelectorOpen(false)}
                    onSelect={handleRealtorSelected}
                    contextProperty={property}
                />
            </AnimatePresence>
        </div>
    )
}

function Sparkles({ size }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
}
