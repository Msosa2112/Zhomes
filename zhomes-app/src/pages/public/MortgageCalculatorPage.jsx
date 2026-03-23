import { Calculator, DollarSign, TrendingDown, Clock, AlertTriangle } from 'lucide-react'
import useMortgageCalc from '../../hooks/useMortgageCalc'
import MortgageSlider from '../../components/mortgage/MortgageSlider'
import DonutChart from '../../components/mortgage/DonutChart'
import AmortizationChart from '../../components/mortgage/AmortizationChart'
import AmortizationTable from '../../components/mortgage/AmortizationTable'
import '../../components/mortgage/MortgageComponents.css'
import './MortgageCalculatorPage.css'

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')
const fmtMoney = (n) => n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
})

export default function MortgageCalculatorPage() {
    const { inputs, update, results } = useMortgageCalc()

    const loanTermOptions = [15, 20, 30]

    return (
        <div className="mortgage-page">
            {/* Header */}
            <div className="mortgage-header">
                <span className="section-eyebrow animate-fadeInDown">
                    <Calculator size={14} /> Herramientas Financieras
                </span>
                <h1 className="animate-fadeInUp">
                    Calculadora de <span className="text-red">Hipoteca</span>
                </h1>
                <p className="animate-fadeInUp delay-1">
                    Calcula tu pago mensual con datos reales de Louisville, Kentucky.
                    Incluye impuestos, seguro y PMI.
                </p>
            </div>

            {/* Main Grid: Inputs + Results */}
            <div className="mortgage-grid">
                {/* LEFT — Inputs */}
                <div className="mortgage-inputs-panel">
                    <div className="mortgage-card">
                        <h2 className="mortgage-card-title">
                            <DollarSign size={18} /> Detalles del Préstamo
                        </h2>

                        <MortgageSlider
                            label="Precio de la Vivienda"
                            prefix="$"
                            value={inputs.homePrice}
                            min={50000} max={2000000} step={5000}
                            format={fmtNum}
                            onChange={(v) => update('homePrice', v)}
                        />

                        <MortgageSlider
                            label="Enganche (Down Payment)"
                            suffix="%"
                            value={inputs.downPaymentPercent}
                            min={0} max={100} step={1}
                            format={(v) => v.toString()}
                            onChange={(v) => update('downPaymentPercent', v)}
                            color="#4ECDC4"
                        />

                        <div className="mortgage-down-amount">
                            Monto del enganche: <strong>{fmtMoney(results.downPaymentAmount)}</strong>
                        </div>

                        <MortgageSlider
                            label="Tasa de Interés"
                            suffix="%"
                            value={inputs.interestRate}
                            min={1} max={12} step={0.05}
                            format={(v) => v.toFixed(2)}
                            onChange={(v) => update('interestRate', v)}
                            color="#FF6B6B"
                        />

                        {/* Loan Term Tabs */}
                        <div className="mortgage-term-group">
                            <label className="mortgage-slider-label">Plazo del Préstamo</label>
                            <div className="mortgage-term-tabs">
                                {loanTermOptions.map(term => (
                                    <button
                                        key={term}
                                        className={`mortgage-term-tab ${inputs.loanTermYears === term ? 'active' : ''}`}
                                        onClick={() => update('loanTermYears', term)}
                                    >
                                        {term} años
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Additional Costs */}
                    <div className="mortgage-card">
                        <h2 className="mortgage-card-title">Costos Adicionales</h2>

                        <MortgageSlider
                            label="Tasa de Impuesto a la Propiedad"
                            suffix="%"
                            value={inputs.propertyTaxRate}
                            min={0} max={3} step={0.01}
                            format={(v) => v.toFixed(2)}
                            onChange={(v) => update('propertyTaxRate', v)}
                            color="#4ECDC4"
                        />

                        <MortgageSlider
                            label="Seguro de Vivienda (anual)"
                            prefix="$"
                            value={inputs.homeInsuranceYear}
                            min={0} max={8000} step={50}
                            format={fmtNum}
                            onChange={(v) => update('homeInsuranceYear', v)}
                            color="#45B7D1"
                        />

                        <MortgageSlider
                            label="HOA Mensual"
                            prefix="$"
                            value={inputs.hoaMonthly}
                            min={0} max={1000} step={10}
                            format={fmtNum}
                            onChange={(v) => update('hoaMonthly', v)}
                            color="#9B59B6"
                        />

                        <MortgageSlider
                            label="Pago Extra Mensual"
                            prefix="$"
                            value={inputs.extraPaymentMonthly}
                            min={0} max={5000} step={25}
                            format={fmtNum}
                            onChange={(v) => update('extraPaymentMonthly', v)}
                            color="var(--zhomes-gold)"
                        />
                    </div>
                </div>

                {/* RIGHT — Results */}
                <div className="mortgage-results-panel">
                    {/* Monthly Total Card */}
                    <div className="mortgage-card mortgage-total-card">
                        <div className="mortgage-total-label">Pago Mensual Estimado</div>
                        <div className="mortgage-total-amount">
                            {fmtMoney(results.monthlyTotal)}
                        </div>
                        <div className="mortgage-total-loan">
                            Préstamo: {fmtMoney(results.loanAmount)}
                            {' · '}
                            {inputs.loanTermYears} años al {inputs.interestRate}%
                        </div>

                        {results.needsPmi && (
                            <div className="mortgage-pmi-badge">
                                <AlertTriangle size={13} />
                                PMI incluido — enganche menor al 20%
                            </div>
                        )}
                    </div>

                    {/* Donut Chart */}
                    <div className="mortgage-card">
                        <DonutChart
                            breakdown={results.breakdown}
                            total={results.monthlyTotal}
                        />
                    </div>

                    {/* Summary Cards */}
                    <div className="mortgage-summary-grid">
                        <div className="mortgage-summary-card">
                            <DollarSign size={18} className="summary-icon" />
                            <div className="summary-value">{fmtMoney(results.totalPaid)}</div>
                            <div className="summary-label">Total a Pagar</div>
                        </div>
                        <div className="mortgage-summary-card">
                            <TrendingDown size={18} className="summary-icon interest" />
                            <div className="summary-value">{fmtMoney(results.totalInterest)}</div>
                            <div className="summary-label">Total Intereses</div>
                        </div>
                        {results.savedMonths > 0 && (
                            <div className="mortgage-summary-card highlight">
                                <Clock size={18} className="summary-icon saved" />
                                <div className="summary-value">{results.savedMonths} meses</div>
                                <div className="summary-label">Ahorro con pagos extra</div>
                                <div className="summary-sub">{fmtMoney(results.interestSaved)} en intereses</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Width — Amortization */}
            <div className="mortgage-amortization">
                <div className="mortgage-card">
                    <AmortizationChart dataByYear={results.amortizationByYear} />
                </div>
                <div className="mortgage-card">
                    <AmortizationTable
                        dataByYear={results.amortizationByYear}
                        amortization={results.amortization}
                    />
                </div>
            </div>
        </div>
    )
}
