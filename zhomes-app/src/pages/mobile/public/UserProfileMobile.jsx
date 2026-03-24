import { useState, useEffect } from 'react'
import { Heart, User, Settings, LogOut, ArrowRight, Share } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { SparkService } from '../../../services/sparkService'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './UserProfileMobile.css'

export default function UserProfileMobile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingFavs, setLoadingFavs] = useState(true)

    useEffect(() => {
        const fetchUserAndFavorites = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/login')
                return
            }
            setUser(session.user)

            // Fetch favorites from DB
            const { data: favsData } = await supabase
                .from('user_favorites')
                .select('property_id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (favsData && favsData.length > 0) {
                // Fetch details from Spark API for each favorite
                const promises = favsData.map(async (fav) => {
                    try {
                        const data = await SparkService.getListingDetails(fav.property_id)
                        const p = data.D?.Results?.[0]
                        if (p) {
                            return {
                                id: String(p.Id),
                                address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                                price: p.StandardFields.ListPrice || 0,
                                image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                                beds: p.StandardFields.BedsTotal || 0,
                                baths: p.StandardFields.BathsTotal || 0
                            }
                        }
                    } catch (e) {
                        // Fallback to mock if API fails
                        const fallbackProp = MOCK_PROPERTIES.find(mp => String(mp.id) === fav.property_id);
                        if(fallbackProp) return { ...fallbackProp, id: String(fallbackProp.id) };
                    }
                    return null
                })
                const results = await Promise.all(promises)
                setFavorites(results.filter(Boolean))
            }
            setLoading(false)
            setLoadingFavs(false)
        }

        fetchUserAndFavorites()
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    if (loading) {
        return <div className="up-loading">Cargando tu perfil...</div>
    }

    const userName = user?.user_metadata?.full_name || 'Usuario ZHomes'
    const userEmail = user?.email || ''
    const collectionUrl = `${window.location.origin}/coleccion/${user?.id}`

    return (
        <div className="up-page">
            <header className="up-header">
                <div className="up-avatar-circle">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <h2>{userName}</h2>
                <p>{userEmail}</p>

                <div className="up-actions">
                    <button className="up-btn outline">Editar Perfil</button>
                    <button className="up-btn flat" onClick={handleLogout}><LogOut size={16}/> Salir</button>
                </div>
            </header>

            <main className="up-content">
                <div className="up-section-title">
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <Heart size={20} color="var(--zhomes-red)" fill="var(--zhomes-red)" />
                        <h3>Mis Favoritos ({favorites.length})</h3>
                    </div>
                    {favorites.length > 0 && (
                        <button className="up-share-btn" onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Mi Colección ZHomes',
                                    url: collectionUrl
                                })
                            } else {
                                navigator.clipboard.writeText(collectionUrl)
                                alert('Link copiado al portapapeles!')
                            }
                        }}>
                            <Share size={16} /> Compartir
                        </button>
                    )}
                </div>

                {loadingFavs ? (
                    <p className="up-empty">Cargando propiedades...</p>
                ) : favorites.length === 0 ? (
                    <div className="up-empty-state">
                        <Heart style={{opacity: 0.3}} size={40} />
                        <p>Aún no has guardado ninguna propiedad.</p>
                        <Link to="/propiedades" className="up-empty-link">Explorar propiedades</Link>
                    </div>
                ) : (
                    <div className="up-favorites-list">
                        {favorites.map(prop => (
                            <Link to={`/propiedades/${prop.id}`} key={prop.id} className="up-fav-card">
                                <img src={prop.image} alt={prop.address} className="up-fav-img" />
                                <div className="up-fav-info">
                                    <h4>${prop.price?.toLocaleString()}</h4>
                                    <p className="up-fav-address">{prop.address}</p>
                                    <div className="up-fav-specs">
                                        <span>{prop.beds} Cuartos</span> • <span>{prop.baths} Baños</span>
                                    </div>
                                </div>
                                <div className="up-fav-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
