import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Clock, FileText, Users, MapPin } from 'lucide-react'
import './AnalyticsPage.css'

/* ==========================================
   MOCK DATA — Analytics
   ========================================== */
const MONTHLY_REVENUE = [
    { month: 'Jul', value: 420000, deals: 3 },
    { month: 'Ago', value: 380000, deals: 2 },
    { month: 'Sep', value: 510000, deals: 4 },
    { month: 'Oct', value: 899000, deals: 5 },
    { month: 'Nov', value: 770000, deals: 4 },
    { month: 'Dic', value: 625000, deals: 3 },
    { month: 'Ene', value: 714000, deals: 4 },
    { month: 'Feb', value: 1200000, deals: 6 },
]

const AGENTS = [
    { name: 'Jessica Hernandez', title: 'Top Producer', avatar: '/assets/agents/Jessica Hernandez.png', sales: 94, speed: 88, compliance: 98, score: 93 },
    { name: 'Judith Gonzalez', title: 'Senior Agent', avatar: '/assets/agents/Judith Gonzalez.png', sales: 76, speed: 72, compliance: 95, score: 81 },
    { name: 'Miriam Castaño', title: 'Residential Specialist', avatar: '/assets/agents/Miriam Castano.png', sales: 68, speed: 82, compliance: 90, score: 80 },
    { name: 'Yusleidy Perez', title: 'New Agent', avatar: '/assets/agents/Yusleidy Perez.png', sales: 45, speed: 65, compliance: 88, score: 66 },
]

const GEO_ZONES = [
    { name: 'St. Matthews', x: 52, y: 42, volume: 1800000, deals: 8, speed: 26, r: 40 },
    { name: 'Prospect', x: 20, y: 18, volume: 2100000, deals: 6, speed: 22, r: 44 },
    { name: 'Anchorage', x: 80, y: 18, volume: 1200000, deals: 4, speed: 30, r: 34 },
    { name: 'Highlands', x: 78, y: 65, volume: 950000, deals: 5, speed: 28, r: 30 },
    { name: 'Springhurst', x: 20, y: 65, volume: 650000, deals: 3, speed: 32, r: 26 },
    { name: 'Downtown', x: 50, y: 82, volume: 480000, deals: 2, speed: 35, r: 22 },
]

const PULSE_DATA = [
    { label: 'Revenue Mensual', value: '$1.2M', trend: '+18%', up: true, sparkData: [30, 45, 35, 50, 65, 55, 70, 90], color: '#3B82F6' },
    { label: 'Días Prom. Cierre', value: '28', trend: '-4 días', up: true, sparkData: [38, 35, 32, 34, 30, 31, 29, 28], color: '#10B981' },
    { label: 'Docs Completados', value: '87%', trend: '+12%', up: true, sparkData: [60, 65, 70, 68, 75, 78, 82, 87], color: '#F59E0B' },
    { label: 'Comisiones Pagadas', value: '$18.6K', trend: '3 pend.', up: false, sparkData: [8, 12, 10, 15, 14, 18, 16, 18.6], color: '#8B5CF6' },
]

/* ==========================================
   HELPER — Build SVG sparkline path
   ========================================== */
