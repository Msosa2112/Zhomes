import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Info, ChevronLeft, MapPin, Bed, Bath, Square, X, Phone, MessageCircle, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../../../context/PropertyContext';
import './VibeFeedMobile.css';

export default function VibeFeedMobile() {
    const navigate = useNavigate();
    const { properties } = useProperties();
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const [selectedRealtor, setSelectedRealtor] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef(null);

    const verticalImages = [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ];

    // Map the real estate data properties but inject the stunning vertical 'videos' for Vibe experience
    const vibeProperties = properties
        .filter(p => p.price > 0)
        .slice(0, 20)
        .map((prop, idx) => ({
            ...prop,
            vibeMedia: verticalImages[idx % verticalImages.length], // Restore the beautiful vertical views
            realtorPic: '/assets/agents/Jessica%20Hernandez/Jessica%20Hernandez.png'
        }));

    useEffect(() => {
        // Attempt to play audio immediately when entering the feed
        if (audioRef.current) {
            audioRef.current.volume = 1.0;
            audioRef.current.play().catch(e => console.log('Autoplay audio blocked:', e));
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }
    }, []);

    // Lower background music volume slightly when realtor video shows
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = selectedRealtor ? 0.3 : 1.0;
        }
    }, [selectedRealtor]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const toggleMusic = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="vibe-feed-container">
            {/* Background Audio */}
            <audio 
                ref={audioRef} 
                src="/assets/audio/Dreamscapes_Driveways.mp3" 
                loop 
                crossOrigin="anonymous"
            />

            {/* Top Navigation Overlay */}
            <div className="vibe-top-nav">
                <button className="vibe-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={28} color="white" />
                </button>
                <div className="vibe-tab-title">Para Ti</div>
                <button 
                    className="vibe-back-btn" 
                    onClick={toggleMusic}
                    style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
                >
                    {isPlaying ? <Pause size={20} color="white" /> : <Play size={20} color="white" />}
                </button>
            </div>

            {/* Scrollable Feed */}
            <div className="vibe-scroll-area" ref={containerRef} onScroll={handleScroll}>
                {vibeProperties.map((property, index) => (
                    <VibePost 
                        key={property.id} 
                        property={property} 
                        isActive={index === activeIndex} 
                        onOpenRealtor={() => setSelectedRealtor(property)}
                    />
                ))}
            </div>

            {/* Realtor Contact Sheet Modal */}
            <AnimatePresence>
                {selectedRealtor && (
                    <RealtorContactSheet 
                        realtor={selectedRealtor} 
                        onClose={() => setSelectedRealtor(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Small helper to simulate AI "extracting" key features from the MLS remarks
function extractAIHighlights(description) {
    if (!description) return ["✨ Excelente distribución", "🛋 Diseño acogedor", "📍 Gran ubicación"];
    const lower = description.toLowerCase();
    const highlights = [];
    if (lower.includes('pool') || lower.includes('piscina')) highlights.push("🏊‍♀️ Piscina");
    if (lower.includes('hardwood') || lower.includes('madera')) highlights.push("🪵 Pisos de madera");
    if (lower.includes('new') || lower.includes('renovated') || lower.includes('nuevo') || lower.includes('remodelado')) highlights.push("✨ Recién remodelado");
    if (lower.includes('yard') || lower.includes('patio') || lower.includes('garden')) highlights.push("🌳 Amplio patio");
    if (lower.includes('garage') || lower.includes('garaje')) highlights.push("🚗 Garaje incluido");
    if (lower.includes('basement') || lower.includes('sótano')) highlights.push("📦 Sótano espacioso");
    
    // Fill up to 3 if we couldn't find matches
    const fallbacks = ["🤩 Espacios iluminados", "🏡 Listo para mudarse", "💎 Increíble oportunidad", "🏙 Barrio tranquilo"];
    while (highlights.length < 3) {
        let f = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!highlights.includes(f)) highlights.push(f);
    }
    return highlights.slice(0, 3);
}

function VibePost({ property, isActive, onOpenRealtor }) {
    const [liked, setLiked] = useState(false);
    const [showMortgage, setShowMortgage] = useState(false);
    const navigate = useNavigate();

    // 1. Simulación de "Open House Live": 25% de las propiedades al azar
    const isLiveOpenHouse = parseInt(property.id || 0) % 4 === 0;

    // 2. Simulación de "Ruta al Trabajo" basada en coordenadas
    const commuteMins = Math.floor(Math.random() * 15) + 10; 

    // 3. IA Summaries extraídos mágicamente
    const aiBullets = extractAIHighlights(property.description);

    // Track analytics (Simulated Tinder/Spotify algorithm tracking)
    useEffect(() => {
        if (isActive) {
            console.log(`[Algorithm Log] User is watching property ${property.id}. Watch time started...`);
            // In a real app we'd trigger a 3-second timeout here to send a 'Viewed' event to Supabase
        }
    }, [isActive, property.id]);

    const handleLike = () => {
        setLiked(!liked);
        if (!liked) console.log(`[Algorithm Log] User liked property ${property.id}. Learning preference: ${property.type}`);
    };

    return (
        <div className="vibe-post">
            {/* Simulated Video Background using slow Ken Burns CSS animation */}
            <div className="vibe-media-wrapper">
                <img 
                    src={property.vibeMedia} 
                    alt="Property Vibe" 
                    className={`vibe-media-img ${isActive ? 'playing' : ''}`}
                />
                <div className="vibe-gradient-overlay"></div>
            </div>

            {/* 🔥 NEW: Open House Live Badge */}
            <AnimatePresence>
                {isLiveOpenHouse && (
                    <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} className="vibe-open-house-badge">
                        <span className="dot"></span> OPEN HOUSE HOY
                    </motion.div>
                )}
            </AnimatePresence>




            {/* Right Action Column */}
            <div className="vibe-action-col">
                <div className="vibe-action-item" onClick={onOpenRealtor}>
                    <div className="vibe-realtor-profile">
                        <img src={property.realtorPic} alt="Realtor" />
                        <button className="vibe-realtor-add">+</button>
                    </div>
                </div>

                <div className="vibe-action-item" onClick={handleLike}>
                    <motion.div whileTap={{ scale: 0.8 }}>
                        <Heart size={32} color={liked ? '#e31e24' : 'white'} fill={liked ? '#e31e24' : 'transparent'} />
                    </motion.div>
                    <span>{Math.floor(Math.random() * 500) + 12}</span>
                </div>

                <div className="vibe-action-item" onClick={() => navigate(`/propiedades/${property.id}`)}>
                    <motion.div whileTap={{ scale: 0.8 }} className="vibe-icon-bg">
                        <Info size={28} color="white" />
                    </motion.div>
                    <span>Detalles</span>
                </div>

                <div className="vibe-action-item">
                    <motion.div whileTap={{ scale: 0.8 }}>
                        <Share2 size={32} color="white" />
                    </motion.div>
                    <span>Compartir</span>
                </div>
            </div>

            {/* Bottom Info Area */}
            <div className="vibe-info-area">
                {/* 🔥 FIXED: AI Property Summaries moved here for natural flex stacking */}
                {isActive && (
                    <div className="vibe-ai-summary">
                        {aiBullets.map((bullet, i) => (
                            <div key={i} className="ai-bullet">{bullet}</div>
                        ))}
                    </div>
                )}
                <h2 className="vibe-price">${property.price?.toLocaleString()}</h2>
                
                <div className="vibe-location">
                    <MapPin size={16} /> <span>{property.address}, {property.city}</span>
                </div>
                
                <div className="vibe-stats">
                    <div className="v-stat"><Bed size={16}/> {property.beds} Hab</div>
                    <div className="v-stat"><Bath size={16}/> {property.baths} Ba</div>
                    {/* 🔥 NEW: Calculadora de Hipoteca Interactiva */}
                    <div className="v-stat mortgage-clickable" onClick={() => setShowMortgage(!showMortgage)}>
                        <Square size={16}/> 
                        {showMortgage ? `~$${Math.round(property.price * 0.0068).toLocaleString()}/mes` : `${property.sqft} sqft`}
                    </div>
                </div>

                {/* Simulated "Now Playing" sound ticker for TikTok feel */}
                <div className="vibe-sound-ticker">
                    <div className="music-icon">🎵</div>
                    <div className="ticker-text">
                        <div className="ticker-scroll">
                            ZHomes Original Sound - Recorrido de Lujo en {property.city}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RealtorContactSheet({ realtor, onClose }) {
    return (
        <motion.div 
            className="vibe-realtor-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div 
                className="vibe-realtor-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Simulated vertical video of realtor talking - FULL BACKGROUND */}
                <div className="sheet-video-container">
                    <video 
                        src="/assets/agents/Jessica%20Hernandez/Jessica%20video%20mov.webm" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="sheet-video-bg" 
                    />
                    <div className="sheet-video-gradient"></div>
                </div>

                <div className="sheet-drag-handle"></div>
                <button className="sheet-close-btn" onClick={onClose}><X size={24} /></button>
                
                {/* Lower content pushed to bottom */}
                <div className="sheet-bottom-content">
                    <div className="playing-indicator">
                        <span className="dot pulse"></span> En línea ahora
                    </div>
                    
                    <div className="sheet-header-info">
                        <h3 className="sheet-title">Contacta a Jessica</h3>
                        <p className="sheet-subtitle">Especialista en {realtor.city}</p>
                    </div>

                    <div className="video-caption">
                        "¡Hola! Te muestro esta propiedad en vivo. Escríbeme 👇"
                    </div>

                    <div className="sheet-actions">
                        <button className="sheet-btn primary-btn">
                            <MessageCircle size={20} /> Whatsapp
                        </button>
                        <button className="sheet-btn secondary-btn">
                            <Phone size={20} /> Llamar
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
