import { useState } from 'react'
import {
    Star, Home, Clock, Award, Trophy, TrendingUp, TrendingDown,
    Flame, Target, FileCheck, ChevronUp, ChevronDown, Zap, Medal,
    Crown
} from 'lucide-react'
import './TeamPage.css'

const TEAM = [
    {
        id: 3, name: 'Miriam C Castaño', photo: '/assets/agents/Miriam Castano.png',
        title: 'Top Producer · Asesora Senior', sales: 94, volume: 12500000, closingSpeed: 28,
        compliance: 98, rank: 1, prevRank: 1, topProducer: true,
        streak: 5, monthSales: 8, monthVolume: 1800000,
        badges: ['top_producer', 'fastest_closer', 'streak_5'],
        goal: { target: 10, current: 8, label: 'Cierres del Mes' },
    },
    {
        id: 4, name: 'Yusleidy Perez', photo: '/assets/agents/Yusleidy Perez.png',
        title: 'Relocation Specialist', sales: 41, volume: 5100000, closingSpeed: 30,
        compliance: 92, rank: 2, prevRank: 3, topProducer: false,
        streak: 2, monthSales: 3, monthVolume: 620000,
        badges: ['streak_3', 'doc_master'],
        goal: { target: 5, current: 3, label: 'Cierres del Mes' },
    },
    {
        id: 1, name: 'Jessica Hernandez', photo: '/assets/agents/Jessica Hernandez.png',
        title: 'Asesora Residencial', sales: 28, volume: 3200000, closingSpeed: 35,
        compliance: 88, rank: 3, prevRank: 2, topProducer: false,
        streak: 0, monthSales: 4, monthVolume: 890000,
        badges: ['rising_star'],
        goal: { target: 6, current: 4, label: 'Cierres del Mes' },
    },
    {
        id: 2, name: 'Judith Gonzalez', photo: '/assets/agents/Judith Gonzalez.png',
        title: 'Asesora Residencial', sales: 12, volume: 1800000, closingSpeed: 38,
        compliance: 95, rank: 4, prevRank: 5, topProducer: false,
        streak: 3, monthSales: 2, monthVolume: 420000,
        badges: ['rising_star'],
        goal: { target: 4, current: 2, label: 'Cierres del Mes' },
    },
]

const BADGES_MAP = {
    top_producer: { label: 'Top Producer', icon: Crown, color: '#F5A623' },
    fastest_closer: { label: 'Fastest Closer', icon: Zap, color: 'var(--text-secondary)' },
    doc_master: { label: 'Doc Master', icon: FileCheck, color: '#10B981' },
    streak_5: { label: 'Racha x5', icon: Flame, color: 'var(--zhomes-red)' },
    streak_3: { label: 'Racha x3', icon: Flame, color: '#F97316' },
    rising_star: { label: 'Rising Star', icon: Star, color: 'var(--text-secondary)' },
    goal_crusher: { label: 'Goal Crusher', icon: Target, color: 'var(--text-secondary)' },
}

const PERIOD_OPTIONS = ['Este Mes', 'Este Trimestre', 'Este Año']

