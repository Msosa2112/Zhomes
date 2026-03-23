import { Trophy, Star, TrendingUp } from 'lucide-react'
import './TeamPageMobile.css'

const AGENTS = [
    { name: 'Jessica Hernandez', deals: 94, vol: '$18.2M', rank: 1, avatar: '/assets/agents/Jessica Hernandez.png' },
    { name: 'Judith Gonzalez', deals: 76, vol: '$14.1M', rank: 2, avatar: '/assets/agents/Judith Gonzalez.png' },
    { name: 'Miriam Castaño', deals: 68, vol: '$12.5M', rank: 3, avatar: '/assets/agents/Miriam Castano.png' },
    { name: 'Yusleidy Perez', deals: 45, vol: '$8.2M', rank: 4, avatar: '/assets/agents/Yusleidy Perez.png' },
]

export default function TeamPageMobile() {
    return (
        <div className="m-team-page">
            <div className="m-team-header">
                <h1>Rendimiento de Equipo</h1>
            </div>

            <div className="m-podium-section">
                <div className="m-podium-card">
                    <Trophy size={40} color="#F59E0B" className="m-trophy" />
                    <img src={AGENTS[0].avatar} alt="" className="m-pod-img" />
                    <h2>{AGENTS[0].name}</h2>
                    <span>{AGENTS[0].vol} · {AGENTS[0].deals} cierres</span>
                </div>
            </div>

            <div className="m-team-list">
                <h3>Ranking</h3>
                {AGENTS.slice(1).map(a => (
                    <div key={a.rank} className="m-agent-row">
                        <span className="m-rank">#{a.rank}</span>
                        <img src={a.avatar} alt="" />
                        <div className="m-ainfo">
                            <strong>{a.name}</strong>
                            <span>{a.deals} cierres</span>
                        </div>
                        <div className="m-avol">{a.vol}</div>
                    </div>
                ))}
            </div>
            <div style={{ height: '90px' }} />
        </div>
    )
}
