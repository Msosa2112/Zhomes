import { useCallback } from 'react'
import './ZSlider.css'

export default function ZSlider({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    formatOptions,
    color = 'var(--zhomes-red, #E31E24)',
    className = '',
}) {
    const isRange = Array.isArray(value)

    const fmt = useCallback((n) => {
        if (n === undefined || n === null || isNaN(n)) return '';
        if (!formatOptions) return String(n)
        if (formatOptions.style === 'percent') {
            return new Intl.NumberFormat('en-US', formatOptions).format(n / 100)
        }
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0, ...formatOptions }).format(n)
    }, [formatOptions])

    const pct = useCallback((v) => {
        if (v === undefined || v === null || isNaN(v)) return 0;
        return ((v - min) / (max - min)) * 100;
    }, [min, max])

    if (!isRange) {
        const safeValue = value ?? min;
        const percent = pct(safeValue);
        
        return (
            <div className={`zslider-root ${className}`}>
                <div className="zslider-header">
                    {label && <span className="zslider-label">{label}</span>}
                    <span className="zslider-output" style={{ color: color }}>{fmt(safeValue)}</span>
                </div>
                <div className="zslider-track-wrap">
                    <div className="zslider-track">
                        <div className="zslider-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
                        <div 
                            className="zslider-thumb" 
                            style={{ 
                                left: `${percent}%`, 
                                border: `3px solid ${color}` 
                            }} 
                        />
                    </div>
                    {/* Native input layered on top, invisible, touch-action: none */}
                    <input
                        type="range"
                        className="zslider-input"
                        min={min}
                        max={max}
                        step={step}
                        value={safeValue}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                                onChange(val);
                            }
                        }}
                    />
                </div>
            </div>
        )
    }

    // Range (two thumbs)
    const [lo, hi] = value || [min, max];
    const safeLo = lo ?? min;
    const safeHi = hi ?? max;
    const loPct = pct(safeLo);
    const hiPct = pct(safeHi);

    const loOnTop = safeLo >= safeHi - step || (loPct > 90)
    const loZ = loOnTop ? 15 : 13
    const hiZ = loOnTop ? 13 : 15

    const handleLo = useCallback(e => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            const v = Math.min(val, safeHi - step)
            onChange([v, safeHi])
        }
    }, [safeHi, step, onChange])

    const handleHi = useCallback(e => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            const v = Math.max(val, safeLo + step)
            onChange([safeLo, v])
        }
    }, [safeLo, step, onChange])

    return (
        <div className={`zslider-root ${className}`}>
            <div className="zslider-header">
                {label && <span className="zslider-label">{label}</span>}
                <span className="zslider-output" style={{ color: color }}>
                    {fmt(safeLo)} – {fmt(safeHi)}
                </span>
            </div>
            <div className="zslider-track-wrap">
                <div className="zslider-track">
                    <div
                        className="zslider-fill"
                        style={{ left: `${loPct}%`, width: `${hiPct - loPct}%`, backgroundColor: color }}
                    />
                    <div className="zslider-thumb" style={{ left: `${loPct}%`, border: `3px solid ${color}`, zIndex: 11 }} />
                    <div className="zslider-thumb" style={{ left: `${hiPct}%`, border: `3px solid ${color}`, zIndex: 11 }} />
                </div>
                <input
                    type="range"
                    className="zslider-input"
                    min={min}
                    max={max}
                    step={step}
                    value={safeLo}
                    onChange={handleLo}
                    style={{ zIndex: loZ }}
                />
                <input
                    type="range"
                    className="zslider-input"
                    min={min}
                    max={max}
                    step={step}
                    value={safeHi}
                    onChange={handleHi}
                    style={{ zIndex: hiZ }}
                />
            </div>
        </div>
    )
}
