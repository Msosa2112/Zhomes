import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useProperties } from '../../../context/PropertyContext'
import { MapPin, Heart, ExternalLink, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import './SharedCollectionPageMobile.css'

export default function SharedCollectionPageMobile() {
    const { userId } = useParams()
    const { properties: globalProperties } = useProperties()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [ownerName, setOwnerName] = useState('Usuario')

    useEffect(() => {
        const fetchSharedFavorites = async () => {
            try {
                // Fetch the favorites
                const { data: favs, error: favError } = await supabase
                    .from('user_favorites')
                    .select('property_id, property_data')
                    .eq('user_id', userId)
                
                if (favError) throw favError

                if (!favs || favs.length === 0) {
                    setProperties([])
                    setLoading(false)
                    return
                }

                // Match against already-loaded global properties, use property_data as fallback
                const allProps = globalProperties || []
                const mapped = favs.map(fav => {
                    const ctxMatch = allProps.find(p => String(p.id) === String(fav.property_id));
                    const p = fav.property_data || ctxMatch || { id: fav.property_id };
                    return {
                        id: String(p.id || fav.property_id),
                        address: p.address || p.UnparsedAddress || 'Dirección no disponible',
                        city: p.city || '',
                        price: p.price || p.ListPrice || 0,
                        image: p.image || p.primary_photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                        beds: p.beds || p.BedsTotal || 0,
                        baths: p.baths || p.BathroomsTotalInteger || 0,
                        sqft: p.sqft || p.LivingArea || 0,
                    };
                });

                setProperties(mapped)
            } catch (err) {
                console.error("Error fetching shared collection:", err)
                setError("No se pudo cargar la colección o el enlace es inválido.")
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchSharedFavorites()
        } else {
            setError("Usuario no encontrado.")
            setLoading(false)
        }
    }, [userId, globalProperties])

    if (loading) return <div className="shared-centered">Cargando colección...</div>
    if (error) return <div className="shared-centered error">{error}</div>

    return (
        <div className="shared-page">
            <header className="shared-header">
                <Link to="/" className="shared-back-btn">
                    <ArrowLeft size={24} />
                </Link>
                <h1>Colección de Favoritos</h1>
                <p>Compartida a través de ZHomes</p>
            </header>

            <div className="shared-content">
                {properties.length === 0 ? (
                    <div className="shared-empty">
                        <Heart size={48} color="var(--text-tertiary)" />
                        <h3>La colección está vacía</h3>
                        <p>Aún no hay propiedades guardadas aquí.</p>
                        <Link to="/propiedades" className="shared-btn">Explorar Propiedades</Link>
                    </div>
                ) : (
                    <div className="shared-grid">
                        {properties.map((p, i) => (
                            <motion.div 
                                className="shared-card"
                                key={p.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <img src={p.image} alt={p.address} className="shared-img" />
                                <div className="shared-info">
                                    <div className="shared-price">${p.price.toLocaleString()}</div>
                                    <h3 className="shared-address">{p.address}</h3>
                                    <div className="shared-city"><MapPin size={12}/> {p.city}</div>
                                    <div className="shared-specs">
                                        <span>{p.beds} <br/>Camas</span>
                                        <span>{p.baths} <br/>Baños</span>
                                    </div>
                                    <Link to={`/propiedades/${p.id}`} className="shared-link-btn">
                                        Ver Propiedad <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
