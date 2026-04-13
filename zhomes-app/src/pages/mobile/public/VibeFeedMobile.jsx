import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Share2, Info, ChevronLeft, MapPin, Bed, Bath, Square, X, Phone, MessageCircle, Pause, Play, Sparkles, Sofa, Waves, Trees, Car, Package, Home, Gem, Building, Music, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import './VibeFeedMobile.css';

// ZHomes Vibe videos - local .mp4 files (fallback)
const LOCAL_VIDEOS = [
    {
        id: 'zhomes-vibe-1',
        video: '/Videos/10906_Milwaukee_Way.mp4',
        property_address: '10906 Milwaukee Way',
        city: 'Louisville',
        zip: '40272',
        price: 189900,
        beds: 3,
        baths: '2.0',
        sqft: 1450,
        status: 'Active',
        description: 'Newly remodeled flip investment property. Modern finishes throughout.',
        realtor_name: 'ZHomes Real Estate',
        is_zhomes: true,
    },
    {
        id: 'zhomes-vibe-2',
        video: '/Videos/zhomes_new_listing.mp4',
        property_address: 'ZHomes New Listing',
        city: 'Louisville',
        zip: '40200',
        price: 215000,
        beds: 4,
        baths: '2.0',
        sqft: 1800,
        status: 'Active',
        description: 'New home, fully remodeled. Great investment opportunity by ZHomes.',
        realtor_name: 'ZHomes Real Estate',
        is_zhomes: true,
    },
];

