import { useRef, useCallback } from 'react'

export default function MortgageSlider({
    label, value, min, max, step = 1,
    format = v => v, suffix = '', prefix = '',
    onChange, color = 'var(--zhomes-red)',
}) {
    const trackRef = useRef(null)

    const pct = ((value - min) / (max - min)) * 100

    const handleInput = useCallback((e) => {
        let v = parseFloat(e.target.value)
        if (isNaN(v)) v = min
        v = Math.max(min, Math.min(max, v))
        onChange(v)
    }, [min, max, onChange])

    return (
        <div className="mortgage-slider">
            <div className="mortgage-slider-header">
                <label className="mortgage-slider-label">{label}</label>
                <div className="mortgage-slider-value">
                    <span className="mortgage-slider-prefix">{prefix}</span>
                    <input
                        type="text"
                        className="mortgage-slider-input"
                        value={format(value)}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '')
                            const num = parseFloat(raw)
                            if (!isNaN(num)) onChange(Math.max(min, Math.min(max, num)))
                        }}
                    />
                    {suffix && <span className="mortgage-slider-suffix">{suffix}</span>}
                </div>
            </div>
            <div className="mortgage-slider-track-wrap">
                <input
                    ref={trackRef}
                    type="range"
                    className="mortgage-slider-range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleInput}
                    style={{
                        '--fill': `${pct}%`,
                        '--track-color': color,
                    }}
                />
            </div>
            <div className="mortgage-slider-bounds">
                <span>{prefix}{format(min)}{suffix}</span>
                <span>{prefix}{format(max)}{suffix}</span>
            </div>
        </div>
    )
}
