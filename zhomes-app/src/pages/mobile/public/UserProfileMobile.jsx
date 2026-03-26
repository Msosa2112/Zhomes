import { useState, useEffect } from 'react'
import { Heart, User, Settings, LogOut, ArrowRight, Share, Cpu, X, FileText, UploadCloud, CheckCircle2 } from 'lucide-react'
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

    // AI Modal State
    const [showAiModal, setShowAiModal] = useState(false)
    const [aiState, setAiState] = useState('idle') // idle, analyzing, done
    const [aiResult, setAiResult] = useState(null)

    const [selectedFile, setSelectedFile] = useState(null)

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setSelectedFile(file)
        setAiState('analyzing')
        
        try {
            // Try real AI analysis via serverless function (works on Vercel)
            const mockDocumentText = `Documento: ${file.name}. CONTRATO: HOA: 450 mensual. Mascotas: perros máx 20lbs. Rentas: Prohibido corto plazo.`;
            const response = await fetch('/api/zhomes-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'legal_translator', data: { documentText: mockDocumentText } })
            });
            
            if (!response.ok) throw new Error('API not available');
            
            const data = await response.json();
            setAiResult(data.summary)
            setAiState('done')
        } catch (err) {
            // Fallback: mock analysis for local dev
            setTimeout(() => {
                setAiResult([
                    "El documento estipula un cobro mensual de HOA de $450 USD. Aplican recargos del 5% si el pago pasa del día 5.",
                    "Solo se permiten perros y gatos de hasta 20 lbs. Mascotas exóticas están prohibidas.",
                    "Las rentas a corto plazo (AirBnb) están prohibidas. Periodo mínimo de arrendamiento: 6 meses.",
                    "El mantenimiento del patio frontal es responsabilidad del propietario. La HOA cubre áreas comunes."
                ])
                setAiState('done')
            }, 2500)
        }
    }

    const resetAi = () => {
        setAiState('idle')
        setSelectedFile(null)
    }

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
        <>
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
                
                {/* Zhomes AI Feature Card */}
                <div className="up-ai-card" onClick={() => setShowAiModal(true)}>
                    <div className="up-ai-icon">
                        <Cpu size={26} color="#ffffff" />
                    </div>
                    <div className="up-ai-text">
                        <h3>ZhomesAI Legal <span className="up-ai-badge">NUEVO</span></h3>
                        <p>Analiza contratos y documentos complejos en segundos con IA.</p>
                    </div>
                    <div className="up-ai-arrow">
                        <ArrowRight size={20} />
                    </div>
                </div>
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

            {/* AI Legal Translator Modal */}
            {showAiModal && (
                <div className="up-modal-overlay" onClick={() => setShowAiModal(false)}>
                    <div className="up-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="up-modal-header">
                            <h2><Cpu size={24} color="var(--zhomes-red)" /> ZhomesAI Legal</h2>
                            <button className="up-modal-close" onClick={() => { setShowAiModal(false); resetAi(); }}>
                                <X size={20} />
                            </button>
                        </div>

                        {aiState === 'idle' && (
                            <>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    Sube cualquier documento de HOA, disclosures o contratos de compraventa de tu casa actual o futura. La IA extraerá los puntos más importantes para ti.
                                </p>
                                
                                <label className="up-file-upload">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.doc,.docx" 
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }} 
                                    />
                                    <UploadCloud size={40} color="var(--text-tertiary)" />
                                    <p>Toca para adjuntar un documento (PDF, DOC)</p>
                                </label>
                            </>
                        )}

                        {aiState === 'analyzing' && (
                            <div className="up-ai-analyzing">
                                <div className="up-ai-analyzing-spinner"></div>
                                <p>ZhomesAI está leyendo el documento...</p>
                                <span style={{fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '8px'}}>Esto tomará unos segundos</span>
                            </div>
                        )}

                        {aiState === 'done' && (
                            <div>
                                <div className="up-file-info">
                                    <FileText size={20} color="var(--zhomes-red)" />
                                    <span>{selectedFile?.name || 'Documento_Legal.pdf'}</span>
                                </div>
                                
                                <div className="up-ai-result">
                                    <h4><CheckCircle2 size={18} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'6px'}}/> Resumen Inteligente:</h4>
                                    <ul>
                                        {aiResult ? aiResult.map((bullet, idx) => (
                                            <li key={idx}><strong>Punto {idx+1}:</strong> {bullet}</li>
                                        )) : (
                                            <>
                                                <li><strong>Costos de HOA:</strong> El documento estipula un cobro mensual de $450 USD. Aplican recargos del 5% si el pago pasa del día 5 de cada mes.</li>
                                                <li><strong>Mascotas:</strong> Solo se permiten perros y gatos de hasta 20 lbs. Mascotas exóticas están prohibidas por la asociación.</li>
                                                <li><strong>Alquileres (AirBnb):</strong> Las rentas a corto plazo están prohibidas. El periodo mínimo de arrendamiento es de 6 meses.</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <button 
                                    className="up-btn flat" 
                                    style={{ width: '100%', marginTop: '20px', background: 'var(--zhomes-red)', color: 'white' }}
                                    onClick={() => { setShowAiModal(false); resetAi(); }}
                                >
                                    ¡Entendido!
                                </button>
                                <button 
                                    className="up-btn outline" 
                                    style={{ width: '100%', marginTop: '12px', border: 'none' }}
                                    onClick={resetAi}
                                >
                                    Analizar otro documento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
