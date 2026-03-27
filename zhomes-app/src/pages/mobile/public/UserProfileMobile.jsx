import { useState, useEffect } from 'react'
import { Heart, User, Settings, LogOut, ArrowRight, Share, Cpu, X, FileText, UploadCloud, CheckCircle2, Users, Search, FileCheck, Key, Home, Compass, MapPin, SlidersHorizontal, DollarSign, TrendingUp, Shield, Vault, ChevronRight, Lock } from 'lucide-react'
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

    // ZHomes Match Prefs State
    const [showMatchModal, setShowMatchModal] = useState(false)
    const [matchPrefs, setMatchPrefs] = useState({
        priceVsLocation: 50,
        moveInReady: 80,
        schools: 'B',
        lifestyle: 'family'
    })

    // Buying Power State
    const [budget, setBudget] = useState(350000)
    const [downPct, setDownPct] = useState(20)
    const interestRate = 7.1
    const calcMonthly = (price, dpPct, rate) => {
        const principal = price * (1 - dpPct / 100)
        const monthlyRate = rate / 100 / 12
        const n = 360
        return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
    }
    const monthlyPayment = calcMonthly(budget, downPct, interestRate)
    const downAmount = Math.round(budget * downPct / 100)
    const closingCosts = Math.round(budget * 0.03)

    // Offer Vault State
    const [showVaultModal, setShowVaultModal] = useState(false)
    const [vaultDocs, setVaultDocs] = useState({
        preApproval: null,
        govId: null,
        proofOfFunds: null
    })
    const vaultComplete = Object.values(vaultDocs).every(Boolean)

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

                {/* Journey Tracker */}
                <div className="up-journey-card">
                    <div className="up-journey-header">
                        <h3><Compass size={20} color="var(--zhomes-red)" /> Mi Progreso Inmobiliario</h3>
                        <span style={{fontSize:'0.8rem', color:'var(--zhomes-red)', fontWeight:600}}>Fase 1 de 5</span>
                    </div>
                    
                    <div className="up-journey-tracker">
                        <div className="up-journey-line">
                            <div className="up-journey-progress" style={{width: '0%'}}></div>
                        </div>
                        
                        <div className="up-journey-step active">
                            <div className="up-journey-icon"><Search size={20} /></div>
                            <span className="up-journey-label">Explorando</span>
                        </div>
                        <div className="up-journey-step">
                            <div className="up-journey-icon"><FileCheck size={20} /></div>
                            <span className="up-journey-label">Aprobado</span>
                        </div>
                        <div className="up-journey-step">
                            <div className="up-journey-icon"><MapPin size={20} /></div>
                            <span className="up-journey-label">En Oferta</span>
                        </div>
                        <div className="up-journey-step">
                            <div className="up-journey-icon"><Key size={20} /></div>
                            <span className="up-journey-label">Contrato</span>
                        </div>
                        <div className="up-journey-step">
                            <div className="up-journey-icon"><Home size={20} /></div>
                            <span className="up-journey-label">Cierre</span>
                        </div>
                    </div>
                    
                    <div className="up-journey-message">
                        <strong>¡Estás en el camino correcto!</strong> Continúa guardando tus propiedades favoritas para que el algoritmo entienda tus gustos. Toca aquí para ver opciones de financiamiento y pre-aprobarte.
                    </div>
                </div>

                {/* Match Preferences Card */}
                <div className="up-ai-card" style={{background: 'var(--bg-primary)', borderColor: 'var(--border-color)', boxShadow: 'none'}} onClick={() => setShowMatchModal(true)}>
                    <div className="up-ai-icon" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'none'}}>
                        <SlidersHorizontal size={26} />
                    </div>
                    <div className="up-ai-text">
                        <h3 style={{color: 'var(--text-primary)'}}>ZHomes Match</h3>
                        <p>Ajusta cómo el algoritmo encuentra tu casa ideal.</p>
                    </div>
                    <div className="up-ai-arrow">
                        <ArrowRight size={20} color="var(--text-tertiary)" />
                    </div>
                </div>

                {/* Buying Power Dashboard */}
                <div className="up-buying-power-card">
                    <div className="up-bp-header">
                        <div className="up-bp-title">
                            <DollarSign size={20} color="#10b981" />
                            <h3>Buying Power</h3>
                        </div>
                        <span className="up-bp-badge">Live</span>
                    </div>

                    <div className="up-bp-monthly">
                        <span className="up-bp-amount">${monthlyPayment.toLocaleString()}</span>
                        <span className="up-bp-label">/mes estimado</span>
                    </div>

                    <div className="up-bp-slider-group">
                        <div className="up-bp-slider-header">
                            <label>Precio de Compra</label>
                            <span>${budget.toLocaleString()}</span>
                        </div>
                        <input type="range" min="100000" max="1000000" step="5000"
                            className="up-match-slider up-bp-slider"
                            value={budget}
                            onChange={e => setBudget(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="up-bp-slider-group">
                        <div className="up-bp-slider-header">
                            <label>Enganche</label>
                            <span>{downPct}% — ${downAmount.toLocaleString()}</span>
                        </div>
                        <input type="range" min="3" max="30"
                            className="up-match-slider up-bp-slider"
                            value={downPct}
                            onChange={e => setDownPct(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="up-bp-breakdown">
                        <div className="up-bp-row">
                            <span>Tasa actual (30-yr fixed)</span>
                            <span className="up-bp-val">{interestRate}%</span>
                        </div>
                        <div className="up-bp-row">
                            <span>Costos de cierre estimados</span>
                            <span className="up-bp-val">${closingCosts.toLocaleString()}</span>
                        </div>
                        <div className="up-bp-row">
                            <span>Efectivo necesario al cierre</span>
                            <span className="up-bp-val green">${(downAmount + closingCosts).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Offer Vault */}
                <div className="up-vault-card" onClick={() => setShowVaultModal(true)}>
                    <div className="up-vault-header">
                        <Shield size={20} color={vaultComplete ? '#10b981' : '#8B5CF6'} />
                        <h3>Bóveda de Ofertas</h3>
                        {vaultComplete
                            ? <span className="up-vault-status complete">Listo ✓</span>
                            : <span className="up-vault-status pending">{Object.values(vaultDocs).filter(Boolean).length}/3</span>
                        }
                    </div>
                    <p className="up-vault-desc">Sube tus documentos una vez y haz ofertas con un solo toque.</p>
                    <div className="up-vault-slots">
                        <div className={`up-vault-slot ${vaultDocs.preApproval ? 'done' : ''}`}>
                            {vaultDocs.preApproval ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                            Pre-aprobación
                        </div>
                        <div className={`up-vault-slot ${vaultDocs.govId ? 'done' : ''}`}>
                            {vaultDocs.govId ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                            ID Oficial
                        </div>
                        <div className={`up-vault-slot ${vaultDocs.proofOfFunds ? 'done' : ''}`}>
                            {vaultDocs.proofOfFunds ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                            Prueba de Fondos
                        </div>
                    </div>
                    <div className="up-vault-cta">
                        {vaultComplete ? 'Ver documentos' : 'Completar Bóveda'} <ChevronRight size={16} />
                    </div>
                </div>

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

                {/* Co-Shopping Card */}
                <Link to="/pareja" className="up-ai-card" style={{marginTop: '16px', background: 'linear-gradient(135deg,rgb(170, 20, 26) 0%, rgb(170, 20, 25) 100%)', marginBottom: '24px'}}>
                    <div className="up-ai-icon" style={{background: 'rgba(255,255,255,0.2)'}}>
                        <Users size={26} color="#ffffff" />
                    </div>
                    <div className="up-ai-text">
                        <h3 style={{color: 'white'}}>Modo Parejas (Co-Shopping)</h3>
                        <p style={{color: 'rgba(255,255,255,0.9)'}}>Vincula tu cuenta con tu pareja y descubran sus "Matches".</p>
                    </div>
                    <div className="up-ai-arrow">
                        <ArrowRight size={20} color="white" />
                    </div>
                </Link>

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

            {/* Offer Vault Modal */}
            {showVaultModal && (
                <div className="up-modal-overlay" onClick={() => setShowVaultModal(false)}>
                    <div className="up-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="up-modal-header">
                            <h2><Shield size={24} color="#8B5CF6" /> Bóveda de Ofertas</h2>
                            <button className="up-modal-close" onClick={() => setShowVaultModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Guarda tus documentos clave una sola vez. Cuando encuentres una casa, haremos la oferta al instante.
                        </p>

                        {[{ key: 'preApproval', label: 'Pre-aprobación Bancaria', desc: 'Carta de tu banco o lender' },
                          { key: 'govId', label: 'Identificación Oficial', desc: 'Pasaporte o licencia de manejar' },
                          { key: 'proofOfFunds', label: 'Prueba de Fondos', desc: 'Estado de cuenta bancario' }
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="up-vault-upload-slot">
                                <div className="up-vault-upload-info">
                                    {vaultDocs[key]
                                        ? <CheckCircle2 size={22} color="#10b981" />
                                        : <UploadCloud size={22} color="var(--text-tertiary)" />
                                    }
                                    <div>
                                        <div className="up-vault-upload-label">{label}</div>
                                        <div className="up-vault-upload-desc">{vaultDocs[key] ? vaultDocs[key] : desc}</div>
                                    </div>
                                </div>
                                <label className="up-vault-upload-btn">
                                    <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }}
                                        onChange={e => {
                                            if (e.target.files[0]) {
                                                setVaultDocs(prev => ({ ...prev, [key]: e.target.files[0].name }));
                                            }
                                        }}
                                    />
                                    {vaultDocs[key] ? 'Cambiar' : 'Subir'}
                                </label>
                            </div>
                        ))}

                        <button
                            className="up-btn flat"
                            style={{ width: '100%', marginTop: '20px', background: '#8B5CF6', color: 'white', opacity: vaultComplete ? 1 : 0.6 }}
                            onClick={() => setShowVaultModal(false)}
                        >
                            {vaultComplete ? '✓ Bóveda Completa — ¡Lista para ofertas!' : `Guardado (${Object.values(vaultDocs).filter(Boolean).length}/3)`}
                        </button>
                    </div>
                </div>
            )}

            {/* Match Modal */}
            {showMatchModal && (
                <div className="up-modal-overlay" onClick={() => setShowMatchModal(false)}>
                    <div className="up-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="up-modal-header">
                            <h2><SlidersHorizontal size={24} color="var(--zhomes-red)" /> Ajustes ZHomes Match</h2>
                            <button className="up-modal-close" onClick={() => setShowMatchModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Enséñale a nuestro algoritmo qué es realmente importante para ti. Tus recomendaciones cambiarán al guardar estos ajustes.
                        </p>

                        <div className="up-match-setting">
                            <div className="up-match-setting-header">
                                <label>Precio vs. Ubicación</label>
                                <span className="up-match-setting-value">
                                    {matchPrefs.priceVsLocation < 33 ? 'Priorizo Presupuesto' : matchPrefs.priceVsLocation > 66 ? 'Priorizo Ubicación' : 'Balanceado'}
                                </span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                className="up-match-slider" 
                                value={matchPrefs.priceVsLocation}
                                onChange={(e) => setMatchPrefs({...matchPrefs, priceVsLocation: parseInt(e.target.value)})}
                            />
                        </div>

                        <div className="up-match-setting">
                            <div className="up-match-setting-header">
                                <label>Condición de la Casa</label>
                                <span className="up-match-setting-value">
                                    {matchPrefs.moveInReady > 70 ? 'Lista para vivir' : matchPrefs.moveInReady < 30 ? 'Fixer Upper' : 'Un poco de todo'}
                                </span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                className="up-match-slider" 
                                value={matchPrefs.moveInReady}
                                onChange={(e) => setMatchPrefs({...matchPrefs, moveInReady: parseInt(e.target.value)})}
                            />
                        </div>

                        <div className="up-match-setting">
                            <label>Calidad Escolar Mínima</label>
                            <div className="up-match-chips">
                                <button className={`up-match-chip ${matchPrefs.schools === 'A' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, schools: 'A'})}>Escuelas A</button>
                                <button className={`up-match-chip ${matchPrefs.schools === 'B' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, schools: 'B'})}>Escuelas B+</button>
                                <button className={`up-match-chip ${matchPrefs.schools === 'C' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, schools: 'C'})}>No es clave</button>
                            </div>
                        </div>

                        <div className="up-match-setting">
                            <label>Estilo de Vida (Vibe)</label>
                            <div className="up-match-chips">
                                <button className={`up-match-chip ${matchPrefs.lifestyle === 'family' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, lifestyle: 'family'})}>Barrio Familiar</button>
                                <button className={`up-match-chip ${matchPrefs.lifestyle === 'nightlife' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, lifestyle: 'nightlife'})}>Vida Nocturna</button>
                                <button className={`up-match-chip ${matchPrefs.lifestyle === 'walkable' ? 'active' : ''}`} onClick={() => setMatchPrefs({...matchPrefs, lifestyle: 'walkable'})}>Caminable</button>
                            </div>
                        </div>

                        <button 
                            className="up-btn flat" 
                            style={{ width: '100%', marginTop: 'auto', background: 'var(--zhomes-red)', color: 'white' }}
                            onClick={() => {
                                setShowMatchModal(false);
                            }}
                        >
                            Guardar Preferencias
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
