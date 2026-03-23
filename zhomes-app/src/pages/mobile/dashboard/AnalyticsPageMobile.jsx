import { TrendingUp, ArrowUpRight, DollarSign, Target, Activity } from 'lucide-react'
import './AnalyticsPageMobile.css'

export default function AnalyticsPageMobile() {
    return (
        <div className="mobile-analytics-page">
            <div className="mobile-analytics-header">
                <h1>Analytics</h1>
                <p>Inteligencia de negocio en tiempo real</p>
                <div className="mobile-analytics-tabs">
                    <button className="active">Mes</button>
                    <button>Trimestre</button>
                    <button>Año</button>
                </div>
            </div>

            <div className="mobile-analytics-grid">
                <div className="mobile-card-kpi span-full highlight">
                    <span className="kpi-label">Revenue Total</span>
                    <span className="kpi-value">$1.2M</span>
                    <span className="kpi-trend pos"><ArrowUpRight size={14} /> +18% este mes</span>
                </div>

                <div className="mobile-card-kpi">
                    <Activity size={20} className="kpi-icon blue" />
                    <span className="kpi-label">Velocidad Cierre</span>
                    <span className="kpi-value">28 días</span>
                </div>

                <div className="mobile-card-kpi">
                    <Target size={20} className="kpi-icon green" />
                    <span className="kpi-label">Win Rate</span>
                    <span className="kpi-value">64%</span>
                </div>
            </div>

            <div className="mobile-analytics-section">
                <h2>Rendimiento Agentes</h2>
                <div className="mobile-agent-perf-list">
                    <div className="mobile-agent-perf-row">
                        <div className="map-agent">
                            <img src="/assets/agents/Jessica Hernandez.png" alt="" />
                            <div><strong>Jessica H.</strong><span>Top Producer</span></div>
                        </div>
                        <div className="map-score">
                            <span className="score max">93</span>
                        </div>
                    </div>
                    <div className="mobile-agent-perf-row">
                        <div className="map-agent">
                            <img src="/assets/agents/Judith Gonzalez.png" alt="" />
                            <div><strong>Judith G.</strong><span>Senior Agent</span></div>
                        </div>
                        <div className="map-score">
                            <span className="score high">81</span>
                        </div>
                    </div>
                    <div className="mobile-agent-perf-row">
                        <div className="map-agent">
                            <img src="/assets/agents/Miriam Castano.png" alt="" />
                            <div><strong>Miriam C.</strong><span>Res. Specialist</span></div>
                        </div>
                        <div className="map-score">
                            <span className="score high">80</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mobile-analytics-section" style={{ marginBottom: '90px' }}>
                <h2>Zonas Calientes</h2>
                <div className="mobile-zones-list">
                    <div className="m-zone-row"><span className="zone-name">St. Matthews</span><span className="zone-vol">$1.8M</span></div>
                    <div className="m-zone-row"><span className="zone-name">Prospect</span><span className="zone-vol">$2.1M</span></div>
                    <div className="m-zone-row"><span className="zone-name">Anchorage</span><span className="zone-vol">$1.2M</span></div>
                </div>
            </div>
        </div>
    )
}
