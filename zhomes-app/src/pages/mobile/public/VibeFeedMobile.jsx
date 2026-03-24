import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Info, ChevronLeft, MapPin, Bed, Bath, Square, X, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PROPERTIES } from '../../../data/mockData';
import './VibeFeedMobile.css';

// Adding some vertical-friendly high-res images to MOCK_PROPERTIES for the demo
const ENHANCED_VIBES = MOCK_PROPERTIES.slice(0, 5).map((prop, idx) => {
    const verticalImages = [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ];
    return {
        ...prop,
        vibeMedia: verticalImages[idx % verticalImages.length],
        realtorPic: '/assets/agents/Jessica%20Hernandez/Jessica%20Hernandez.png'
    };
});

export default function VibeFeedMobile() {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const [selectedRealtor, setSelectedRealtor] = useState(null);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    return (
        <div className="vibe-feed-container">
            {/* Top Navigation Overlay */}
            <div className="vibe-top-nav">
                <button className="vibe-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={28} color="white" />
                </button>
                <div className="vibe-tab-title">Para Ti</div>
                <div style={{width: 28}}></div>
            </div>

            {/* Scrollable Feed */}
            <div className="vibe-scroll-area" ref={containerRef} onScroll={handleScroll}>
                {ENHANCED_VIBES.map((property, index) => (
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

function VibePost({ property, isActive, onOpenRealtor }) {
    const [liked, setLiked] = useState(false);
    const navigate = useNavigate();

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

            {/* Right Action Column */}
            <div className="vibe-action-col">
                <div className="vibe-action-item" onClick={onOpenRealtor}>
                    <div className="vibe-realtor-profile">
                        <img src={property.realtorPic} alt="Realtor" />
                        <button className="vibe-realtor-add">+</button>
                    </div>
                </div>

                <div className="vibe-action-item" onClick={() => setLiked(!liked)}>
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
                <h2 className="vibe-price">${property.price.toLocaleString()}</h2>
                
                <div className="vibe-location">
                    <MapPin size={16} /> <span>{property.address}, {property.city}</span>
                </div>
                
                <div className="vibe-stats">
                    <div className="v-stat"><Bed size={16}/> {property.beds} Hab</div>
                    <div className="v-stat"><Bath size={16}/> {property.baths} Ba</div>
                    <div className="v-stat"><Square size={16}/> {property.sqft} sqft</div>
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