function sparklinePath(data, w, h, padY = 4) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const stepX = w / (data.length - 1)
    const pts = data.map((v, i) => ({
        x: i * stepX,
        y: h - padY - ((v - min) / range) * (h - padY * 2),
    }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${h} L0,${h} Z`
    return { line, area }
}

/* ==========================================
   COMPONENT — Revenue Area Chart
   ========================================== */
function RevenueChart({ data, period }) {
    const [tooltip, setTooltip] = useState(null)
    const [animated, setAnimated] = useState(false)
    const chartRef = useRef(null)

    useEffect(() => {
        const timeout = setTimeout(() => setAnimated(true), 100)
        return () => clearTimeout(timeout)
    }, [])

    const W = 720
    const H = 250
    const padL = 55
    const padR = 20
    const padT = 20
    const padB = 35
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    const max = Math.max(...data.map(d => d.value)) * 1.1
    const stepX = chartW / (data.length - 1)

    const points = data.map((d, i) => ({
        x: padL + i * stepX,
        y: padT + chartH - (d.value / max) * chartH,
        ...d,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${padT + chartH} L${padL},${padT + chartH} Z`

    // Y-axis grid
    const gridLines = 5
    const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => {
        const val = (max / gridLines) * i
        const y = padT + chartH - (val / max) * chartH
        return { y, label: val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}K` }
    })

    return (
        <div className="revenue-card animate-fadeInUp">
            <div className="analytics-section-header">
                <div>
                    <h2>Revenue Timeline</h2>
                    <span className="section-subtitle">Volumen de ventas cerradas por mes</span>
                </div>
                <div className="period-toggle">
                    <button className="period-btn active">Mensual</button>
                    <button className="period-btn">Trimestral</button>
                    <button className="period-btn">Anual</button>
                </div>
            </div>

            <div className="revenue-chart-wrap" ref={chartRef}>
                <svg className="revenue-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {yLabels.map((gl, i) => (
                        <g key={i}>
                            <line className="grid-line" x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} />
                            <text className="axis-label" x={padL - 8} y={gl.y + 4} textAnchor="end">{gl.label}</text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {points.map((p, i) => (
                        <text key={i} className="axis-label" x={p.x} y={H - 8} textAnchor="middle">{p.month}</text>
                    ))}

                    {/* Area + Line */}
                    <path className="area-fill" d={areaPath} />
                    <path className="area-line" d={linePath} />

                    {/* Dots */}
                    {animated && points.map((p, i) => (
                        <circle
                            key={i}
                            className={`data-dot ${animated ? 'visible' : ''}`}
                            cx={p.x}
                            cy={p.y}
                            style={{ animationDelay: `${0.8 + i * 0.08}s` }}
                            onMouseEnter={(e) => {
                                const rect = chartRef.current.getBoundingClientRect()
                                setTooltip({
                                    month: p.month,
                                    value: `$${(p.value / 1000).toFixed(0)}K`,
                                    deals: p.deals,
                                    left: (p.x / W) * rect.width,
                                    top: (p.y / H) * rect.height - 55,
                                })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    ))}
                </svg>

                {/* Tooltip */}
                {tooltip && (
                    <div className="rev-tooltip show" style={{ left: tooltip.left, top: tooltip.top }}>
                        <span className="tt-month">{tooltip.month} 2025</span>
                        {tooltip.value} · {tooltip.deals} deals
                    </div>
                )}
            </div>
        </div>
    )
}

/* ==========================================
   COMPONENT — Agent Performance Matrix
   ========================================== */
function AgentMatrix({ agents }) {
    const [animated, setAnimated] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => setAnimated(true), 300)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <div className="agent-matrix-card animate-fadeInUp">
            <div className="analytics-section-header">
                <div>
                    <h2>Performance del Equipo</h2>
                    <span className="section-subtitle">Métricas comparativas por agente</span>
                </div>
            </div>

            <div className="matrix-legend">
                <div className="matrix-legend-item">
                    <div className="matrix-legend-dot" style={{ background: '#3B82F6' }}></div>
                    Ventas
                </div>
                <div className="matrix-legend-item">
                    <div className="matrix-legend-dot" style={{ background: '#10B981' }}></div>
                    Velocidad
                </div>
                <div className="matrix-legend-item">
                    <div className="matrix-legend-dot" style={{ background: '#8B5CF6' }}></div>
                    Compliance
                </div>
            </div>

            <div className="agent-matrix-list">
                {agents.map((agent, i) => (
                    <div key={i} className="agent-matrix-row" style={{ animationDelay: `${0.1 * i}s` }}>
                        <div className="matrix-agent">
                            <img src={agent.avatar} alt="" className="matrix-avatar" />
                            <div className="matrix-agent-info">
                                <span className="matrix-agent-name">{agent.name.split(' ')[0]}</span>
                                <span className="matrix-agent-title">{agent.title}</span>
                            </div>
                        </div>
                        <div className="matrix-bars">
                            <div className="matrix-bar-row">
                                <div className="matrix-bar-track">
                                    <div className="matrix-bar-fill sales" style={{ width: animated ? `${agent.sales}%` : '0%' }}></div>
                                </div>
                            </div>
                            <div className="matrix-bar-row">
                                <div className="matrix-bar-track">
                                    <div className="matrix-bar-fill speed" style={{ width: animated ? `${agent.speed}%` : '0%' }}></div>
                                </div>
                            </div>
                            <div className="matrix-bar-row">
                                <div className="matrix-bar-track">
                                    <div className="matrix-bar-fill compliance" style={{ width: animated ? `${agent.compliance}%` : '0%' }}></div>
                                </div>
                            </div>
                        </div>
                        <span className="matrix-score">{agent.score}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ==========================================
   COMPONENT — Geographic Heatmap
   ========================================== */
function GeoHeatmap({ zones }) {
    const [hoveredZone, setHoveredZone] = useState(null)
    const mapRef = useRef(null)

    const zoneColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

    return (
        <div className="geo-card animate-fadeInUp">
            <div className="analytics-section-header">
                <div>
                    <h2>Distribución Geográfica</h2>
                    <span className="section-subtitle">Volumen de ventas por zona de Louisville</span>
                </div>
            </div>

            <div className="geo-map-wrap" ref={mapRef}>
                <svg className="geo-map" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    {/* Background grid */}
                    {Array.from({ length: 10 }, (_, i) => (
                        <g key={i}>
                            <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 2" />
                            <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="var(--border-subtle)" strokeWidth="0.3" strokeDasharray="1 2" />
                        </g>
                    ))}

                    {/* Road lines (decorative) */}
                    <path d="M10,50 Q30,48 50,50 Q70,52 90,50" stroke="var(--border-medium)" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
                    <path d="M50,10 Q48,30 50,50 Q52,70 50,90" stroke="var(--border-medium)" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />

                    {/* Zone Bubbles */}
                    {zones.map((zone, i) => {
                        const r = zone.r / 10
                        return (
                            <g
                                key={i}
                                className="geo-bubble"
                                onMouseEnter={(e) => {
                                    const rect = mapRef.current.getBoundingClientRect()
                                    setHoveredZone({
                                        ...zone,
                                        left: (zone.x / 100) * rect.width + 20,
                                        top: (zone.y / 100) * rect.height - 80,
                                    })
                                }}
                                onMouseLeave={() => setHoveredZone(null)}
                            >
                                <circle className="geo-fill" cx={zone.x} cy={zone.y} r={r} fill={zoneColors[i]} />
                                <circle className="geo-ring" cx={zone.x} cy={zone.y} r={r} stroke={zoneColors[i]} />
                                <text className="geo-label" x={zone.x} y={zone.y + 0.5}>
                                    ${(zone.volume / 1000000).toFixed(1)}M
                                </text>
                                <text className="geo-name" x={zone.x} y={zone.y + 3.5}>
                                    {zone.name}
                                </text>
                            </g>
                        )
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredZone && (
                    <div className="geo-tooltip show" style={{ left: hoveredZone.left, top: hoveredZone.top }}>
                        <div className="geo-tooltip-name">{hoveredZone.name}</div>
                        <div className="geo-tooltip-stat">
                            <span>Volumen</span>
                            <span>${(hoveredZone.volume / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="geo-tooltip-stat">
                            <span>Deals</span>
                            <span>{hoveredZone.deals}</span>
                        </div>
                        <div className="geo-tooltip-stat">
                            <span>Días cierre</span>
                            <span>{hoveredZone.speed} días</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ==========================================
   COMPONENT — Commission Flow (Sankey-lite)
   ========================================== */
function CommissionFlow() {
    const totalSales = 5318000
    const totalCommission = totalSales * 0.03
    const brokerSplit = totalCommission * 0.55
    const realtorSplit = totalCommission * 0.45

    const W = 700
    const H = 200
    const nodeW = 24
    const pad = 40

    // Positions
    const salesNode = { x: pad, y: 30, h: 140, color: '#3B82F6', label: 'Ventas', amount: `$${(totalSales / 1000000).toFixed(1)}M` }
    const commNode = { x: W / 2 - nodeW / 2, y: 40, h: 120, color: '#F59E0B', label: 'Comisión 3%', amount: `$${(totalCommission / 1000).toFixed(0)}K` }
    const brokerNode = { x: W - pad - nodeW, y: 25, h: 80, color: '#10B981', label: 'Broker 55%', amount: `$${(brokerSplit / 1000).toFixed(0)}K` }
    const realtorNode = { x: W - pad - nodeW, y: 115, h: 65, color: '#8B5CF6', label: 'Realtors 45%', amount: `$${(realtorSplit / 1000).toFixed(0)}K` }

    // Build flow paths (curved Bézier)
    const flowPath = (x1, y1, h1, x2, y2, h2) => {
        const cx1 = x1 + (x2 - x1) * 0.4
        const cx2 = x1 + (x2 - x1) * 0.6
        return `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2} L${x2},${y2 + h2} C${cx2},${y2 + h2} ${cx1},${y1 + h1} ${x1},${y1 + h1} Z`
    }

    return (
        <div className="commission-flow-card animate-fadeInUp">
            <div className="analytics-section-header">
                <div>
                    <h2>Flujo de Comisiones</h2>
                    <span className="section-subtitle">Distribución de ingresos del equipo</span>
                </div>
            </div>

            <div className="flow-wrap">
                <svg className="flow-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                    {/* Flow: Sales → Commission */}
                    <path className="flow-path" fill={salesNode.color}
                        d={flowPath(salesNode.x + nodeW, salesNode.y, salesNode.h, commNode.x, commNode.y, commNode.h)} />

                    {/* Flow: Commission → Broker */}
                    <path className="flow-path" fill={brokerNode.color}
                        d={flowPath(commNode.x + nodeW, commNode.y, commNode.h * 0.55, brokerNode.x, brokerNode.y, brokerNode.h)} />

                    {/* Flow: Commission → Realtors */}
                    <path className="flow-path" fill={realtorNode.color}
                        d={flowPath(commNode.x + nodeW, commNode.y + commNode.h * 0.55, commNode.h * 0.45, realtorNode.x, realtorNode.y, realtorNode.h)} />

                    {/* Nodes */}
                    {[salesNode, commNode, brokerNode, realtorNode].map((node, i) => (
                        <g key={i}>
                            <rect className="flow-node" x={node.x} y={node.y} width={nodeW} height={node.h} fill={node.color} />
                            <text className="flow-label" x={node.x + nodeW / 2} y={node.y - 12}>{node.label}</text>
                            <text className="flow-amount" x={node.x + nodeW / 2} y={node.y + node.h + 16}>{node.amount}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    )
}

/* ==========================================
   MAIN — Analytics Page
   ========================================== */
export default function AnalyticsPage() {
    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics Command Center</h1>
                    <p className="page-subtitle">Inteligencia de negocio en tiempo real — Últimos 8 meses</p>
                </div>
            </div>

            {/* Business Pulse — KPI Sparklines */}
            <div className="pulse-grid">
                {PULSE_DATA.map((pulse, i) => {
                    const { line, area } = sparklinePath(pulse.sparkData, 120, 40)
                    return (
                        <div key={i} className={`pulse-card animate-fadeInUp delay-${i + 1}`}>
                            <div className="pulse-header">
                                <span className="pulse-label">{pulse.label}</span>
                                <span className={`pulse-trend ${pulse.up ? 'up' : 'down'}`}>
                                    {pulse.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {pulse.trend}
                                </span>
                            </div>
                            <span className="pulse-value">{pulse.value}</span>
                            <svg className="pulse-sparkline" viewBox="0 0 120 40" preserveAspectRatio="none">
                                <path className="spark-area" d={area} fill={pulse.color} />
                                <path d={line} stroke={pulse.color} />
                            </svg>
                        </div>
                    )
                })}
            </div>

            {/* Revenue Timeline */}
            <RevenueChart data={MONTHLY_REVENUE} />

            {/* Two-column: Agent Matrix + Geographic Heatmap */}
            <div className="analytics-charts-grid">
                <AgentMatrix agents={AGENTS} />
                <GeoHeatmap zones={GEO_ZONES} />
            </div>

            {/* Commission Flow */}
            <CommissionFlow />
        </div>
    )
}