export default function VibeFeedMobile() {
    const navigate = useNavigate();
    const [vibeProperties, setVibeProperties] = useState(LOCAL_VIDEOS);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const [selectedRealtor, setSelectedRealtor] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef(null);

    // Load videos from Supabase and merge with local
    useEffect(() => {
        async function loadDbVideos() {
            const { data } = await supabase
                .from('vibe_videos')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            
            if (data && data.length > 0) {
                const dbMapped = data.map(v => ({
                    ...v,
                    video: v.video_url,
                    address: v.property_address,
                }));
                // DB videos first, then local fallbacks
                setVibeProperties([...dbMapped, ...LOCAL_VIDEOS]);
            }
        }
        loadDbVideos();
    }, []);

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
    if (!description) return [<><Sparkles size={12} style={{display: 'inline', marginRight: 4}}/> Excelente distribución</>, <><Sofa size={12} style={{display: 'inline', marginRight: 4}}/> Diseño acogedor</>, <><MapPin size={12} style={{display: 'inline', marginRight: 4}}/> Gran ubicación</>];
    const lower = description.toLowerCase();
    const highlights = [];
    if (lower.includes('pool') || lower.includes('piscina')) highlights.push(<><Waves size={12} style={{display: 'inline', marginRight: 4}}/> Piscina</>);
    if (lower.includes('hardwood') || lower.includes('madera')) highlights.push(<><Trees size={12} style={{display: 'inline', marginRight: 4}}/> Pisos de madera</>);
    if (lower.includes('new') || lower.includes('renovated') || lower.includes('nuevo') || lower.includes('remodelado')) highlights.push(<><Sparkles size={12} style={{display: 'inline', marginRight: 4}}/> Recién remodelado</>);
    if (lower.includes('yard') || lower.includes('patio') || lower.includes('garden')) highlights.push(<><Trees size={12} style={{display: 'inline', marginRight: 4}}/> Amplio patio</>);
    if (lower.includes('garage') || lower.includes('garaje')) highlights.push(<><Car size={12} style={{display: 'inline', marginRight: 4}}/> Garaje incluido</>);
    if (lower.includes('basement') || lower.includes('sótano')) highlights.push(<><Package size={12} style={{display: 'inline', marginRight: 4}}/> Sótano espacioso</>);
    
    // Fill up to 3 if we couldn't find matches
    const fallbacks = [<><Sparkles size={12} style={{display: 'inline', marginRight: 4}}/> Espacios iluminados</>, <><Home size={12} style={{display: 'inline', marginRight: 4}}/> Listo para mudarse</>, <><Gem size={12} style={{display: 'inline', marginRight: 4}}/> Increíble oportunidad</>, <><Building size={12} style={{display: 'inline', marginRight: 4}}/> Barrio tranquilo</>];
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
    const videoRef = useRef(null);

    const [localPlay, setLocalPlay] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const aiBullets = extractAIHighlights(property.description);

    // Play/pause video based on active state and local play state
    useEffect(() => {
        if (!videoRef.current) return;
        
        if (isActive && localPlay) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Ignore autoplay interruptions gracefully
                });
            }
        } else {
            videoRef.current.pause();
            if (!isActive) {
                videoRef.current.currentTime = 0;
                setLocalPlay(true); // reset if we scroll away
            }
        }
    }, [isActive, localPlay]);

    const togglePlay = () => {
        setLocalPlay(!localPlay);
    };

    const handleFollow = (e) => {
        e.stopPropagation();
        setIsFollowing(true);
    };

    const handleLike = () => {
        setLiked(!liked);
    };

    const handleShare = async () => {
        const shareData = {
            title: `ZHomes Vibe: ${property.property_address || property.address}`,
            text: `¡Mira esta increíble propiedad en ${property.city} por $${property.price?.toLocaleString()}!`,
            url: window.location.origin + `/propiedades/${property.id}`,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(shareData.url);
                alert("Enlace copiado al portapapeles");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    return (
        <div className="vibe-post" onClick={togglePlay}>
            {/* Native Video Background */}
            <div className="vibe-media-wrapper">
                <video
                    ref={videoRef}
                    src={property.video}
                    className="vibe-media-video"
                    loop
                    muted
                    playsInline
                    preload="auto"
                />
                <div className="vibe-gradient-overlay"></div>
                
                {/* Visual indicator when paused */}
                {!localPlay && (
                    <div className="vibe-center-play">
                        <Play size={48} color="white" fill="white" />
                    </div>
                )}
            </div>




            {/* Right Action Column */}
            <div className="vibe-action-col">
                <div className="vibe-action-item" onClick={(e) => { e.stopPropagation(); onOpenRealtor(); }}>
                    <div className="vibe-realtor-profile">
                        <img src="/assets/logo/fav.png" alt="ZHomes" />
                        {!isFollowing ? (
                            <button className="vibe-realtor-add" onClick={handleFollow}>+</button>
                        ) : (
                            <button className="vibe-realtor-add" style={{background: 'var(--zhomes-red)'}} onClick={(e) => e.stopPropagation()}></button>
                        )}
                    </div>
                </div>

                <div className="vibe-action-item" onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="vibe-icon-bg">
                        <Heart size={26} color={liked ? '#e31e24' : 'white'} fill={liked ? '#e31e24' : 'transparent'} />
                    </motion.div>
                    <span>{Math.floor(Math.random() * 500) + 12}</span>
                </div>

                <div className="vibe-action-item" onClick={(e) => { e.stopPropagation(); navigate(`/propiedades/${property.id}`); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="vibe-icon-bg">
                        <Info size={26} color="white" />
                    </motion.div>
                    <span>Detalles</span>
                </div>

                <div className="vibe-action-item" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="vibe-icon-bg">
                        <Share2 size={26} color="white" />
                    </motion.div>
                    <span>Compartir</span>
                </div>
            </div>

            {/* Bottom Info Area */}
            <div className="vibe-info-area">
                {/*  FIXED: AI Property Summaries moved here for natural flex stacking */}
                {isActive && (
                    <div className="vibe-ai-summary">
                        {aiBullets.map((bullet, i) => (
                            <div key={i} className="ai-bullet">{bullet}</div>
                        ))}
                    </div>
                )}
                <h2 className="vibe-price">${property.price?.toLocaleString()}</h2>
                
                <div className="vibe-location">
                    <MapPin size={16} /> <span>{property.property_address || property.address}, {property.city}</span>
                </div>
                
                <div className="vibe-stats">
                    <div className="v-stat"><Bed size={16}/> {property.beds} Hab</div>
                    <div className="v-stat"><Bath size={16}/> {property.baths} Ba</div>
                    {/*  NEW: Calculadora de Hipoteca Interactiva */}
                    <div className="v-stat mortgage-clickable" onClick={(e) => { e.stopPropagation(); setShowMortgage(!showMortgage); }}>
                        <Square size={16}/> 
                        {showMortgage ? `~$${Math.round(property.price * 0.0068).toLocaleString()}/mes` : `${property.sqft} sqft`}
                    </div>
                </div>

                {/* Simulated "Now Playing" sound ticker for TikTok feel */}
                <div className="vibe-sound-ticker">
                    <div className="music-icon"><Music size={16} color="white"/></div>
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
    const realtorPhone = '15024686208'; // ZHomes main number
    const whatsappMsg = encodeURIComponent(`¡Hola! Vi esta propiedad en ZHomes Vibe: ${realtor?.address || realtor?.property_address || 'una propiedad'}. Me interesa obtener más información.`);

    return (
        <motion.div 
            className="vibe-realtor-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
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
                        "¡Hola! Te muestro esta propiedad en vivo. Escríbeme abajo" <ArrowDown size={14} style={{display: 'inline'}}/>
                    </div>

                    <div className="sheet-actions">
                        <a 
                            href={`https://wa.me/${realtorPhone}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sheet-btn primary-btn"
                        >
                            <MessageCircle size={20} /> Whatsapp
                        </a>
                        <a 
                            href={`tel:+${realtorPhone}`}
                            className="sheet-btn secondary-btn"
                        >
                            <Phone size={20} /> Llamar
                        </a>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
