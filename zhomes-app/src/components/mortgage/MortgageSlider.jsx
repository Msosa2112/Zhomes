import ZSlider from '../ui/ZSlider'

export default function MortgageSlider({
    label, value, min, max, step = 1,
    format = v => v, suffix = '', prefix = '',
    onChange,
}) {
    const formatOptions = prefix === '$'
        ? { style: 'currency', currency: 'USD' }
        : undefined

    const displayLabel = suffix && suffix !== '$'
        ? `${label} (${format(value)}${suffix})`
        : label

    return (
        <div className="mortgage-slider">
            <ZSlider
                label={displayLabel}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={onChange}
                formatOptions={formatOptions}
            />
            <div className="mortgage-slider-bounds">
                <span>{prefix}{format(min)}{suffix}</span>
                <span>{prefix}{format(max)}{suffix}</span>
            </div>
        </div>
    )
}
