import { useMemo, useState } from 'react'

const W = 700
const H = 260
const PAD = { top: 20, right: 20, bottom: 30, left: 50 }
const CH = H - PAD.top - PAD.bottom
const CW = W - PAD.left - PAD.right

export default function AmortizationChart({ dataByYear }) {
    const [hoverIdx, setHoverIdx] = useState(null)

    const { principalPath, interestPath, maxY, yTicks, years } = useMemo(() => {
        if (!dataByYear || dataByYear.length === 0) {
            return { principalPath: '', interestPath: '', maxY: 0, yTicks: [], years: [] }
        }

        const years = dataByYear.map(d => d.year)
        const totals = dataByYear.map(d => d.principal + d.interest)
        const maxY = Math.ceil(Math.max(...totals) / 1000) * 1000

        const xScale = (i) => PAD.left + (i / (years.length - 1 || 1)) * CW
        const yScale = (v) => PAD.top + CH - (v / maxY) * CH

        // Stacked: interest on bottom, principal on top
        const interestPoints = dataByYear.map((d, i) => `${xScale(i)},${yScale(d.interest)}`)
        const totalPoints = dataByYear.map((d, i) => `${xScale(i)},${yScale(d.principal + d.interest)}`)

        const baseline = dataByYear.map((_, i) => `${xScale(i)},${yScale(0)}`)

        // Interest area (bottom)
        const interestPath = [
            `M ${interestPoints[0]}`,
            ...interestPoints.slice(1).map(p => `L ${p}`),
            ...baseline.reverse().map(p => `L ${p}`),
            'Z',
        ].join(' ')

        // Principal area (top, stacked)
        const principalPath = [
            `M ${totalPoints[0]}`,
            ...totalPoints.slice(1).map(p => `L ${p}`),
            ...interestPoints.reverse().map(p => `L ${p}`),
            'Z',
        ].join(' ')

        // Y-axis ticks
        const tickCount = 5
        const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxY / tickCount) * i)

        return { principalPath, interestPath, maxY, yTicks, years }
    }, [dataByYear])

    if (!dataByYear || dataByYear.length === 0) return null

    const xScale = (i) => PAD.left + (i / (years.length - 1 || 1)) * CW
    const yScale = (v) => PAD.top + CH - (v / maxY) * CH

    const fmtK = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
    const fmt = (v) => v.toLocaleString('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    })

    const hoveredData = hoverIdx !== null ? dataByYear[hoverIdx] : null

    return (
        <div className="amort-chart-wrap">
            <div className="amort-chart-header">
                <h3>Amortización por Año</h3>
                <div className="amort-chart-legend">
                    <span className="amort-legend-dot" style={{ background: 'var(--zhomes-red)' }} />
                    <span>Principal</span>
                    <span className="amort-legend-dot" style={{ background: '#FF6B6B' }} />
                    <span>Interés</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="amort-svg" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {yTicks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={PAD.left} y1={yScale(tick)}
                            x2={W - PAD.right} y2={yScale(tick)}
                            stroke="var(--border-subtle)" strokeWidth="0.5"
                        />
                        <text x={PAD.left - 6} y={yScale(tick) + 4}
                            textAnchor="end" className="amort-axis-label">
                            {fmtK(tick)}
                        </text>
                    </g>
                ))}

                {/* Areas */}
                <path d={interestPath} fill="#FF6B6B" opacity="0.7" className="amort-area" />
                <path d={principalPath} fill="var(--zhomes-red)" opacity="0.85" className="amort-area" />

                {/* X-axis labels */}
                {years.map((yr, i) => {
                    if (years.length > 15 && i % 5 !== 0 && i !== years.length - 1) return null
                    return (
                        <text key={i} x={xScale(i)} y={H - 6}
                            textAnchor="middle" className="amort-axis-label">
                            Año {yr}
                        </text>
                    )
                })}

                {/* Hover columns */}
                {years.map((_, i) => (
                    <rect
                        key={i}
                        x={xScale(i) - CW / years.length / 2}
                        y={PAD.top}
                        width={CW / years.length}
                        height={CH}
                        fill="transparent"
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                    />
                ))}

                {/* Hover indicator */}
                {hoverIdx !== null && (
                    <line
                        x1={xScale(hoverIdx)} y1={PAD.top}
                        x2={xScale(hoverIdx)} y2={PAD.top + CH}
                        stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4"
                    />
                )}
            </svg>

            {/* Tooltip */}
            {hoveredData && (
                <div className="amort-chart-tooltip">
                    <strong>Año {hoveredData.year}</strong>
                    <span>Principal: {fmt(hoveredData.principal)}</span>
                    <span>Interés: {fmt(hoveredData.interest)}</span>
                    <span>Balance: {fmt(hoveredData.balance)}</span>
                </div>
            )}
        </div>
    )
}
