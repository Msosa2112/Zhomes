import { useState } from 'react'
import { Calculator } from 'lucide-react'
import './MortgageCalculatorPageMobile.css'

export default function MortgageCalculatorPageMobile() {
    const [price, setPrice] = useState(400000)
    const [down, setDown] = useState(80000)

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
                    <strong className="mc-result-val">$2,450</strong>
                    <div className="mc-breakdown">
                        <div><div className="mc-dot p"></div> Principal: $1,800</div>
                        <div><div className="mc-dot t"></div> Taxes: $450</div>
                        <div><div className="mc-dot i"></div> Seguro: $200</div>
                    </div>
                </div>

                <div className="mc-inputs-card">
                    <div className="mc-input-group">
                        <label>Precio de la casa</label>
                        <div className="mc-input-wrap">
                            <span>$</span>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                    </div>
                    <div className="mc-input-group">
                        <label>Enganche (Down Payment)</label>
                        <div className="mc-input-wrap">
                            <span>$</span>
                            <input type="number" value={down} onChange={e => setDown(e.target.value)} />
                        </div>
                    </div>
                    <div className="mc-input-group">
                        <label>Tasa de interés (%)</label>
                        <div className="mc-input-wrap">
                            <input type="number" defaultValue="6.5" step="0.1" />
                        </div>
                    </div>
                    <div className="mc-input-group">
                        <label>Años</label>
                        <select className="mc-select">
                            <option>30 años (Fijo)</option>
                            <option>15 años (Fijo)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ height: '90px' }} />
        </div>
    )
}
