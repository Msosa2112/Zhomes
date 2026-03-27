import { useState, useMemo } from 'react'
import { Calculator, DollarSign, Percent, Home, TrendingUp, ChevronDown } from 'lucide-react'
import { MortgageService } from '../../../services/mortgageService'
import './MortgageCalculatorPageMobile.css'

export default function MortgageCalculatorPageMobile() {
    const [price, setPrice] = useState('350000')
    const [down, setDown] = useState('70000')
    const [rate, setRate] = useState('6.5')
    const [years, setYears] = useState(30)
    const [showCompare, setShowCompare] = useState(false)

    const priceNum = Number(price) || 0
    const downNum = Number(down) || 0
    const rateNum = Number(rate) || 0

    const calc = useMemo(() => {
        return MortgageService.calculateFullPayment({
            homePrice: priceNum,
            downPayment: downNum,
            interestRate: rateNum,
            years: years
        })
    }, [priceNum, downNum, rateNum, years])

    const scenarios = useMemo(() => {
        return MortgageService.compareScenarios(priceNum, downNum, rateNum)
    }, [priceNum, downNum, rateNum])

    const downPercent = priceNum > 0 ? ((downNum / priceNum) * 100).toFixed(1) : '0.0'

    return (
        <div className="mobile-calc-page">
            <header className="mc-hero">
                <Calculator size={32} color="var(--zhomes-gold)" />
                <h1>Calculadora de Hipotecas</h1>
                <p>Estima tu pago mensual de forma precisa.</p>
            </header>

            <div className="mc-board">
                <div className="mc-result-card">
                    <span className="mc-result-label">Pago Mensual Estimado</span>
                    <strong className="mc-result-val">${calc.total.toLocaleString()}</strong>
                    <div className="mc-breakdown">
                        <div><div className="mc-dot p"></div> Principal: ${calc.principalAndInterest.toLocaleString()}</div>
                        <div><div className="mc-dot t"></div> Impuestos: ${calc.tax.toLocaleString()}</div>
                        <div><div className="mc-dot i"></div> Seguro: ${calc.insurance.toLocaleString()}</div>
                        {calc.pmi > 0 && <div><div className="mc-dot pmi"></div> PMI: ${calc.pmi.toLocaleString()}</div>}
                    </div>
                    <div className="mc-summary-row">
                        <span>Préstamo: ${calc.loanAmount.toLocaleString()}</span>
                        <span>Interés total: ${calc.totalInterest.toLocaleString()}</span>
                    </div>
                </div>

                <div className="mc-inputs-card">
                    <div className="mc-input-group">
                        <label><Home size={14} /> Precio de la casa</label>
                        <div className="mc-input-wrap">
                            <span>$</span>
                            <input type="text" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
                        </div>
                        <input
                            type="range"
                            className="mc-slider"
                            min={100000}
                            max={2000000}
                            step={5000}
                            value={priceNum}
                            onChange={e => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="mc-input-group">
                        <label><DollarSign size={14} /> Enganche ({downPercent}%)</label>
                        <div className="mc-input-wrap">
                            <span>$</span>
                            <input type="text" inputMode="numeric" value={down} onChange={e => setDown(e.target.value.replace(/[^0-9]/g, ''))} />
                        </div>
                        <input
                            type="range"
                            className="mc-slider"
                            min={0}
                            max={priceNum * 0.5}
                            step={1000}
                            value={downNum}
                            onChange={e => setDown(e.target.value)}
                        />
                    </div>
                    <div className="mc-input-group">
                        <label><Percent size={14} /> Tasa de interés (%)</label>
                        <div className="mc-input-wrap">
                            <input type="text" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ''))} />
                            <span>%</span>
                        </div>
                    </div>
                    <div className="mc-input-group">
                        <label>Plazo</label>
                        <div className="mc-term-btns">
                            {[15, 20, 25, 30].map(y => (
                                <button
                                    key={y}
                                    className={`mc-term-btn ${years === y ? 'active' : ''}`}
                                    onClick={() => setYears(y)}
                                >
                                    {y} años
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scenario Comparison */}
                <button className="mc-compare-toggle" onClick={() => setShowCompare(!showCompare)}>
                    <TrendingUp size={16} /> Comparar Escenarios
                    <ChevronDown size={16} style={{ transform: showCompare ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
                </button>

                {showCompare && (
                    <div className="mc-scenarios">
                        {scenarios.map((sc, i) => (
                            <div key={i} className="mc-scenario-card">
                                <strong>{sc.label}</strong>
                                <div className="mc-sc-row">
                                    <span>Mensual:</span>
                                    <strong>${sc.total.toLocaleString()}</strong>
                                </div>
                                <div className="mc-sc-row">
                                    <span>Total interés:</span>
                                    <span>${sc.totalInterest.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ height: '90px' }} />
        </div>
    )
}
