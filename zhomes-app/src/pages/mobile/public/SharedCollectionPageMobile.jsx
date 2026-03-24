import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SparkService } from '../../../services/sparkService'
import { supabase } from '../../../lib/supabaseClient'
import { MapPin, Heart, ExternalLink, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import './SharedCollectionPageMobile.css'

export default function SharedCollectionPageMobile() {
    const { userId } = useParams()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [ownerName, setOwnerName] = useState('Usuario')

    useEffect(() => {
        const fetchSharedFavorites = async () => {
            try {
                // Get the user's name if we had a profiles table. For now, since user_metadata isn't directly queryable for other users via public anon, we might just show "Colección Compartida"
                // Although, if it's the current user, we can get their name. If not, generic string.
                
                // Fetch the favorites
                const { data: favs, error: favError } = await supabase
                    .from('user_favorites')
                    .select('property_id')
                    .eq('user_id', userId)
                
                if (favError) throw favError

                if (!favs || favs.length === 0) {
                    setProperties([])
                    setLoading(false)
                    return
                }

                const propIds = favs.map(f => `'${f.property_id}'`).join(',')
                
                // Fetch details from Spark API
                const data = await SparkService.getActiveListings(`Id In (${propIds})`, 50)
                const results = data.D?.Results || []
                
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
    }, [userId])

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
