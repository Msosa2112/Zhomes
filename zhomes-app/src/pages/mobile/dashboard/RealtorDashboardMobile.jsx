import { Brain, TrendingUp, DollarSign, Clock, FileText, CheckCircle2, AlertCircle, Upload, Flame, Target, Trophy, Star, LogOut, Activity, X, MessageSquare, Calendar, Users, MapPin, Building2, Award, LineChart, PenTool } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useProperties } from '../../../context/PropertyContext'
import './RealtorDashboardMobile.css'

const XP = { current: 2450, level: 7, levelName: 'Rising Star', nextAt: 3000, prevAt: 2000 }

export default function RealtorDashboardMobile() {
    const navigate = useNavigate()
    const { zhomesListings, zhomesAgents, zhomesOffice, properties, offMarketListings, agentStats, loading: propsLoading } = useProperties()
    const [user, setUser] = useState(null)
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
            setLoading(false)
        }
        fetchDashboardData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (loading && propsLoading) {
        return <div className="mobile-dash-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh'}}>Cargando CRM...</div>
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agente'
    const activeListings = zhomesListings.length
    const totalAgents = zhomesAgents.length
    const totalMlsProperties = properties.length
    const totalClosedDeals = agentStats.reduce((sum, a) => sum + a.totalClosed, 0)
    const totalVolume = agentStats.reduce((sum, a) => sum + a.totalVolume, 0)
    const totalOffMarket = (offMarketListings || []).length
    
    const xpPct = Math.round(((XP.current - XP.prevAt) / (XP.nextAt - XP.prevAt)) * 100)

    const ALERTS = [
        { type: 'warning', icon: AlertCircle, text: 'Faltan 3 documentos para 8708 Denise Dr', time: 'Hace 2 horas', color: '#EF4444' },
        { type: 'success', icon: CheckCircle2, text: 'Oferta aceptada para 8708 Denise Dr', time: 'Hace 1 día', color: '#10B981' },
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
                <Link to="/realtor/crear-propiedad" className="m-quick-btn">
                    <div className="mq-icon"><FileText size={22} /></div>
                    <span>Subir</span>
                </Link>
                <Link to="/realtor/mensajes" className="m-quick-btn">
                    <div className="mq-icon"><MessageSquare size={22} /></div>
                    <span>Chat</span>
                </Link>
                <Link to="/realtor/firmas" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(16,185,129,0.1)' }}><PenTool size={22} color="#10B981" /></div>
                    <span>Firmas</span>
                </Link>
                <Link to="/cma" className="m-quick-btn">
                    <div className="mq-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><LineChart size={22} color="#38BDF8" /></div>
                    <span>CMA</span>
                </Link>
            </div>

            <div className="m-ai-widget">
                <div className="mai-head"><Brain size={18} /> ZhomesAI</div>
                <p>Tu oficina <strong>{zhomesOffice?.name || 'ZHomes Real Estate'}</strong> tiene <strong>{activeListings}</strong> listados activos, <strong>{totalAgents}</strong> agentes y acceso a <strong>{totalMlsProperties}</strong> propiedades en Louisville MLS.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 20px', marginBottom: '24px' }}>
                <button 
                    onClick={() => navigate('/realtor/subir-vibe')}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--zhomes-red)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                >
                    <Upload size={24} color="var(--zhomes-red)" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Subir Vibe</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Video de Propiedad</span>
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
                    <span>Activas</span>
                    <strong>{activeListings}</strong>
                </div>
                <div className="mk-card">
                    <Trophy size={20} className="kyellow" />
                    <span>Cierres</span>
                    <strong>{totalClosedDeals}</strong>
                </div>
                <div className="mk-card">
                    <DollarSign size={20} className="kgreen" />
                    <span>Volumen</span>
                    <strong>${totalVolume >= 1000000 ? (totalVolume / 1000000).toFixed(1) + 'M' : (totalVolume / 1000).toFixed(0) + 'K'}</strong>
                </div>
                <div className="mk-card">
                    <Users size={20} style={{color: '#EC4899'}} />
                    <span>Agentes</span>
                    <strong>{totalAgents}</strong>
                </div>
                <div className="mk-card">
                    <Building2 size={20} style={{color: '#8B5CF6'}} />
                    <span>Exclusivas</span>
                    <strong>{totalOffMarket}</strong>
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
                <h3><Building2 size={16} color="var(--zhomes-red)" style={{marginRight:'6px'}}/> Propiedades ZHomes (MLS Real)</h3>
                <div className="m-alerts-list">
                    {zhomesListings.map((prop, idx) => (
                        <div className="m-alert" key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img src={prop.image} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <strong style={{ fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.address}</strong>
                                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 'bold' }}>${prop.price?.toLocaleString()}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{prop.beds}bd / {prop.baths}ba / {prop.sqft?.toLocaleString()} sqft — {prop.listAgentName}</span>
                            </div>
                        </div>
                    ))}
                    {zhomesListings.length === 0 && <p style={{fontSize:'12px', color:'var(--text-tertiary)'}}>No hay listados activos de ZHomes en la MLS.</p>}
                </div>
            </div>

            {agentStats.length > 0 && (
            <div className="m-dash-section">
                <h3><Award size={16} color="#F59E0B" style={{marginRight:'6px'}}/> Top Performers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {agentStats.filter(a => a.totalClosed > 0).map((agent, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: idx === 0 ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : idx === 1 ? 'linear-gradient(135deg,#94A3B8,#64748B)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: idx < 2 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                                {idx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: '13px', display: 'block' }}>{agent.name}</strong>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{agent.totalClosed} cierres · Promedio ${agent.avgPrice >= 1000000 ? (agent.avgPrice / 1000000).toFixed(2) + 'M' : (agent.avgPrice / 1000).toFixed(0) + 'K'}</span>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <strong style={{ fontSize: '14px', color: '#10B981', display: 'block' }}>${agent.totalVolume >= 1000000 ? (agent.totalVolume / 1000000).toFixed(2) + 'M' : (agent.totalVolume / 1000).toFixed(0) + 'K'}</strong>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>volumen</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {(offMarketListings || []).length > 0 && (
            <div className="m-dash-section">
                <h3>⭐ Propiedades Exclusivas</h3>
                <div className="m-alerts-list">
                    {(offMarketListings || []).slice(0, 5).map((prop, idx) => (
                        <div className="m-alert" key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.15)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img src={prop.image} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <strong style={{ fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.address}</strong>
                                <span style={{ fontSize: '12px', color: '#FFD700', fontWeight: 'bold' }}>${prop.price?.toLocaleString()} — {prop.description?.match(/\[([^\]]+)\]/)?.[1] || 'Exclusiva'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{prop.listAgentName} · {prop.beds}bd / {prop.baths}ba</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

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
