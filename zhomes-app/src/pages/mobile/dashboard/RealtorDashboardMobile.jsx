import { Brain, TrendingUp, DollarSign, Clock, FileText, CheckCircle2, AlertCircle, Upload, Flame, Target, Trophy, Star, LogOut } from 'lucide-react'
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
        <div className="mobile-dash-page">
            <div className="mobile-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Hola, {userName} 👋</h2>
                    <p>Aquí tienes tu Centro de Mando en vivo.</p>
                </div>
                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--zhomes-red)' }}>
                    <LogOut size={20} />
                </button>
            </div>

            <div className="mobile-quick-actions">
                <Link to="/realtor/comisiones" className="m-quick-btn">
                    <div className="mq-icon"><DollarSign size={24} /></div>
                    <span>Comis</span>
                </Link>
                <Link to="/realtor/crear-propiedad" className="m-quick-btn">
                    <div className="mq-icon"><FileText size={24} /></div>
                    <span>Nueva</span>
                </Link>
                <Link to="/realtor/perfil" className="m-quick-btn">
                    <div className="mq-icon"><Star size={24} /></div>
                    <span>Perfil</span>
                </Link>
            </div>

            <div className="m-ai-widget">
                <div className="mai-head"><Brain size={18} /> ZhomesAI</div>
                <p>He analizado tu base de datos en Supabase. Tienes <strong>{activeTransactions}</strong> tratos activos. ¡Buen trabajo liderando la zona!</p>
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
    )
}
