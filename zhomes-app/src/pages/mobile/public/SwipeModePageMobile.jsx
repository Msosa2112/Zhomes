import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { Heart, X, MapPin, Star, ArrowLeft, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProperties } from '../../../context/PropertyContext'
import { supabase } from '../../../lib/supabaseClient'
import './SwipeModePageMobile.css'

const MAX_VISIBLE = 5 // How many cards visible in the 3D stack

export default function SwipeModePageMobile() {
    const navigate = useNavigate()
    const [properties, setProperties] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    const { properties: globalProperties, loading: ctxLoading } = useProperties();

    useEffect(() => {
        const initSwipe = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/login')
                return
            }
            setUser(session.user)

            if (!ctxLoading) {
                 const active = globalProperties || [];
                 if (active.length > 0) {
                     // ZHomes exclusives first, then other active listings
                     // Off-market (closed) intentionally excluded from swipe
                     const zhomes = active.filter(p => p.exclusive)
                     const others = active.filter(p => !p.exclusive).sort(() => Math.random() - 0.5)
                     setProperties([...zhomes, ...others].slice(0, 150))
                 }
                 setLoading(false)
            }
        }
        initSwipe()
    }, [navigate, globalProperties, closedListings, ctxLoading])

    const handleSwipe = async (direction, propertyId) => {
        if (direction === 'right' && user) {
            try {
                await supabase.from('user_favorites').insert([{
                    user_id: user.id,
                    property_id: propertyId
                }])
            } catch (error) {
                console.error("Error saving favorite:", error)
            }
        }
        setCurrentIndex(prev => prev + 1)
    }

    const handleUndo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    if (loading) return <div className="swipe-loading">Buscando casas para ti...</div>

    if (currentIndex >= properties.length) {
        return (
            <div className="swipe-empty">
                <h2>¡Has visto todo!</h2>
                <p>Vuelve más tarde para ver nuevas opciones.</p>
                <button className="swipe-return-btn" onClick={() => navigate('/propiedades')}>Volver a la lista</button>
            </div>
        )
    }

    return (
        <div className="swipe-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ArrowLeft size={18} color="var(--text-primary)" /></button>
                <h1 className="swipe-title" style={{ margin: 0 }}>Zhomes Match</h1>
            </div>
            <p className="swipe-subtitle">Desliza a la derecha si te gusta, a la izquierda si no.</p>

            <div className="swipe-carousel">
                {properties.map((prop, idx) => {
                    const offset = idx - currentIndex
                    if (offset < -1 || offset >= MAX_VISIBLE) return null
                    const isActive = offset === 0

                    return (
                        <div
                            key={prop.id}
                            className={`swipe-card-wrapper ${isActive ? 'active' : ''}`}
                            style={{
                                '--offset': offset,
                                '--abs-offset': Math.abs(offset),
                                '--direction': offset === 0 ? 0 : offset > 0 ? 1 : -1,
                                zIndex: properties.length - Math.abs(offset)
                            }}
                        >
                            <SwipeCard
                                property={prop}
                                active={isActive}
                                onSwipe={(dir) => handleSwipe(dir, prop.id)}
                            />
                        </div>
                    )
                })}
            </div>

            <div className="swipe-actions">
                <button className="sa-btn no" onClick={() => handleSwipe('left', properties[currentIndex]?.id)}>
                    <X size={26} />
                </button>
                <button className="sa-btn undo" onClick={handleUndo} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>
                    <Undo2 size={22} />
                </button>
                <button className="sa-btn yes" onClick={() => handleSwipe('right', properties[currentIndex]?.id)}>
                    <Heart size={26} fill="currentColor" />
                </button>
            </div>
        </div>
    )
}

function SwipeCard({ property, active, onSwipe }) {
    const navigate = useNavigate()
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-12, 12])
    const likeOpacity = useTransform(x, [20, 100], [0, 1])
    const nopeOpacity = useTransform(x, [-20, -100], [0, 1])
    const isDragging = useRef(false)
    const pointerStart = useRef({ x: 0, y: 0 })

    const handlePointerDown = (e) => {
        isDragging.current = false
        pointerStart.current = { x: e.clientX, y: e.clientY }
    }

    const handleDragStart = () => {
        isDragging.current = true
    }

    const handleDragEnd = (event, info) => {
        const offset = info.offset.x
        const velocity = info.velocity.x

        if (offset > 100 || velocity > 500) {
            onSwipe('right')
        } else if (offset < -100 || velocity < -500) {
            onSwipe('left')
        }
    }

    const handlePointerUp = (e) => {
        if (isDragging.current) return
        // Check total movement from pointer start
        const dx = Math.abs(e.clientX - pointerStart.current.x)
        const dy = Math.abs(e.clientY - pointerStart.current.y)
        if (dx < 10 && dy < 10) {
            navigate(`/propiedades/${property.id}`)
        }
    }

    return (
        <motion.div
            className="swipe-card"
            style={{ x, rotate }}
            drag={active ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            whileDrag={{ scale: 1.03 }}
        >
            <img src={property.image} alt={property.address} className="sc-img" draggable="false" />
            
            {active && (
                <>
                    <motion.div className="swipe-stamp like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
                    <motion.div className="swipe-stamp nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>
                </>
            )}

            <div className="sc-overlay">
                {property.exclusive && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--zhomes-red)', color: '#fff', padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill="currentColor" /> ZHomes
                    </div>
                )}
                <h3 className="sc-price">${property.price?.toLocaleString()}</h3>
                <h4 className="sc-address">{property.address}</h4>
                <div className="sc-city"><MapPin size={14}/> {property.city}</div>
                <div className="sc-specs">
                    <span>{property.beds} Cuartos</span>
                    <span>{property.baths} Baños</span>
                    <span>{property.sqft?.toLocaleString()} sqft</span>
                </div>
                {property.listAgentName && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Agente: {property.listAgentName}</div>
                )}
            </div>
        </motion.div>
    )
}
