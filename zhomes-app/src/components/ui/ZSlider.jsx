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
                    <input
                        type="range"
                        className="zslider-input"
                        min={min}
                        max={max}
                        step={step}
                        value={safeValue}
                        onChange={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) onChange(val);
                        }}
                    />
                </div>
            </div>
        )
    }

    // Range (two thumbs)
    const [lo, hi] = value || [min, max];
    const safeLo = Math.max(min, Math.min(lo ?? min, max));
    const safeHi = Math.max(min, Math.min(hi ?? max, max));
    const loPct = pct(safeLo);
    const hiPct = pct(safeHi);

    // The thumb near the HIGH end needs to go on top when both are close together,
    // but when lo=min (leftmost) the lo thumb needs to be reachable too.
    // Solution: give lo higher z when it's near the minimum (left edge).
    const gap = safeHi - safeLo;
    const loNearMin = loPct < 10;
    const hiNearMax = hiPct > 90;
    // lo thumb on top when: near the left edge OR hi is above lo
    const loOnTop = loNearMin || gap <= step;
    const loZ = loOnTop ? 15 : 12;
    const hiZ = loOnTop ? 12 : 15;

    const handleLo = useCallback(e => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange([Math.min(val, safeHi - step), safeHi]);
        }
    }, [safeHi, step, onChange])

    const handleHi = useCallback(e => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange([safeLo, Math.max(val, safeLo + step)]);
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
                    {/* Lo thumb visual */}
                    <div className="zslider-thumb" style={{ left: `${loPct}%`, border: `3px solid ${color}`, zIndex: loZ + 1 }} />
                    {/* Hi thumb visual */}
                    <div className="zslider-thumb" style={{ left: `${hiPct}%`, border: `3px solid ${color}`, zIndex: hiZ + 1 }} />
                </div>
                {/* Lo input — rendered AFTER hi so it sits on top in the DOM when loZ wins */}
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
