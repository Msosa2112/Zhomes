import { Brain, TrendingUp, DollarSign, Clock, FileText, CheckCircle2, AlertCircle, Upload, Flame, Target, Trophy, Star, LogOut, Activity, X, MessageSquare, Calendar, Users, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import './RealtorDashboardMobile.css'

const CHALLENGES = [
    { emoji: '📄', name: 'Upload Master', desc: 'Sube 5 documentos esta semana', current: 3, total: 5, xp: 150, color: '#3B82F6' },
    { emoji: '💬', name: 'Comunicador', desc: 'Responde 10 mensajes del broker', current: 7, total: 10, xp: 100, color: '#8B5CF6' },
]

const XP = { current: 2450, level: 7, levelName: 'Rising Star', nextAt: 3000, prevAt: 2000 }
const STREAK = 12

export default function RealtorDashboardMobile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [myListings, setMyListings] = useState([])
    const [loading, setLoading] = useState(true)
    
    // AI Modals State
    const [showVibeStudio, setShowVibeStudio] = useState(false)
    const [showSmartFollow, setShowSmartFollow] = useState(false)
    const [generatingVibe, setGeneratingVibe] = useState(false)
    const [vibeResult, setVibeResult] = useState(null)
    const [generatingFollowUp, setGeneratingFollowUp] = useState(false)
    const [followUpResult, setFollowUpResult] = useState(null)

    const handleGenerateVibe = async () => {
        setGeneratingVibe(true)
        setVibeResult(null)
        try {
            const response = await fetch('/api/zhomes-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'vibe_creator', data: { propertyDetails: 'Propiedad moderna con piscina' } })
            })
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setVibeResult(data)
        } catch (err) {
            alert("Error conectando con IA: " + err.message)
        } finally {
            setGeneratingVibe(false)
        }
    }

    const handleGenerateFollowUp = async () => {
        setGeneratingFollowUp(true)
        setFollowUpResult(null)
        try {
            const response = await fetch('/api/zhomes-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'smart_followup', data: { clientData: { name: 'Alex G.', propertyAddress: '1045 Oak St.', views: 5, status: 'Interesado', lastActive: 'Hace 2 horas', interest: 'Comprar casa en los suburbios' } } })
            })
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setFollowUpResult(data)
        } catch (err) {
            alert("Error conectando con IA: " + err.message)
        } finally {
            setGeneratingFollowUp(false)
        }
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUser(session.user)
            }

            // Fetch real dummy listings from Supabase to simulate CRM properties
            const { data: listings, error } = await supabase
                .from('property_listings')
                .select('id, unparsed_address, current_price_public, status')
                .limit(5)
            
            if (!error && listings) {
                setMyListings(listings)
            }
            setLoading(false)
        }

        fetchDashboardData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (loading) {
        return <div className="mobile-dash-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh'}}>Cargando CRM...</div>
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agente'
    const activeTransactions = myListings.length
    const pendingDocs = 3 // Simulated 
    const totalEarned = 15800 // Simulated for now
    
    const xpPct = Math.round(((XP.current - XP.prevAt) / (XP.nextAt - XP.prevAt)) * 100)

    const ALERTS = [
        { type: 'warning', icon: AlertCircle, text: 'Faltan 3 documentos para 8708 Denise Dr', time: 'Hace 2 horas', color: '#EF4444' },
        { type: 'success', icon: CheckCircle2, text: 'Comisión de $8,925 aprobada', time: 'Hace 1 día', color: '#10B981' },
    ]

    return (
        <>
        <div className="mobile-dash-page">
            <div className="mobile-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Hola, {userName} 👋</h2>
                    <p>Aquí tienes tu Centro de Mando en vivo.</p>
                </div>
            </div>

            <div className="mobile-quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingBottom: '16px' }}>
                <Link to="/realtor/citas" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(59,130,246,0.1)' }}><Calendar size={22} color="#3B82F6" /></div>
                    <span>Citas</span>
                </Link>
                <Link to="/realtor/leads" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(245,158,11,0.1)' }}><Users size={22} color="#F59E0B" /></div>
                    <span>Leads</span>
                </Link>
                <Link to="/realtor/tareas" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(16,185,129,0.1)' }}><CheckCircle2 size={22} color="#10B981" /></div>
                    <span>Tareas</span>
                </Link>
                <Link to="/realtor/open-houses" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(236,72,153,0.1)' }}><MapPin size={22} color="#EC4899" /></div>
                    <span>OH</span>
                </Link>
                <Link to="/realtor/comisiones" className="m-quick-btn">
                    <div className="mq-icon"><DollarSign size={22} /></div>
                    <span>Comis</span>
                </Link>
                <Link to="/realtor/crear-propiedad" className="m-quick-btn">
                    <div className="mq-icon"><FileText size={22} /></div>
                    <span>Subir</span>
                </Link>
                <Link to="/realtor/perfil" className="m-quick-btn">
                    <div className="mq-icon"><Star size={22} /></div>
                    <span>Perfil</span>
                </Link>
                <Link to="/realtor/mensajes" className="m-quick-btn">
                    <div className="mq-icon"><MessageSquare size={22} /></div>
                    <span>Chat</span>
                </Link>
            </div>

            <div className="m-ai-widget">
                <div className="mai-head"><Brain size={18} /> ZhomesAI</div>
                <p>He analizado tu base de datos en Supabase. Tienes <strong>{activeTransactions}</strong> tratos activos. ¡Buen trabajo liderando la zona!</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 20px', marginBottom: '24px' }}>
                <button 
                    onClick={() => setShowVibeStudio(true)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--zhomes-red)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                >
                    <Upload size={24} color="var(--zhomes-red)" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Vibe Creator</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Generar Posts IA</span>
                </button>
                <button 
                    onClick={() => setShowSmartFollow(true)}
                    style={{ background: 'var(--bg-card)', border: '1px solid #10B981', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                >
                    <Activity size={24} color="#10B981" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Smart Follow-Up</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>CRM Predictivo</span>
                </button>
            </div>

            <div className="m-kpi-scroller">
                <div className="mk-card">
                    <FileText size={20} className="kblue" />
                    <span>Mis Tratos</span>
                    <strong>{activeTransactions}</strong>
                </div>
                <div className="mk-card">
                    <Clock size={20} className="kyellow" />
                    <span>Docs Pndts</span>
                    <strong>{pendingDocs}</strong>
                </div>
                <div className="mk-card">
                    <TrendingUp size={20} className="kgreen" />
                    <span>Ganancias</span>
                    <strong>${(totalEarned / 1000).toFixed(1)}K</strong>
                </div>
            </div>

            {/* Gamification Mobile UI */}
            <div className="m-dash-section">
                <h3><Flame size={16} color="#EF4444" style={{marginRight: '6px'}}/> Mi Progreso</h3>
                <div className="m-xp-row">
                    <div className="m-xp-badge">{XP.level}</div>
                    <div className="m-xp-info">
                        <strong>Nivel {XP.level} — {XP.levelName}</strong>
                        <div className="m-xp-bar-container">
                            <div className="m-xp-fill" style={{width: `${xpPct}%`}}></div>
                        </div>
                        <span>Faltan {XP.nextAt - XP.current} XP para el nivel {XP.level + 1}</span>
                    </div>
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Mis Propiedades Activas (Supabase)</h3>
                <div className="m-alerts-list">
                    {myListings.map((prop, idx) => (
                        <div className="m-alert" key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '14px', marginBottom: '4px' }}>{prop.unparsed_address}</strong>
                            <span style={{ fontSize: '12px', color: '#10B981' }}>${prop.current_price_public?.toLocaleString()}</span>
                        </div>
                    ))}
                    {myListings.length === 0 && <p style={{fontSize:'12px', color:'var(--text-tertiary)'}}>No tienes propiedades asignadas aún.</p>}
                </div>
            </div>

            <div className="m-dash-section" style={{marginBottom: '30px'}}>
                <h3>Alertas Automáticas <span className="m-badge-red">2</span></h3>
                <div className="m-alerts-list">
                    {ALERTS.map((al, idx) => (
                        <div className="m-alert" key={idx}>
                            <al.icon size={16} color={al.color} style={{flexShrink: 0}} />
                            <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                <p>{al.text}</p>
                                <span style={{fontSize: '10px', color: 'var(--text-tertiary)'}}>{al.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

            {/* Vibe Creator Studio Modal */}
            {showVibeStudio && (
                <div className="mai-rules-overlay" onClick={() => setShowVibeStudio(false)}>
                    <div className="mai-rules-content" onClick={e => e.stopPropagation()}>
                        <div className="mai-rules-header">
                            <h2><Flame size={24} color="var(--zhomes-red)" /> Vibe Creator Studio</h2>
                            <button className="mai-rules-close" onClick={() => setShowVibeStudio(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mai-rules-body">
                            <p>Sube fotos de la propiedad. La IA generará una descripción impecable para la MLS y un guion dinámico para TikTok/Reels.</p>
                            
                            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '32px 16px', textAlign: 'center', margin: '20px 0', background: 'rgba(255,255,255,0.02)' }}>
                                <Upload size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }}/>
                                <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Toca para subir fotos</h4>
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>JPG, PNG (Max 5MB)</span>
                            </div>

                            {vibeResult && (
                                <div style={{ background: 'rgba(255,107,107,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                                    <h4 style={{ color: 'var(--zhomes-red)', marginTop: 0 }}>MLS Description</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{vibeResult.mlsDescription}</p>
                                    <h4 style={{ color: 'var(--zhomes-red)', marginTop: '12px' }}>TikTok Script</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{vibeResult.tiktokScript}</p>
                                </div>
                            )}

                            <button className="mai-btn-save" onClick={handleGenerateVibe} disabled={generatingVibe} style={{ marginTop: '10px' }}>
                                {generatingVibe ? 'Generando...' : <><Brain size={18} /> Analizar y Generar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Follow-Up Modal */}
            {showSmartFollow && (
                <div className="mai-rules-overlay" onClick={() => setShowSmartFollow(false)}>
                    <div className="mai-rules-content" onClick={e => e.stopPropagation()}>
                        <div className="mai-rules-header">
                            <h2><Activity size={24} color="#10B981" /> Smart Follow-Up</h2>
                            <button className="mai-rules-close" onClick={() => setShowSmartFollow(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mai-rules-body">
                            <p>La IA ha detectado 2 clientes con alto interés basado en su comportamiento (tiempo viendo propiedades).</p>
                            
                            <div className="mai-rules-list" style={{ marginTop: '16px' }}>
                                <div className="mai-rule-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <strong style={{ color: '#10B981' }}>🔥 Cliente: Alex G.</strong>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Vio una casa 5 veces hoy</span>
                                    </div>
                                    
                                    {followUpResult ? (
                                        <span style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                            "{followUpResult.message}"
                                        </span>
                                    ) : (
                                        <button onClick={handleGenerateFollowUp} disabled={generatingFollowUp} style={{ background: 'transparent', color: '#10B981', border: '1px dashed #10B981', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', width: '100%' }}>
                                            {generatingFollowUp ? 'Generando recomendación...' : 'Generar mensaje con IA'}
                                        </button>
                                    )}

                                    {followUpResult && (
                                        <button style={{ background: '#10B981', color: '#111', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <MessageSquare size={14} /> Enviar Mensaje
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
