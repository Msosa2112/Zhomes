import { useState, useEffect } from 'react'
import { Heart, User, Settings, LogOut, ArrowRight, Share, Cpu, X, FileText, UploadCloud, CheckCircle2, Users, Search, FileCheck, Key, Home, Compass, MapPin, SlidersHorizontal, DollarSign, TrendingUp, Shield, Vault, ChevronRight, Lock, BarChart3, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useProperties } from '../../../context/PropertyContext'
import PrequalToolMobile from '../../../components/public/PrequalToolMobile'
import ZSlider from '../../../components/ui/ZSlider'
import RealtorSelectorModal from '../../../components/public/RealtorSelectorModal'
import './UserProfileMobile.css'

export default function UserProfileMobile() {
    const navigate = useNavigate()
    const { properties: globalProperties } = useProperties()
    const [user, setUser] = useState(null)
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingFavs, setLoadingFavs] = useState(true)

    // Pre-qual saved summary (for card display)
    const [savedPrequal, setSavedPrequal] = useState(null)

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
    const [showPrequalModal, setShowPrequalModal] = useState(false)
    const [vaultDocs, setVaultDocs] = useState({
        preApproval: null,
        govId: null,
        proofOfFunds: null
    })
    const vaultComplete = Object.values(vaultDocs).every(Boolean)

    // Edit Profile State
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)

    const openEditProfile = () => {
        setEditName(user?.user_metadata?.full_name || '')
        setEditPhone(user?.user_metadata?.phone || user?.phone || '')
        setShowEditProfile(true)
    }

    // Agent Selection State
    const [myAgentId, setMyAgentId] = useState(() => localStorage.getItem('zhomes_my_agent'))
    const [showAgentModal, setShowAgentModal] = useState(false)
    const [myAgent, setMyAgent] = useState(null)

    const handleSaveProfile = async () => {
        setSavingProfile(true)
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: editName,
                    phone: editPhone,
                }
            })
            if (error) throw error
            setUser(prev => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, full_name: editName, phone: editPhone }
            }))
            setShowEditProfile(false)
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setSavingProfile(false)
        }
    }

    useEffect(() => {
        const fetchUserAndFavorites = async () => {
            // Check demo user bypass first (localStorage)
            const demoRaw = localStorage.getItem('zhomes_demo_user')
            const demoUser = demoRaw ? JSON.parse(demoRaw) : null

            const { data: { session } } = await supabase.auth.getSession()

            if (!session && !demoUser) {
                navigate('/login')
                return
            }

            // Use real session user or build a demo user object
            const currentUser = session?.user || {
                id: 'demo-client-001',
                email: demoUser?.email || 'cliente@zhomes.com',
                user_metadata: { full_name: demoUser?.name || 'Carlos Rivera (Demo)' },
                isDemo: true,
            }
            setUser(currentUser)

            // Sync assigned agent from metadata
            const assignedAgentId = currentUser.user_metadata?.assigned_realtor_id || localStorage.getItem('zhomes_my_agent');
            if (assignedAgentId) {
                setMyAgentId(assignedAgentId);
                localStorage.setItem('zhomes_my_agent', assignedAgentId);
            }

            // Fetch favorites from DB (skip for demo users to avoid UUID constraint errors)
            if (!currentUser.isDemo) {
                const { data: favsData, error: favsError } = await supabase
                    .from('user_favorites')
                    .select('property_id, property_data')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })

                if (favsError) {
                    console.error('[ZH-PROFILE] Error loading favorites:', favsError)
                }

                if (favsData && favsData.length > 0) {
                    const allProps = globalProperties || []
                    
                    const matched = favsData.map(fav => {
                        const ctxMatch = allProps.find(p => String(p.id) === String(fav.property_id));
                        const p = fav.property_data || ctxMatch || { id: fav.property_id };
                        
                        return {
                            id: String(p.id || fav.property_id),
                            address: p.address || p.UnparsedAddress || 'Dirección no disponible',
                            price: p.price || p.ListPrice || 0,
                            image: p.image || p.primary_photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                            beds: p.beds || p.BedsTotal || 0,
                            baths: p.baths || p.BathroomsTotalInteger || 0
                        };
                    })
                    
                    setFavorites(matched)
                }
            }
            setLoading(false)
            setLoadingFavs(false)

            // Load saved pre-qual estimate for card
            if (!currentUser.isDemo) {
                const { data: prequalData } = await supabase
                    .from('prequal_estimates')
                    .select('result, updated_at, credit_tier_label')
                    .eq('user_id', currentUser.id)
                    .maybeSingle()
                if (prequalData?.result) setSavedPrequal(prequalData)
            }
        }

        fetchUserAndFavorites()
    }, [navigate])

    // Load the full agent object from Supabase whenever myAgentId changes
    useEffect(() => {
        if (!myAgentId) { setMyAgent(null); return; }
        supabase
            .from('zhomes_agents')
            .select('id, full_name, first_name, last_name, email, phone, bio, status')
            .eq('id', myAgentId)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setMyAgent({
                    ...data,
                    name: data.full_name,
                    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=E31E24&color=fff&size=200&bold=true`
                });
            });
    }, [myAgentId]);

    const handleLogout = async () => {
        localStorage.removeItem('zhomes_demo_user')
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
                    <button className="up-btn outline" onClick={openEditProfile}>Editar Perfil</button>
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
                        <ZSlider
                            label="Precio de Compra"
                            value={budget}
                            min={100000}
                            max={1000000}
                            step={5000}
                            color="#10b981"
                            onChange={setBudget}
                            formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                        />
                    </div>

                    <div className="up-bp-slider-group">
                        <ZSlider
                            label={`Enganche — $${downAmount.toLocaleString()}`}
                            value={downPct}
                            min={3}
                            max={30}
                            step={1}
                            color="#10b981"
                            onChange={setDownPct}
                            formatOptions={{ style: 'percent', maximumFractionDigits: 0 }}
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

                {/* Pre-Calificación Card */}
                <div
                    className="up-ai-card"
                    style={{ marginTop: '16px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
                    onClick={() => setShowPrequalModal(true)}
                >
                    <div className="up-ai-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <BarChart3 size={26} color="#ffffff" />
                    </div>
                    <div className="up-ai-text">
                        <h3 style={{ color: 'white' }}>Pre-Calificación Estimada <span className="up-ai-badge">REALTOR</span></h3>
                        {savedPrequal ? (
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                                Rango: {savedPrequal.result.rangeLow?.toLocaleString('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0})} — {savedPrequal.result.rangeHigh?.toLocaleString('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0})}
                            </p>
                        ) : (
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Calcula el rango de precio que un banco le aprobaría al cliente.</p>
                        )}
                    </div>
                    <div className="up-ai-arrow">
                        <ArrowRight size={20} color="rgba(255,255,255,0.7)" />
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

                {/* Mi Agente Inmobiliario */}
                <div className="up-section-title" style={{marginTop: '24px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <User size={20} color="var(--zhomes-red)" />
                        <h3>Mi Agente Inmobiliario</h3>
                    </div>
                </div>
                {myAgent ? (
                    <div className="up-agent-card" style={{display:'flex', gap:'12px', padding:'16px', background:'var(--bg-secondary)', borderRadius:'16px', border:'1px solid var(--border-color)', alignItems:'center', marginBottom: '24px'}}>
                        <img src={myAgent.image || myAgent.avatar || `https://ui-avatars.com/api/?name=${myAgent.name}`} style={{width:'50px', height:'50px', borderRadius:'25px', objectFit:'cover'}} />
                        <div style={{flex: 1}}>
                            <h4 style={{margin:0, fontSize:'1rem', color:'var(--text-primary)'}}>{myAgent.name}</h4>
                            <span style={{fontSize:'0.85rem', color:'var(--zhomes-red)', fontWeight:600}}>Tu Asesor Elegido</span>
                        </div>
                        <button onClick={() => setShowAgentModal(true)} style={{background:'transparent', border:'none', color:'var(--text-secondary)'}}><Settings size={20}/></button>
                    </div>
                ) : (
                    <button className="up-btn outline" style={{width:'100%', padding:'16px', display:'flex', justifyContent:'center', gap:'8px', marginBottom: '24px'}} onClick={() => setShowAgentModal(true)}>
                        <UserPlus size={20} /> Seleccionar Agente
                    </button>
                )}

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
                            <ZSlider
                                label="Precio vs. Ubicación"
                                value={matchPrefs.priceVsLocation}
                                min={0}
                                max={100}
                                step={1}
                                onChange={v => setMatchPrefs({...matchPrefs, priceVsLocation: v})}
                            />
                            <span className="up-match-setting-value" style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:2}}>
                                {matchPrefs.priceVsLocation < 33 ? 'Priorizo Presupuesto' : matchPrefs.priceVsLocation > 66 ? 'Priorizo Ubicación' : 'Balanceado'}
                            </span>
                        </div>

                        <div className="up-match-setting">
                            <ZSlider
                                label="Condición de la Casa"
                                value={matchPrefs.moveInReady}
                                min={0}
                                max={100}
                                step={1}
                                onChange={v => setMatchPrefs({...matchPrefs, moveInReady: v})}
                            />
                            <span className="up-match-setting-value" style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:2}}>
                                {matchPrefs.moveInReady > 70 ? 'Lista para vivir' : matchPrefs.moveInReady < 30 ? 'Fixer Upper' : 'Un poco de todo'}
                            </span>
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
            {/* Pre-Qual Modal */}
            {showPrequalModal && (
                <PrequalToolMobile
                    onClose={() => {
                        setShowPrequalModal(false)
                        // Refresh card summary after closing
                        if (user) {
                            supabase
                                .from('prequal_estimates')
                                .select('result, updated_at, credit_tier_label')
                                .eq('user_id', user.id)
                                .maybeSingle()
                                .then(({ data }) => { if (data?.result) setSavedPrequal(data) })
                        }
                    }}
                    userId={user?.id}
                />
            )}
            {/* Edit Profile Modal */}
            {showEditProfile && (
                <div className="up-modal-overlay" onClick={() => setShowEditProfile(false)}>
                    <div className="up-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="up-modal-header">
                            <h2><User size={24} color="var(--zhomes-red)" /> Editar Perfil</h2>
                            <button className="up-modal-close" onClick={() => setShowEditProfile(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Tu nombre completo"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Teléfono</label>
                                <input
                                    type="tel"
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>El correo no se puede cambiar desde aquí</span>
                            </div>
                        </div>

                        <button
                            className="up-btn flat"
                            style={{ width: '100%', marginTop: '24px', background: 'var(--zhomes-red)', color: 'white', opacity: savingProfile ? 0.6 : 1 }}
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                        >
                            {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            )}

            <RealtorSelectorModal 
                isOpen={showAgentModal} 
                onClose={() => setShowAgentModal(false)}
                onSelect={async (agent) => {
                    localStorage.setItem('zhomes_my_agent', agent.id);
                    setMyAgentId(agent.id);
                    setMyAgent({
                        ...agent,
                        name: agent.full_name,
                        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name)}&background=E31E24&color=fff&size=200&bold=true`
                    });
                    setShowAgentModal(false);
                    // Guardar en Supabase user_metadata
                    if (user && !user.isDemo) {
                        try {
                            await supabase.auth.updateUser({
                                data: { assigned_realtor_id: agent.id }
                            });
                        } catch (e) {
                            console.error('Error saving agent', e);
                        }
                    }
                }}
            />
        </>
    )
}
