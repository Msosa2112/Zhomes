import { FileText, DollarSign, Clock, TrendingUp, ArrowUpRight, CheckCircle2, AlertCircle, Upload, Flame, Trophy, Star, Target } from 'lucide-react'
import StackedAlerts from '../../components/shared/StackedAlerts'
import { Link } from 'react-router-dom'
import TransactionTimeline from '../../components/shared/TransactionTimeline'
import AIInsightsWidget from '../../components/dashboard/AIInsightsWidget'
import { REALTORS, REALTOR_TRANSACTIONS } from '../../data/mockData'
import '../dashboard/DashboardPage.css'
import './RealtorDashboard.css'

const CHALLENGES = [
    { emoji: '', name: 'Upload Master', desc: 'Sube 5 documentos esta semana', current: 3, total: 5, xp: 150, color: 'var(--text-secondary)' },
    { emoji: '', name: 'Comunicador', desc: 'Responde 10 mensajes del broker', current: 7, total: 10, xp: 100, color: 'var(--text-secondary)' },
    { emoji: '', name: 'Cerrador', desc: 'Cierra 1 transacción', current: 0, total: 1, xp: 500, color: '#10B981' },
    { emoji: '', name: 'Speed Demon', desc: 'Sube un doc en menos de 24h', current: 1, total: 1, xp: 75, color: 'var(--text-secondary)' },
]

const BADGES = [
    { emoji: '', name: 'First Deal', unlocked: true },
    { emoji: '', name: 'Doc Pro', unlocked: true },
    { emoji: '', name: '$50K Club', unlocked: true },
    { emoji: '', name: '7-Day Streak', unlocked: true },
    { emoji: '', name: 'Top Agent', unlocked: false },
    { emoji: '', name: '$100K Club', unlocked: false },
    { emoji: '', name: 'Perfect Month', unlocked: false },
    { emoji: '', name: '10 Deals', unlocked: false },
]