export default function TeamPage() {
    const [period, setPeriod] = useState('Este Mes')
    const [view, setView] = useState('ranking') // ranking | cards

    const getRankChange = (r) => {
        const diff = r.prevRank - r.rank
        if (diff > 0) return { icon: ChevronUp, label: `+${diff}`, color: '#10B981' }
        if (diff < 0) return { icon: ChevronDown, label: `${diff}`, color: 'var(--zhomes-red)' }
        return { icon: null, label: '—', color: '#9CA3AF' }
    }

    return (
        <div className="team-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Centro del Equipo</h1>
                    <p className="page-subtitle">Rendimiento, ranking y logros de tu equipo</p>
                </div>
                <div className="team-controls">
                    <div className="team-period-tabs">
                        {PERIOD_OPTIONS.map(p => (
                            <button
                                key={p}
                                className={`period-tab ${period === p ? 'active' : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ---- Podium (Top 3) ---- */}
            <div className="leaderboard animate-fadeInUp">
                <div className="leaderboard-header">
                    <Trophy size={20} />
                    <h2>Ranking del Mes</h2>
                </div>
                <div className="podium">
                    {/* #2 left */}
                    <div className="podium-spot spot-2">
                        <div className="podium-avatar silver-ring">
                            <img src={TEAM[1].photo} alt={TEAM[1].name} />
                            <span className="podium-rank">#2</span>
                        </div>
                        <h3>{TEAM[1].name}</h3>
                        <span className="podium-title">{TEAM[1].title}</span>
                        <span className="podium-volume">${(TEAM[1].monthVolume / 1000000).toFixed(1)}M</span>
                        <span className="podium-sales">{TEAM[1].monthSales} cierres</span>
                        {TEAM[1].streak > 0 && (
                            <span className="podium-streak"><Flame size={12} /> {TEAM[1].streak} racha</span>
                        )}
                    </div>
                    {/* #1 center */}
                    <div className="podium-spot spot-1">
                        <div className="podium-crown"><Crown size={24} /></div>
                        <div className="podium-avatar gold-ring">
                            <img src={TEAM[0].photo} alt={TEAM[0].name} />
                            <span className="podium-rank">#1</span>
                        </div>
                        <h3>{TEAM[0].name}</h3>
                        <span className="podium-title">{TEAM[0].title}</span>
                        <span className="podium-volume">${(TEAM[0].monthVolume / 1000000).toFixed(1)}M</span>
                        <span className="podium-sales">{TEAM[0].monthSales} cierres</span>
                        {TEAM[0].streak > 0 && (
                            <span className="podium-streak"><Flame size={12} /> {TEAM[0].streak} racha</span>
                        )}
                    </div>
                    {/* #3 right */}
                    <div className="podium-spot spot-3">
                        <div className="podium-avatar bronze-ring">
                            <img src={TEAM[2].photo} alt={TEAM[2].name} />
                            <span className="podium-rank">#3</span>
                        </div>
                        <h3>{TEAM[2].name}</h3>
                        <span className="podium-title">{TEAM[2].title}</span>
                        <span className="podium-volume">${(TEAM[2].monthVolume / 1000000).toFixed(1)}M</span>
                        <span className="podium-sales">{TEAM[2].monthSales} cierres</span>
                    </div>
                </div>
            </div>

            {/* ---- Full ranking table ---- */}
            <div className="ranking-table-wrap animate-fadeInUp delay-1">
                <div className="ranking-table-header">
                    <Medal size={18} />
                    <h2>Tabla Completa</h2>
                </div>
                <table className="ranking-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Agente</th>
                            <th>Cierres</th>
                            <th>Volumen</th>
                            <th>Vel. Cierre</th>
                            <th>Compliance</th>
                            <th>Racha</th>
                            <th>Badges</th>
                            <th>Meta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TEAM.map((r, i) => {
                            const change = getRankChange(r)
                            const goalPct = Math.round((r.goal.current / r.goal.target) * 100)
                            return (
                                <tr key={r.id} className={`ranking-row ${i === 0 ? 'first' : ''}`}>
                                    <td className="rank-cell">
                                        <span className={`rank-num rank-${r.rank}`}>{r.rank}</span>
                                        <span className="rank-change" style={{ color: change.color }}>
                                            {change.icon && <change.icon size={14} />}
                                            {change.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="rank-agent">
                                            <img src={r.photo} alt="" className="rank-avatar" />
                                            <div>
                                                <span className="rank-name">{r.name}</span>
                                                <span className="rank-title">{r.title}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="rank-metric bold">{r.monthSales}</td>
                                    <td className="rank-metric">${(r.monthVolume / 1000).toFixed(0)}K</td>
                                    <td className="rank-metric">{r.closingSpeed} días</td>
                                    <td>
                                        <div className="rank-compliance">
                                            <div className="rank-comp-track">
                                                <div className="rank-comp-fill" style={{
                                                    width: `${r.compliance}%`,
                                                    background: r.compliance >= 90 ? '#10B981' : r.compliance >= 80 ? '#F59E0B' : '#EF4444'
                                                }}></div>
                                            </div>
                                            <span>{r.compliance}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {r.streak > 0 ? (
                                            <span className="rank-streak">
                                                <Flame size={14} />
                                                {r.streak}
                                            </span>
                                        ) : (
                                            <span className="rank-no-streak">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="rank-badges">
                                            {r.badges.slice(0, 3).map((b, bi) => {
                                                const badge = BADGES_MAP[b]
                                                if (!badge) return null
                                                return (
                                                    <span key={bi} className="rank-badge" style={{ color: badge.color, background: `${badge.color}12`, borderColor: `${badge.color}30` }} title={badge.label}>
                                                        <badge.icon size={12} />
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="rank-goal">
                                            <div className="rank-goal-track">
                                                <div className="rank-goal-fill" style={{
                                                    width: `${goalPct}%`,
                                                    background: goalPct >= 100 ? '#10B981' : goalPct >= 50 ? '#3B82F6' : '#F59E0B'
                                                }}></div>
                                            </div>
                                            <span>{r.goal.current}/{r.goal.target}</span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* ---- Badges Legend ---- */}
            <div className="badges-legend animate-fadeInUp delay-2">
                <h3>Badges Disponibles</h3>
                <div className="badges-grid">
                    {Object.entries(BADGES_MAP).map(([key, badge]) => (
                        <div key={key} className="badge-card" style={{ borderColor: `${badge.color}30` }}>
                            <div className="badge-icon-wrap" style={{ background: `${badge.color}12`, color: badge.color }}>
                                <badge.icon size={20} />
                            </div>
                            <span className="badge-label">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
