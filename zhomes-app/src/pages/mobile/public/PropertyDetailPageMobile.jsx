import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Share, Heart, Play, BedDouble, Bath, Maximize, Star, HeartCrack, CalendarPlus, Calculator } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../../context/ThemeContext'
import { MOCK_PROPERTIES, REALTORS } from '../../../data/mockData'
import { SparkService } from '../../../services/sparkService'
import { supabase } from '../../../lib/supabaseClient'
import { useProperties } from '../../../context/PropertyContext'
import { HomeScoreService } from '../../../services/homeScoreService'
import { MortgageService } from '../../../services/mortgageService'
import RealtorRevealModal from '../../../components/public/RealtorRevealModal'
import PhotoViewerMobile from '../../../components/public/PhotoViewerMobile'
import NeighborhoodIntel from '../../../components/public/NeighborhoodIntel'
import BookingWidget from '../../../components/public/BookingWidget'
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
    const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
    const [selectedRealtor, setSelectedRealtor] = useState(() => {
        const savedId = localStorage.getItem('zhomes_my_agent');
        return savedId ? REALTORS.find(r => String(r.id) === String(savedId)) : null;
    })
    const [bookingOpen, setBookingOpen] = useState(false)
    const { theme } = useTheme()
    const { properties: ctxProperties } = useProperties()

    const [isFavorite, setIsFavorite] = useState(false)
    const [togglingFav, setTogglingFav] = useState(false)
    const [virtualTourOpen, setVirtualTourOpen] = useState(false)

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
        
        // 1. First try to find in context (works for both Spark and sample IDs)
        const ctxProp = ctxProperties.find(p => String(p.id) === String(id));
        if (ctxProp) {
            setProperty({
                ...ctxProp,
                photos: ctxProp.images || [ctxProp.image],
                desc: ctxProp.description || 'Hermosa propiedad en una de las mejores zonas de la ciudad.',
                city: ctxProp.city || ''
            });
            setLoading(false);
            return;
        }

        // 2. Fallback: try Spark API directly (RESO v3 format)
        SparkService.getListingDetails(id)
            .then(data => {
                // RESO v3 returns single entity directly or in value array
                const p = data?.value?.[0] || data;
                if (p && (p.ListPrice || p.UnparsedAddress)) {
                    const mediaPhotos = (p.Media || [])
                        .filter(m => m.MediaURL)
                        .map(m => m.MediaURL);
                    setProperty({
                        id: String(p.ListingKey || id),
                        address: p.UnparsedAddress || 'Dirección no disponible',
                        city: `${p.City || ''}, ${p.StateOrProvince || ''}`,
                        price: p.ListPrice || 0,
                        image: mediaPhotos[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                        photos: mediaPhotos.length > 0 ? mediaPhotos : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'],
                        beds: p.BedsTotal || p.BedroomsTotal || 0,
                        baths: p.BathroomsTotalInteger || p.BathroomsFull || 0,
                        sqft: p.LivingArea || p.BuildingAreaTotal || 0,
                        lat: p.Latitude || null,
                        lng: p.Longitude || null,
                        desc: p.PublicRemarks || 'Descripción no disponible',
                        virtual_tour_url: p.VirtualTourURLUnbranded || p.VirtualTourURLBranded || null,
                        exclusive: String(p.ListOfficeName || '').toLowerCase().includes('zhomes')
                    });
                } else {
                    throw new Error("Property not found in Spark");
                }
            })
            .catch(err => {
                console.warn("Fallback to mock data:", err.message);
                const fallbackProp = MOCK_PROPERTIES.find(p => String(p.id) === String(id)) || MOCK_PROPERTIES[0];
                setProperty({
                    ...fallbackProp,
                    id: String(fallbackProp.id),
                    photos: fallbackProp.images || [fallbackProp.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'],
                    desc: fallbackProp.description || 'Hermosa casa completamente renovada en una de las mejores zonas de la ciudad.'
                });
            })
            .finally(() => setLoading(false));
    }, [id, ctxProperties]);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!property?.id) return
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('property_id', property.id)
                .maybeSingle()

            if (data) setIsFavorite(true)
        }
        checkFavoriteStatus()
    }, [property])

    const handleToggleFavorite = async () => {
        setTogglingFav(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            navigate('/login')
            return
        }

        try {
            if (isFavorite) {
                await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('property_id', property.id)
                setIsFavorite(false)
            } else {
                await supabase
                    .from('user_favorites')
                    .insert([{ 
                        user_id: session.user.id, 
                        property_id: property.id 
                    }])
                setIsFavorite(true)
            }
        } catch (error) {
            console.error("Error toggling favorite:", error)
        } finally {
            setTogglingFav(false)
        }
    }

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
        if (!price) return '$0'
        if (price >= 1000000) return `$${(price / 1000000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}M`
        if (price >= 1000) return `$${Math.round(price / 1000)}K`
        return `$${price}`
    }

    return (
        <div className="mobile-pdetail">
            <nav className="mpd-nav">
                <button onClick={() => navigate(-1)} className="mpd-icon-btn"><ArrowLeft size={20} /></button>
            </nav>

            <header className="mpd-hero" onClick={() => setPhotoViewerOpen(true)} style={{ cursor: 'pointer' }}>
                <img src={property.image} alt="Property" className="mpd-hero-bg" />
                <div className="mpd-hero-overlay">
                    {/* Botón de video movido al layout de flexbox superior */}
                </div>
            </header>

            <main className="mpd-content">
                <div className="mpd-accessories-row">
                    <button className="mpd-play-btn" onClick={() => {
                        if (property.virtual_tour_url) {
                            setVirtualTourOpen(true)
                        } else {
                            alert('Esta propiedad no cuenta con un recorrido 3D / Video en el MLS.')
                        }
                    }}>
                        <Play fill="white" size={16} /> {property.virtual_tour_url ? 'TOUR 3D' : 'SIN VIDEO'}
                    </button>
                    <button className="mpd-acc-icon-btn" onClick={async () => {
                        if (navigator.share) {
                            try {
                                await navigator.share({ title: property.address, url: window.location.href });
                            } catch (err) {}
                        } else {
                            alert('Copiar enlace de propiedad: ' + window.location.href);
                        }
                    }}>
                        <Share size={18} />
                    </button>
                    <button className="mpd-acc-icon-btn" onClick={handleToggleFavorite} disabled={togglingFav}>
                        <Heart size={18} fill={isFavorite ? "var(--zhomes-red)" : "transparent"} color={isFavorite ? "var(--zhomes-red)" : "white"} />
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

                <div className="mpd-vibe-match">
                    <div className="vibe-score-circle">
                        <svg viewBox="0 0 36 36" className="vibe-circular-chart">
                            <path className="vibe-circle-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="vibe-circle"
                                strokeDasharray={`${(() => {
                                    const hs = HomeScoreService.calculateScore(property, {
                                        maxPrice: 350000, minPrice: 100000,
                                        minBeds: 3, minBaths: 2, minSqft: 1200
                                    });
                                    return hs.score;
                                })()}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="21.5" className="vibe-percentage">
                                {HomeScoreService.calculateScore(property, {
                                    maxPrice: 350000, minPrice: 100000,
                                    minBeds: 3, minBaths: 2, minSqft: 1200
                                }).score}%
                            </text>
                        </svg>
                    </div>
                    <div className="vibe-text">
                        <h3>🎯 Home Score</h3>
                        <p>Puntuación personalizada basada en tus preferencias de búsqueda.</p>
                    </div>
                </div>

                <div className="mpd-desc">
                    <h2>Acerca de esta propiedad</h2>
                    <p>{property.desc}</p>
                </div>

                {/* Neighborhood Intelligence — WalkScore */}
                <NeighborhoodIntel 
                    address={property.address}
                    lat={property.lat}
                    lng={property.lng}
                />

                {/* Quick Mortgage Estimate */}
                {property.price > 0 && (
                    <div className="mpd-mortgage-quick">
                        <h2><Calculator size={16} /> Estimado Hipotecario</h2>
                        <div className="mpd-mortgage-card">
                            {(() => {
                                const calc = MortgageService.calculateFullPayment({
                                    homePrice: property.price,
                                    downPayment: property.price * 0.2,
                                    interestRate: 6.5,
                                    years: 30
                                });
                                return (
                                    <>
                                        <div className="mpd-mort-main">
                                            <span className="mpd-mort-label">Pago Mensual</span>
                                            <strong className="mpd-mort-value">${calc.total.toLocaleString()}</strong>
                                        </div>
                                        <div className="mpd-mort-details">
                                            <span>Principal: ${calc.principalAndInterest.toLocaleString()}</span>
                                            <span>Impuestos: ${calc.tax.toLocaleString()}</span>
                                            <span>Seguro: ${calc.insurance.toLocaleString()}</span>
                                            {calc.pmi > 0 && <span>PMI: ${calc.pmi.toLocaleString()}</span>}
                                        </div>
                                        <div className="mpd-mort-note">
                                            Con 20% de enganche · 6.5% tasa · 30 años
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <button className="mpd-calc-btn" onClick={() => navigate('/calculadora')}>
                            <Calculator size={14} /> Calculadora Completa →
                        </button>
                    </div>
                )}

                {/* Booking / Schedule Visit Button */}
                <div className="mpd-booking-section">
                    <button className="mpd-booking-btn" onClick={() => setBookingOpen(true)}>
                        <CalendarPlus size={18} /> Agendar Visita
                    </button>
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

            <PhotoViewerMobile
                photos={property.photos || [property.image]}
                isOpen={photoViewerOpen}
                onClose={() => setPhotoViewerOpen(false)}
            />

            {bookingOpen && (
                <BookingWidget
                    propertyAddress={property.address}
                    realtorName={selectedRealtor?.name || 'ZHomes'}
                    onBook={(data) => {
                        alert('¡Cita solicitada exitosamente! El equipo comercial se pondrá en contacto pronto.');
                        setBookingOpen(false);
                    }}
                    onClose={() => setBookingOpen(false)}
                />
            )}

            <AnimatePresence>
                {virtualTourOpen && property.virtual_tour_url && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '1rem', display: 'flex', justifyContent: 'flex-end',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)'
                        }}>
                            <button onClick={() => setVirtualTourOpen(false)} style={{
                                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                ✕
                            </button>
                        </div>
                        <iframe 
                            src={property.virtual_tour_url}
                            style={{ flex: 1, border: 'none', width: '100%', backgroundColor: '#000' }}
                            allow="xr-spatial-tracking; vr; gyroscope; accelerometer; fullscreen; autoplay; protected-media"
                            allowFullScreen
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