const XP = { current: 2450, level: 7, levelName: 'Rising Star', nextAt: 3000, prevAt: 2000 }
const STREAK = 12
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function RealtorDashboard() {
    const realtor = REALTORS[0]
    const activeTransactions = REALTOR_TRANSACTIONS.filter(t => t.status !== 'closed')
    const pendingDocs = REALTOR_TRANSACTIONS.reduce((acc, t) => acc + t.documents.filter(d => d.status === 'pending').length, 0)
    const totalVolume = REALTOR_TRANSACTIONS.reduce((acc, t) => acc + t.price, 0)

    const ALERTS = [
        { type: 'warning', icon: AlertCircle, text: 'Faltan 3 documentos para 8708 Denise Dr — sube la Tasación', time: 'Hace 2 horas' },
        { type: 'success', icon: CheckCircle2, text: 'Oferta aceptada para 8708 Denise Dr', time: 'Hace 1 día' },
        { type: 'info', icon: Upload, text: 'Broker revisó tus docs para 220 River Rd', time: 'Hace 2 días' },
    ]

    const xpPct = Math.round(((XP.current - XP.prevAt) / (XP.nextAt - XP.prevAt)) * 100)

    return (
        <div className="realtor-dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hola, {realtor.name.split(' ')[0]} </h1>
                    <p className="page-subtitle">Aquí está el resumen de tu actividad.</p>
                </div>
            </div>

            {/* AI Insights Widget */}
            <div className="mb-6 animate-fadeInUp">
                <AIInsightsWidget />
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card animate-fadeInUp">
                    <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--text-secondary)' }}>
                        <FileText size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">{activeTransactions.length}</span>
                        <span className="kpi-label">Transacciones Activas</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +1</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-1">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--text-secondary)' }}>
                        <Clock size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">{pendingDocs}</span>
                        <span className="kpi-label">Docs Pendientes</span>
                    </div>
                    <span className="kpi-trend down">Urgente</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-2">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">${(totalEarned / 1000).toFixed(1)}K</span>
                        <span className="kpi-label">Ganado Este Año</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +18%</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-3">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 166, 35, 0.12)', color: '#F5A623' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">${(totalVolume / 1000000).toFixed(1)}M</span>
                        <span className="kpi-label">Volumen Total</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +12%</span>
                </div>
            </div>

            {/* Engagement Engine */}
            <div className="engagement-section">
                <div className="engagement-header">
                    <h2><Flame size={20} /> Mi Progreso</h2>
                </div>

                {/* XP Card */}
                <div className="xp-card animate-fadeInUp">
                    <div className="xp-level-badge">{XP.level}</div>
                    <div className="xp-info">
                        <span className="xp-level-name">Nivel {XP.level} — {XP.levelName}</span>
                        <span className="xp-progress-label">{XP.current - XP.prevAt} / {XP.nextAt - XP.prevAt} XP para Nivel {XP.level + 1}</span>
                        <div className="xp-bar">
                            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }}></div>
                        </div>
                    </div>
                    <div className="xp-stats">
                        <span className="xp-total">{XP.current.toLocaleString()}</span>
                        <span className="xp-total-label">XP Total</span>
                    </div>
                </div>

                {/* Challenges + Streak/Badges Grid */}
                <div className="engagement-grid">
                    {/* Weekly Challenges */}
                    <div className="challenges-card animate-fadeInUp">
                        <h3><Target size={16} /> Desafíos de la Semana</h3>
                        <div className="challenge-list">
                            {CHALLENGES.map((ch, i) => (
                                <div key={i} className="challenge-item">
                                    <div className="challenge-icon" style={{ background: `${ch.color}15` }}>{ch.emoji}</div>
                                    <div className="challenge-info">
                                        <span className="challenge-name">{ch.name}</span>
                                        <span className="challenge-progress-text">{ch.current}/{ch.total} — {ch.desc}</span>
                                        <div className="challenge-bar">
                                            <div className="challenge-bar-fill" style={{ width: `${(ch.current / ch.total) * 100}%`, background: ch.color }}></div>
                                        </div>
                                    </div>
                                    <span className="challenge-xp">+{ch.xp} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Streak + Badges */}
                    <div className="streak-badges-card animate-fadeInUp">
                        <div className="streak-block">
                            <span className="streak-fire"></span>
                            <div className="streak-info">
                                <span className="streak-count">{STREAK} días</span>
                                <span className="streak-label">Racha activa</span>
                            </div>
                            <div className="streak-days">
                                {WEEK_DAYS.map((d, i) => (
                                    <span key={i} className={`streak-day ${i < 5 ? 'active' : 'empty'}`}>{d}</span>
                                ))}
                            </div>
                        </div>
                        <div className="badges-block">
                            <h3><Trophy size={16} /> Logros</h3>
                            <div className="badges-grid">
                                {BADGES.map((b, i) => (
                                    <div key={i} className={`badge-item ${b.unlocked ? '' : 'locked'}`} title={b.name}>
                                        <span className="badge-emoji">{b.emoji}</span>
                                        <span className="badge-name">{b.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Transactions Mini */}
            <div className="rd-section">
                <div className="section-bar">
                    <h2>Mis Transacciones</h2>
                    <Link to="/realtor/transacciones" className="btn btn-ghost">Ver Todas</Link>
                </div>
                <div className="rd-transactions-grid">
                    {REALTOR_TRANSACTIONS.slice(0, 4).map(t => (
                        <div key={t.id} className="rd-transaction-card animate-fadeInUp">
                            <img src={t.image} alt="" className="rd-tx-image" />
                            <div className="rd-tx-info">
                                <h4>{t.address}</h4>
                                <span className="rd-tx-city">{t.city}</span>
                                <span className="rd-tx-price">${t.price.toLocaleString()}</span>
                            </div>
                            <div className="rd-tx-meta">
                                <span className="rd-tx-status" style={{ color: t.statusColor, background: `${t.statusColor}15` }}>
                                    {t.statusLabel}
                                </span>
                                <span className="rd-tx-docs">
                                    {t.documents.filter(d => d.status === 'approved').length}/{t.documents.length} docs
                                </span>
                            </div>
                            <TransactionTimeline status={t.status} variant="compact" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <div className="rd-section">
                <div className="section-bar">
                    <h2>Alertas Recientes</h2>
                </div>
                <StackedAlerts
                    alerts={ALERTS}
                    title="Alertas"
                />
            </div>
        </div>
    )
}
