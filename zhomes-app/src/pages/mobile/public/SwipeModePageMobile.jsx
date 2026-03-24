import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, X, MapPin } from 'lucide-react'
import { SparkService } from '../../../services/sparkService'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import { supabase } from '../../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './SwipeModePageMobile.css'

export default function SwipeModePageMobile() {
    const navigate = useNavigate()
    const [properties, setProperties] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
        const initSwipe = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/login')
                return
            }
            setUser(session.user)

            try {
                const data = await SparkService.getProperties({ limit: 15 })
                const results = data.D?.Results || []
                if (results.length > 0) {
                    const mapped = results.map(p => ({
                        id: String(p.Id),
                        address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                        city: `${p.StandardFields.City || ''}, ${p.StandardFields.StateOrProvince || ''}`,
                        price: p.StandardFields.ListPrice || 0,
                        image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                        beds: p.StandardFields.BedsTotal || 0,
                        baths: p.StandardFields.BathsTotal || 0,
                        sqft: p.StandardFields.BuildingAreaTotal || 0,
                    }))
                    setProperties(mapped)
                } else {
                    throw new Error("Empty Spark API response")
                }
            } catch (err) {
                setProperties(MOCK_PROPERTIES.map(p => ({ ...p, id: String(p.id) })))
            } finally {
                setLoading(false)
            }
        }
        initSwipe()
    }, [navigate])

    const handleSwipe = async (direction, propertyId) => {
        if (direction === 'right' && user) {
            // Guardar en favoritos
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
            <h1 className="swipe-title">Zhomes Match</h1>
            <p className="swipe-subtitle">Desliza a la derecha si te gusta, a la izquierda si no.</p>

            <div className="swipe-card-container">
                <AnimatePresence>
                    {properties.map((prop, idx) => {
                        if (idx < currentIndex) return null;
                        const isTop = idx === currentIndex;
                        return (
                            <SwipeCard 
                                key={prop.id} 
                                property={prop} 
                                active={isTop}
                                onSwipe={(dir) => handleSwipe(dir, prop.id)}
                                zIndex={properties.length - idx}
                            />
                        )
                    })}
                </AnimatePresence>
            </div>

            <div className="swipe-actions">
                <button className="sa-btn no" onClick={() => handleSwipe('left', properties[currentIndex].id)}>
                    <X size={28} />
                </button>
                <button className="sa-btn yes" onClick={() => handleSwipe('right', properties[currentIndex].id)}>
                    <Heart size={28} fill="currentColor" />
                </button>
            </div>
        </div>
    )
}

function SwipeCard({ property, active, onSwipe, zIndex }) {
    const handleDragEnd = (event, info) => {
        const offset = info.offset.x
        const velocity = info.velocity.x

        if (offset > 100 || velocity > 500) {
            onSwipe('right')
        } else if (offset < -100 || velocity < -500) {
            onSwipe('left')
        }
    }

    return (
        <motion.div
            className="swipe-card"
            style={{ zIndex }}
            drag={active ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: active ? 1 : 0.95, opacity: 1, y: active ? 0 : 20 }}
            exit={{ x: active ? 500 : 0, opacity: 0, transition: { duration: 0.2 } }}
            whileDrag={{ scale: 1.05 }}
        >
            <img src={property.image} alt={property.address} className="sc-img" draggable="false" />
            <div className="sc-overlay">
                <h3 className="sc-price">${property.price?.toLocaleString()}</h3>
                <h4 className="sc-address">{property.address}</h4>
                <div className="sc-city"><MapPin size={14}/> {property.city}</div>
                <div className="sc-specs">
                    <span>{property.beds} Cuartos</span>
                    <span>{property.baths} Baños</span>
                    <span>{property.sqft?.toLocaleString()} sqft</span>
                </div>
            </div>
        </motion.div>
    )
}
