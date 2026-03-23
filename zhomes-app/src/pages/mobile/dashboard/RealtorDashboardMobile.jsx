import { Brain, TrendingUp, DollarSign, Clock, FileText, CheckCircle2, AlertCircle, Upload, Flame, Target, Trophy, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { REALTORS, REALTOR_TRANSACTIONS, REALTOR_COMMISSIONS } from '../../../data/mockData'
import './RealtorDashboardMobile.css'

const CHALLENGES = [
    { emoji: '📄', name: 'Upload Master', desc: 'Sube 5 documentos esta semana', current: 3, total: 5, xp: 150, color: '#3B82F6' },
    { emoji: '💬', name: 'Comunicador', desc: 'Responde 10 mensajes del broker', current: 7, total: 10, xp: 100, color: '#8B5CF6' },
]

const XP = { current: 2450, level: 7, levelName: 'Rising Star', nextAt: 3000, prevAt: 2000 }
const STREAK = 12

export default function RealtorDashboardMobile() {
    const realtor = REALTORS[0]
    const activeTransactions = REALTOR_TRANSACTIONS.filter(t => t.status !== 'closed')
    const pendingDocs = REALTOR_TRANSACTIONS.reduce((acc, t) => acc + t.documents.filter(d => d.status === 'pending').length, 0)
    const totalEarned = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.netAmount, 0)
    
    const xpPct = Math.round(((XP.current - XP.prevAt) / (XP.nextAt - XP.prevAt)) * 100)

    const ALERTS = [
        { type: 'warning', icon: AlertCircle, text: 'Faltan 3 documentos para 8708 Denise Dr', time: 'Hace 2 horas', color: '#EF4444' },
        { type: 'success', icon: CheckCircle2, text: 'Comisión de $8,925 aprobada para 8708...', time: 'Hace 1 día', color: '#10B981' },
    ]

    return (
        <div className="mobile-dash-page">
            <div className="mobile-dash-header">
                <h2>Hola, {realtor.name.split(' ')[0]} 👋</h2>
                <p>Aquí tienes el estado de tu actividad.</p>
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
                <p>Tu performance está en el <strong style={{color: '#10B981'}}>Top 5%</strong> del equipo. ¡Sigue cerrando contratos para llegar al nivel 8!</p>
            </div>

            <div className="m-kpi-scroller">
                <div className="mk-card">
                    <FileText size={20} className="kblue" />
                    <span>Activas</span>
                    <strong>{activeTransactions.length}</strong>
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

                <div className="m-streak-row">
                    <div className="m-streak-icon">🔥</div>
                    <div className="m-streak-data">
                        <strong>{STREAK} Días seguidos</strong>
                        <span>Racha de conexión</span>
                    </div>
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Desafíos de la Semana</h3>
                <div className="m-challenges-list">
                    {CHALLENGES.map((ch, idx) => (
                        <div className="m-challenge-item" key={idx}>
                            <div className="m-challenge-icon" style={{background: `${ch.color}15`, color: ch.color}}>{ch.emoji}</div>
                            <div className="m-challenge-text">
                                <strong>{ch.name} <span style={{color: ch.color, fontSize: '10px', float: 'right'}}>+{ch.xp} XP</span></strong>
                                <div className="pbar" style={{marginTop: '4px', marginBottom: '4px'}}>
                                    <div style={{ width: `${(ch.current/ch.total)*100}%`, background: ch.color }}></div>
                                </div>
                                <span className="m-challenge-desc">{ch.current}/{ch.total} - {ch.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Alertas <span className="m-badge-red">2</span></h3>
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
