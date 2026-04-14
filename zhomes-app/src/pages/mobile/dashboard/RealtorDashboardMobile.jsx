import ZLoader from '../../../components/shared/ZLoader'
import {
    Brain, TrendingUp, DollarSign, Clock, FileText, CheckCircle2,
    AlertCircle, Upload, Flame, Trophy, Star, LogOut, Activity,
    X, Calendar, Users, MapPin, Building2, Award, LineChart,
    PenTool, Briefcase, Bell, ChevronRight, Loader2
} from 'lucide-react'
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

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) setUser(session.user)
            setLoading(false)
        }
        fetchDashboardData()
    }, [])

    if (loading && propsLoading) return <ZLoader message="Cargando..." />

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agente'
    const activeListings   = zhomesListings.length
    const totalAgents      = zhomesAgents.length
    const totalMlsProps    = properties.length
    const totalClosedDeals = agentStats.reduce((s, a) => s + a.totalClosed, 0)
    const totalVolume      = agentStats.reduce((s, a) => s + a.totalVolume, 0)
    const totalOffMarket   = (offMarketListings || []).length
    const xpPct = Math.round(((XP.current - XP.prevAt) / (XP.nextAt - XP.prevAt)) * 100)

    const ALERTS = [
        { type: 'error',   Icon: AlertCircle,  text: 'Faltan 3 documentos para 8708 Denise Dr', time: 'Hace 2 horas' },
        { type: 'success', Icon: CheckCircle2, text: 'Oferta aceptada para 8708 Denise Dr',      time: 'Hace 1 día' },
    ]

    // ── Quick Actions — iconos como protagonistas ──────────────────────────────
    const QUICK = [
        { to: '/realtor/citas',          Icon: Calendar,   label: 'Citas' },
        { to: '/realtor/leads',          Icon: Users,      label: 'Leads' },
        { to: '/realtor/tareas',         Icon: CheckCircle2, label: 'Tareas' },
        { to: '/realtor/open-houses',    Icon: MapPin,     label: 'Open House' },
        { to: '/realtor/crear-propiedad',Icon: Upload,     label: 'Nueva Prop.' },
        { to: '/realtor/deal',           Icon: Briefcase,  label: 'Deal Room' },
        { to: '/realtor/firmas',         Icon: PenTool,    label: 'Firmas' },
        { to: '/cma',                    Icon: LineChart,  label: 'CMA' },
    ]

    return (
        <>
        <div className="mobile-dash-page">

            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="mobile-dash-header">
                <div>
                    <h2>Hola, {userName}</h2>
                    <p>Centro de Mando en vivo.</p>
                </div>
            </div>

            {/* ── QUICK ACTIONS — icono + label, paleta neutra ───── */}
            <div className="rdb-quick-grid">
                {QUICK.map(({ to, Icon, label }) => (
                    <Link key={to} to={to} className="rdb-quick-btn">
                        <div className="rdb-quick-icon">
                            <Icon size={22} />
                        </div>
                        <span>{label}</span>
                    </Link>
                ))}
            </div>

            {/* ── KPIs ───────────────────────────────────────────── */}
            <div className="m-kpi-scroller">
                <div className="mk-card">
                    <FileText size={20} />
                    <span>Activas</span>
                    <strong>{activeListings}</strong>
                </div>
                <div className="mk-card">
                    <Trophy size={20} />
                    <span>Cierres</span>
                    <strong>{totalClosedDeals}</strong>
                </div>
                <div className="mk-card">
                    <DollarSign size={20} />
                    <span>Volumen</span>
                    <strong>${totalVolume >= 1000000 ? (totalVolume / 1000000).toFixed(1) + 'M' : (totalVolume / 1000).toFixed(0) + 'K'}</strong>
                </div>
                <div className="mk-card">
                    <Users size={20} />
                    <span>Agentes</span>
                    <strong>{totalAgents}</strong>
                </div>
                <div className="mk-card">
                    <Building2 size={20} />
                    <span>Exclusivas</span>
                    <strong>{totalOffMarket}</strong>
                </div>
            </div>

            {/* ── PROGRESO ───────────────────────────────────────── */}
            <div className="m-dash-section">
                <h3><Flame size={16} style={{ marginRight: 6 }} />Mi Progreso</h3>
                <div className="m-xp-row">
                    <div className="m-xp-badge">{XP.level}</div>
                    <div className="m-xp-info">
                        <strong>Nivel {XP.level} — {XP.levelName}</strong>
                        <div className="m-xp-bar-container">
                            <div className="m-xp-fill" style={{ width: `${xpPct}%` }} />
                        </div>
                        <span>Faltan {XP.nextAt - XP.current} XP para el nivel {XP.level + 1}</span>
                    </div>
                </div>
            </div>

            {/* ── PROPIEDADES ZHOMES ──────────────────────────────── */}
            <div className="m-dash-section">
                <h3><Building2 size={16} style={{ marginRight: 6 }} />Propiedades ZHomes</h3>
                <div className="m-alerts-list">
                    {zhomesListings.map((prop, idx) => (
                        <div className="m-alert" key={idx}>
                            <img src={prop.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <strong style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.address}</strong>
                                <span style={{ fontSize: 12, color: 'var(--zhomes-red)', fontWeight: 700 }}>${prop.price?.toLocaleString()}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{prop.beds}bd / {prop.baths}ba / {prop.sqft?.toLocaleString()} sqft</span>
                            </div>
                        </div>
                    ))}
                    {zhomesListings.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No hay listados activos.</p>}
                </div>
            </div>

            {/* ── TOP PERFORMERS ──────────────────────────────────── */}
            {agentStats.filter(a => a.totalClosed > 0).length > 0 && (
            <div className="m-dash-section">
                <h3><Award size={16} style={{ marginRight: 6 }} />Top Performers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {agentStats.filter(a => a.totalClosed > 0).map((agent, idx) => (
                        <div key={idx} className="rdb-performer-row">
                            <div className={`rdb-rank ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : ''}`}>{idx + 1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: 13, display: 'block' }}>{agent.name}</strong>
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{agent.totalClosed} cierres · Promedio ${agent.avgPrice >= 1000000 ? (agent.avgPrice / 1000000).toFixed(2) + 'M' : (agent.avgPrice / 1000).toFixed(0) + 'K'}</span>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <strong style={{ fontSize: 14, color: 'var(--zhomes-red)', display: 'block' }}>${agent.totalVolume >= 1000000 ? (agent.totalVolume / 1000000).toFixed(2) + 'M' : (agent.totalVolume / 1000).toFixed(0) + 'K'}</strong>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>volumen</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* ── ALERTAS ──────────────────────────────────────────── */}
            <div className="m-dash-section" style={{ marginBottom: 30 }}>
                <h3>Alertas <span className="m-badge-red">{ALERTS.length}</span></h3>
                <div className="m-alerts-list">
                    {ALERTS.map((al, idx) => (
                        <div className="m-alert" key={idx}>
                            <al.Icon
                                size={16}
                                color={al.type === 'error' ? 'var(--zhomes-red)' : '#10B981'}
                                style={{ flexShrink: 0 }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <p>{al.text}</p>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{al.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
        </>
    )
}
