import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { ShieldAlert, Map, Zap } from 'lucide-react'
import './BrokerTerminal.css'

const RISK_DATA = [
    { axis: 'Financiamiento', score: 85, fullMark: 100 },
    { axis: 'Timing', score: 60, fullMark: 100 },
    { axis: 'Inspección', score: 90, fullMark: 100 },
    { axis: 'Compliance', score: 95, fullMark: 100 },
    { axis: 'Escrow', score: 80, fullMark: 100 },
]

function AIIntelWidget() {
    return (
        <div className="bt-widget bt-ai-radar glass-card h-full flex flex-col">
            <div className="bt-widget-header">
                <ShieldAlert size={18} className="text-red" />
                <h3 className="m-0">AI Risk Radar</h3>
            </div>
            <p className="bt-widget-sub">Análisis predictivo de caídas de contrato.</p>

            <div className="bt-radar-container flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RISK_DATA}>
                        <PolarGrid stroke="var(--border-subtle)" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Risk Level" dataKey="score" stroke="#E31E24" strokeWidth={2} fill="#E31E24" fillOpacity={0.2} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

function HeatMapPlaceholder() {
    return (
        <div className="bt-widget bt-heatmap glass-card h-full flex flex-col group relative overflow-hidden">
            {/* Fake Leaflet Map Background directly using CSS instead of Tailwind classes */}
            <div className="bt-map-bg absolute inset-0 flex items-center justify-center opacity-60">
                <div className="bt-map-gradient absolute w-full h-full" />
                <Map size={64} className="bt-map-icon" />
            </div>

            <div className="relative z-10 flex items-center justify-between mb-2 mt-auto">
                <h3 className="m-0 text-shadow">Live Hot Zones</h3>
                <span className="bt-pulse-dot"></span>
            </div>
            <p className="relative z-10 text-xs text-secondary max-w-200 m-0 text-shadow">Zonas con mayor demanda de Open Houses hoy.</p>
        </div>
    )
}

export default function BrokerTerminal() {
    return (
        <div className="broker-terminal-page">
            <header className="bt-header mb-8">
                <div>
                    <h1 className="bt-title">
                        ZHOMES <span className="bt-title-accent">Terminal</span>
                    </h1>
                    <p className="bt-subtitle">Operativa Global · Modo Vista de Pájaro</p>
                </div>
            </header>

            {/* Bento Grid layout defined strictly in CSS to maintain parity with vanilla CSS architecture */}
            <div className="bt-bento-grid">

                {/* KPI Principal */}
                <div className="bt-widget bt-kpi-main glass-card flex flex-col justify-center relative overflow-hidden">
                    <Zap className="bt-kpi-bg-icon absolute -bottom-6 -right-6 rotate-12" />
                    <span className="bt-kpi-label uppercase">Pipeline Activo</span>
                    <div className="bt-kpi-value">$14.2M</div>
                    <div className="bt-kpi-trend">
                        ▲ +2.4% vs Mes Anterior
                    </div>
                </div>

                {/* Radar Chart Inteligente */}
                <div className="bt-ai-radar-cell">
                    <AIIntelWidget />
                </div>

                {/* Dato Menor */}
                <div className="bt-widget bt-kpi-minor glass-card flex flex-col justify-between">
                    <span className="bt-kpi-label uppercase">Conversión</span>
                    <div>
                        <div className="bt-kpi-minor-val">4.8%</div>
                        <p className="bt-kpi-sub">Leads a Cierre</p>
                    </div>
                </div>

                {/* Heatmap */}
                <div className="bt-heatmap-cell">
                    <HeatMapPlaceholder />
                </div>

            </div>
        </div>
    )
}
