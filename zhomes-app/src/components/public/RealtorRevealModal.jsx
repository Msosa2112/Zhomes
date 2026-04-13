import { useState, useRef, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Star, Instagram, Facebook, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import './RealtorRevealModal.css'

// Robust Video Component for iOS Safari compatibility
function RobustVideo({ src, isExpanded }) {
    const videoRef = useRef(null)
    const movSrc = src.replace('.webm', '.mov')

    useEffect(() => {
        const vid = videoRef.current
        if (vid) {
            vid.muted = true
            if (isExpanded) {
                vid.pause()
            } else {
                vid.play().catch(e => console.warn('Autoplay prevented', e))
            }
        }
    }, [src, isExpanded])

    return (
        <video ref={videoRef} muted loop playsInline disablePictureInPicture style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
            <source src={src} type="video/webm" />
            <source src={movSrc} type="video/quicktime" />
        </video>
    )
}

export default function RealtorRevealModal({ isOpen, onClose, onSelect, initialIndex, openDirectly }) {
    const [viewMode, setViewMode] = useState('carousel') // 'carousel' | 'detail'
    const [activeIndex, setActiveIndex] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [dragStartX, setDragStartX] = useState(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [isSpinning, setIsSpinning] = useState(false)
    const [isSheetExpanded, setIsSheetExpanded] = useState(false)
    const [sheetDragStartY, setSheetDragStartY] = useState(null)
    const [wasSwiped, setWasSwiped] = useState(false)

    const [realtors, setRealtors] = useState([])
    const [isLoadingAgents, setIsLoadingAgents] = useState(true)

    // Load agents from Supabase — only include those who have a photo uploaded
    useEffect(() => {
        supabase
            .from('zhomes_agents')
            .select('id, full_name, first_name, last_name, email, phone, bio, status, photo_url')
            .eq('status', 'Active')
            .order('full_name')
            .then(({ data, error }) => {
                if (error) console.warn('[RealtorRevealModal] Supabase error:', error.message);
                if (data && data.length > 0) {
                    const agentsWithPhotos = data.filter(a => a.photo_url && a.photo_url.trim() !== '');
                    setRealtors(agentsWithPhotos.map(a => ({
                        ...a,
                        name: a.full_name,
                        photo: a.photo_url
                    })));
                }
                setIsLoadingAgents(false);
            });
    }, []);

    const wheelTimeout = useRef(null)
    const spinTimeout = useRef(null)
    const dragDistanceRef = useRef(0)  // track drag distance synchronously for click guard
    const total = realtors.length

    // Placeholder appearances (no mock properties needed)
    const appearances = []

    // Only trigger spin/open logic when agents are loaded AND modal is open
    useEffect(() => {
        if (!isOpen || isLoadingAgents || total === 0) {
            if (!isOpen) {
                setViewMode('carousel')
                setIsSpinning(false)
                if (spinTimeout.current) clearTimeout(spinTimeout.current)
            }
            return;
        }

        if (openDirectly && initialIndex !== undefined && initialIndex !== null) {
            setActiveIndex(initialIndex)
            setViewMode('detail')
        } else if (initialIndex !== undefined && initialIndex !== null) {
            setActiveIndex(initialIndex)
            setViewMode('carousel')
        } else {
            // Roulette animation
            setViewMode('carousel')
            setIsSpinning(true)
            setActiveIndex(0)

            const targetIndex = Math.min(Math.floor(Math.random() * 3) + 3, total - 1);
            let currentSpin = 0

            const runSpin = () => {
                if (currentSpin < targetIndex) {
                    currentSpin++
                    setActiveIndex(currentSpin)
                    const progress = currentSpin / targetIndex
                    const ms = 40 + Math.pow(progress, 2.5) * 200
                    spinTimeout.current = setTimeout(runSpin, ms)
                } else {
                    setTimeout(() => setIsSpinning(false), 300)
                }
            }

            spinTimeout.current = setTimeout(runSpin, 40)
        }

        return () => {
            clearTimeout(wheelTimeout.current)
            if (spinTimeout.current) clearTimeout(spinTimeout.current)
        }
    }, [isOpen, initialIndex, openDirectly, total, isLoadingAgents])
    // NOTE: onSelect is called explicitly by the "CONTACT AGENT" button in the detail panel,
    // NOT automatically when entering detail view. This prevents the parent from closing
    // the modal prematurely before the user has confirmed their choice.

    if (!isOpen) return null

    if (isLoadingAgents) {
        return (
            <div className="marvel-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>Cargando agentes...</div>
            </div>
        )
    }

    // --- Touch / Mouse Drag ---
    const handlePointerDown = (e) => {
        setDragging(true)
        dragDistanceRef.current = 0  // reset on every new touch/click
        setDragStartX(e.clientX ?? e.touches?.[0]?.clientX)
        setDragOffset(0)
    }

    const handlePointerMove = (e) => {
        if (!dragging || dragStartX === null) return
        const x = e.clientX ?? e.touches?.[0]?.clientX
        const offset = x - dragStartX
        dragDistanceRef.current = Math.abs(offset)  // track synchronously for click guard
        setDragOffset(offset)
    }

    const handlePointerUp = () => {
        if (!dragging) return
        setDragging(false)
        
        if (viewMode === 'detail') {
            setDragOffset(0)
            setDragStartX(null)
            return
        }

        if (Math.abs(dragOffset) > 50) {
            if (dragOffset < 0) setActiveIndex(prev => prev + 1)
            else if (dragOffset > 0) setActiveIndex(prev => prev - 1)
        }
        setDragOffset(0)
        setDragStartX(null)
    }

    const handleFullClose = () => {
        onClose()
    }

    // --- Vertical Bottom Sheet Drag Detection ---
    const handleSheetTouchStart = (e) => {
        setSheetDragStartY(e.touches[0].clientY);
        setWasSwiped(false);
    }

    const handleSheetTouchEnd = (e) => {
        if (sheetDragStartY === null) return;
        const currentY = e.changedTouches[0].clientY;
        const diffY = currentY - sheetDragStartY;
        
        if (Math.abs(diffY) > 20) {
            setWasSwiped(true);
            if (diffY < -20 && !isSheetExpanded) {
                setIsSheetExpanded(true); // Deslizamiento hacia ARRIBA
            } else if (diffY > 20 && isSheetExpanded) {
                setIsSheetExpanded(false); // Deslizamiento hacia ABAJO
            }
        }
        setSheetDragStartY(null);
    }

    const handleSheetClick = () => {
        if (!wasSwiped) {
            setIsSheetExpanded(!isSheetExpanded);
        }
    }

    // --- Scroll Navigation ---
    const handleWheel = (e) => {
        if (wheelTimeout.current) return;
        if (viewMode === 'detail') return; // Disable horizontal scroll cycle in detail view

        if (e.deltaY > 20) {
            setActiveIndex(prev => prev + 1)
            wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null }, 350)
        } else if (e.deltaY < -20) {
            setActiveIndex(prev => prev - 1)
            wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null }, 350)
        }
    }

    const handleCardClick = (virtualIndex) => {
        // Guard: if the user was dragging (swiping), ignore click
        if (dragDistanceRef.current > 8) return
        if (viewMode === 'carousel') {
            setActiveIndex(virtualIndex)
            setViewMode('detail')
        }
    }

    const handleBackClick = () => {
        setViewMode('carousel')
    }

    // --- Calculation of Card Styles (Hero + Swipe left/right) ---
    const getCardStyle = (diff) => {
        const absDiff = Math.abs(diff)
        const offset = dragging ? dragOffset : 0

        const isMobile = window.innerWidth <= 768

        let translateX = 0, translateY = 0, scale = 1, opacity = 1, filter = 'none', zIndex = 0

        if (viewMode === 'carousel') {
            zIndex = total - absDiff
        } else {
            // Hero character must go BEHIND the detail panel (which has zIndex 20)
            zIndex = diff === 0 ? 10 : 0
        }

        if (viewMode === 'carousel') {
            // Screen 1: CAROUSEL 3D View
            const spacing = isMobile ? 180 : 250;
            translateX = (diff * spacing) + offset;

            const centerScale = isMobile ? 1.0 : 1.1;
            const otherScale = Math.max(0.6, (isMobile ? 0.7 : 0.8) - absDiff * 0.1);
            scale = absDiff === 0 ? centerScale : otherScale;

            opacity = absDiff === 0 ? 1 : Math.max(0.4, 0.9 - absDiff * 0.15);
            filter = absDiff === 0
                ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.6)) brightness(1)'
                : 'drop-shadow(0 5px 10px rgba(0,0,0,0.3)) brightness(0.8)';
        } else {
            // Screens 2-4: DETAIL View
            const heroOffsetMultiplier = isMobile ? 0 : 0.15;
            const heroTranslateX = -(window.innerWidth * heroOffsetMultiplier);
            const heroTranslateY = isMobile ? -30 : 90; // Raised on mobile so upper body is visible

            scale = isMobile ? 1.05 : 1.25;
            filter = isMobile ? 'none' : 'drop-shadow(0 20px 40px rgba(0,0,0,0.8)) brightness(1)';

            if (diff === 0) {
                // The current Hero
                translateX = heroTranslateX + offset;
                translateY = heroTranslateY;
                opacity = 1;
            } else if (diff > 0) {
                // Next characters (right)
                translateX = window.innerWidth * 1.2;
                opacity = 0;
            } else {
                // Previous characters (left)
                translateX = -window.innerWidth * 1.2;
                opacity = 0;
            }
        }

        return {
            transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
            opacity,
            zIndex,
            filter,
            transition: dragging ? 'none' : isSpinning ? 'transform 0.3s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease',
            cursor: viewMode === 'carousel' ? 'pointer' : 'default'
        }
    }

    // --- Detail Panel Styles (Horizontal Slide Push) ---
    const getPanelStyle = (diff, expanded) => {
        const offset = dragging ? dragOffset * 0.8 : 0
        const isMobile = window.innerWidth <= 768
        
        // 395px ensures the handle and the now-massive text float comfortably above the dark nav bar.
        const yOffset = isMobile ? (expanded ? 'translateY(0)' : 'translateY(calc(100% - 395px))') : 'translateY(0)'

        if (viewMode === 'carousel') {
            // Fade out
            return {
                opacity: 0,
                transform: `translateX(50px)`,
                pointerEvents: 'none',
                transition: 'transform 0.4s ease-out, opacity 0.3s'
            }
        } else {
            // Slide left/right based on diff
            if (diff === 0) {
                return {
                    opacity: 1,
                    transform: `translateX(${offset}px) ${yOffset}`,
                    pointerEvents: 'auto',
                    zIndex: 20,
                    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, background-color 0.4s ease'
                }
            } else if (diff > 0) {
                return {
                    opacity: 0,
                    transform: `translateX(${window.innerWidth}px) ${yOffset}`,
                    pointerEvents: 'none',
                    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, background-color 0.4s ease'
                }
            } else {
                return {
                    opacity: 0,
                    transform: `translateX(${-window.innerWidth}px) ${yOffset}`,
                    pointerEvents: 'none',
                    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, background-color 0.4s ease'
                }
            }
        }
    }

    const visibleCount = 9; // Suficiente para pre-renderizar cartas en ambos extremos
    const half = Math.floor(visibleCount / 2);
    const visibleItems = [];
    for (let i = -half; i <= half; i++) {
        const virtualIndex = activeIndex + i;
        const realIndex = ((virtualIndex % total) + total) % total;
        visibleItems.push({
            virtualIndex,
            realIndex,
            realtor: realtors[realIndex],
            diff: i
        });
    }

    return (
        <div className={`marvel-overlay ${isOpen ? 'active' : ''}`}>
            <div className="dashboard-layout marvel-layout">
                <div className="dashboard-screen marvel-screen" style={{ overflow: 'hidden' }}>



                    <div className="marvel-container">
                        {/* --- 1. SELECTION UI (Fades out when in detail view) --- */}
                        <div className={`marvel-watermark-layer ${viewMode === 'detail' ? 'fade-out' : ''}`}>
                            <div className="marvel-watermark-text">CHOOSE AGENT</div>
                        </div>

                        {/* Eliminated the bottom text and arrows based on user request */}

                        <div
                            className="marvel-interaction-layer"
                            style={{ pointerEvents: isSpinning ? 'none' : 'auto' }}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={(e) => handlePointerDown(e.touches[0])}
                            onTouchMove={(e) => handlePointerMove(e.touches[0])}
                            onTouchEnd={handlePointerUp}
                            onWheel={handleWheel}
                        >
                            {/* Heroes */}
                            {visibleItems.map(({ virtualIndex, realtor: r, diff }) => (
                                <div
                                    key={`hero-${virtualIndex}`}
                                    className="marvel-char-card"
                                    style={getCardStyle(diff)}
                                    onClick={() => handleCardClick(virtualIndex)}
                                >
                                    {r.video && diff === 0 && viewMode === 'detail' ? (
                                        <RobustVideo src={r.video} isExpanded={isSheetExpanded} />
                                    ) : (
                                        <img src={r.photo} alt={r.name} draggable="false" />
                                    )}

                                    {/* Nombre flotante solo visible en carrusel cuando no es activo (o cuando hover) */}
                                    <div className={`marvel-char-label ${diff === 0 && viewMode === 'carousel' ? 'visible' : ''}`}>
                                        {r.name}
                                    </div>
                                </div>
                            ))}

                            {/* Paneles de Detalle (Horizontal Slide) NOW INSIDE interaction layer so z-index works! */}
                            <div className="marvel-panels-container" style={{ pointerEvents: 'none', zIndex: 20 }}>
                                {/* Back button fixed top left, fades in on detail */}
                                <button
                                    className={`marvel-back-global ${viewMode === 'carousel' ? 'hidden' : ''}`}
                                    onClick={handleBackClick}
                                >
                                    ← BACK TO SELECTION
                                </button>

                                {visibleItems.map(({ virtualIndex, realtor: r, diff }) => (
                                    <div key={`panel-${virtualIndex}`} className={`marvel-detail-panel ${isSheetExpanded ? 'expanded' : ''}`} style={getPanelStyle(diff, isSheetExpanded)}>
                                        
                                        {/* Drag Handle & Minimal Info */}
                                        <div 
                                            className="sheet-handle-zone" 
                                            onClick={handleSheetClick}
                                            onTouchStart={handleSheetTouchStart}
                                            onTouchEnd={handleSheetTouchEnd}
                                        >
                                            <div className="sheet-pill"></div>
                                            <div className="panel-subtitle" style={{marginTop:'5px', marginBottom:'2px'}}>Zhomes Real Estate</div>
                                            <h2 className="panel-title" style={{'--char-count': r.name.length, margin: 0, paddingBottom: 0}}>{r.name.toUpperCase()}</h2>
                                        </div>

                                        {/* Hidden Content */}
                                        <div className="sheet-scroll-content" style={{ opacity: isSheetExpanded ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: isSheetExpanded ? 'auto' : 'none' }}>
                                            
                                            {/* Breve descripción */}
                                            <p className="panel-bio" style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px', fontStyle: 'italic', textAlign: 'center' }}>
                                                {r.bio || "Comprometid" + (r.name.includes('Jessica') || r.name.includes('Sofía') ? "a" : "o") + " en brindarte la mejor asesoría y acompañarte en cada paso para encontrar el espacio ideal."}
                                            </p>

                                            {/* Tabla de Datos Técnicos */}
                                            <div className="panel-data-table">
                                                <div className="data-row"><span className="label">EXPERIENCE</span><span className="value">{r.experience}</span></div>
                                                <div className="data-row"><span className="label">SALES</span><span className="value">{r.sales}</span></div>
                                                <div className="data-row"><span className="label">LANGUAGES</span><span className="value">EN, ES</span></div>
                                            </div>



                                            {/* Contact Info & Redes Sociales */}
                                            <div className="panel-contact-info" style={{ marginBottom: '15px' }}>
                                                {/* Teléfono */}
                                                <div 
                                                    style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--zhomes-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}
                                                    onClick={() => window.open(`tel:${r.phone || '+13055551234'}`)}
                                                >
                                                    <Phone size={20} fill="currentColor" /> {r.phone || '+1 (305) 555-1234'}
                                                </div>

                                                {/* Iconos Redes */}
                                                <div className="panel-socials" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                                    {/* TikTok */}
                                                    <button className="social-btn" onClick={() => window.open('https://tiktok.com', '_blank')} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                                                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.39-2.92 5.74-1.74 1.34-4.04 1.83-6.19 1.48-2.29-.35-4.36-1.7-5.59-3.63-1.2-1.89-1.5-4.27-.85-6.38.64-2.12 2.31-3.9 4.39-4.73 2.1-.84 4.54-.92 6.72-.25v4.06c-1.15-.47-2.45-.63-3.65-.35-1.07.24-2.02.94-2.6 1.87-.56.9-.7 2-.42 3.02.26.96.95 1.79 1.84 2.21.92.44 2.03.53 3.01.27.94-.25 1.73-.89 2.19-1.74.45-.82.68-1.76.68-2.69V.03z" />
                                                        </svg>
                                                    </button>
                                                    {/* Instagram */}
                                                    <button className="social-btn" onClick={() => window.open('https://instagram.com', '_blank')} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                        <Instagram size={20} />
                                                    </button>
                                                    {/* Facebook */}
                                                    <button className="social-btn" onClick={() => window.open('https://facebook.com', '_blank')} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                        <Facebook size={20} />
                                                    </button>
                                                    {/* WhatsApp */}
                                                    <button className="social-btn" onClick={() => window.open(`https://wa.me/${(r.phone || '13055551234').replace(/\D/g, '')}`, '_blank')} style={{ background: '#25D366', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="panel-contact" style={{ paddingBottom: '20px' }}>
                                                <button className="marvel-action-btn" onClick={() => onSelect(r)}>
                                                    CONTACT AGENT
                                                </button>
                                            </div>
                                            <div style={{ height: '80px' }}></div> {/* Espaciador inferior para scroll pasivo */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

