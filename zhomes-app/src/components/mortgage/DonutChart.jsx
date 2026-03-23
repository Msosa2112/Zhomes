import { useMemo } from 'react'

const SIZE = 180
const STROKE = 22
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function DonutChart({ breakdown, total }) {
    const segments = useMemo(() => {
        let offset = 0
        return breakdown
            .filter(b => b.value > 0)
            .map(b => {
                const pct = total > 0 ? b.value / total : 0
                const dashLen = pct * CIRCUMFERENCE
                const seg = { ...b, pct, dashLen, offset }
                offset += dashLen
                return seg
            })
    }, [breakdown, total])

    const fmt = (v) => v.toLocaleString('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    })

    return (
        <div className="donut-chart-wrap">
            <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="donut-svg"
                width={SIZE}
                height={SIZE}
            >
                {/* Background circle */}
                <circle
                    cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth={STROKE}
                />
                {/* Segments */}
                {segments.map((seg, i) => (
                    <circle
                        key={i}
                        cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={STROKE}
                        strokeDasharray={`${seg.dashLen} ${CIRCUMFERENCE - seg.dashLen}`}
                        strokeDashoffset={-seg.offset}
                        strokeLinecap="butt"
                        className="donut-segment"
                        style={{ '--delay': `${i * 0.1}s` }}
                        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                    />
                ))}
                {/* Center text */}
                <text x={SIZE / 2} y={SIZE / 2 - 8} textAnchor="middle"
                    className="donut-center-label">
                    Pago Mensual
                </text>
                <text x={SIZE / 2} y={SIZE / 2 + 14} textAnchor="middle"
                    className="donut-center-value">
                    {fmt(total)}
                </text>
            </svg>

            {/* Legend */}
            <div className="donut-legend">
                {segments.map((seg, i) => (
                    <div key={i} className="donut-legend-item">
                        <span className="donut-legend-dot" style={{ background: seg.color }} />
                        <span className="donut-legend-label">{seg.label}</span>
                        <span className="donut-legend-value">{fmt(seg.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
