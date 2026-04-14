import { useState, useEffect } from 'react'
import { X, DollarSign, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, BarChart3, Home, Shield, Info, Save, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import './PrequalToolMobile.css'

// ─── Rate table by FICO score tier ──────────────────────────────────────────
const CREDIT_TIERS = [
    { label: '740+ (Excelente)',      min: 740, rate30: 6.5,  rate15: 5.9,  type: 'Convencional',    color: '#10B981', emoji: '' },
    { label: '700–739 (Muy bueno)',   min: 700, rate30: 6.9,  rate15: 6.2,  type: 'Convencional',    color: '#10B981', emoji: '' },
    { label: '660–699 (Bueno)',       min: 660, rate30: 7.35, rate15: 6.7,  type: 'Convencional',    color: 'var(--text-secondary)', emoji: '' },
    { label: '620–659 (Regular)',     min: 620, rate30: 7.9,  rate15: 7.2,  type: 'FHA preferible',  color: '#F97316', emoji: '' },
    { label: '580–619 (FHA mínimo)',  min: 580, rate30: 8.5,  rate15: null, type: 'Solo FHA',         color: 'var(--zhomes-red)', emoji: '' },
    { label: 'Menos de 580',          min: 0,   rate30: null, rate15: null, type: 'No califica',     color: '#6B7280', emoji: '' },
]

const PROP_TAX_RATE = 0.012
const INSURANCE_MO  = 150
const PMI_RATE      = 0.0085
const FHA_MIP_RATE  = 0.0055
const FHA_UFMIP     = 0.0175

function calcMonthlyPayment(principal, annualRate, years) {
    const r = annualRate / 100 / 12
    const n = years * 12
    if (r === 0) return principal / n
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function calcMaxLoan(maxPayment, annualRate, years) {
    const r = annualRate / 100 / 12
    const n = years * 12
    if (r === 0) return maxPayment * n
    return maxPayment * (1 - Math.pow(1 + r, -n)) / r
}

function computePrequal({ grossMonthly, existingDebts, downPayment, creditTier, loanTerm }) {
    const tier = CREDIT_TIERS[creditTier]
    if (!tier.rate30) {
        return { qualified: false, reason: 'El score crediticio es demasiado bajo para calificar para cualquier préstamo convencional o FHA en este momento.' }
    }
    const annualRate = loanTerm === 30 ? tier.rate30 : (tier.rate15 || tier.rate30)
    const isFHA = tier.type.includes('FHA')
    const maxFrontPayment = grossMonthly * (isFHA ? 0.31 : 0.28)
    const maxBackPayment  = (grossMonthly * 0.43) - existingDebts
    const maxHousingPayment = Math.min(maxFrontPayment, Math.max(0, maxBackPayment))
    if (maxHousingPayment <= 0) {
        return { qualified: false, reason: 'Las deudas mensuales existentes superan el límite back-end del 43% del ingreso bruto. El cliente necesita reducir deudas antes de calificar.' }
    }
    let loanAmount = 0
    let purchasePrice = 0
    for (let iter = 0; iter < 50; iter++) {
        const tryPrice = iter === 0 ? 250000 : purchasePrice
        const propTaxMo = (tryPrice * PROP_TAX_RATE) / 12
        const pmiBase = tryPrice - downPayment
        let pmiMo = 0
        if (downPayment / tryPrice < 0.20) {
            pmiMo = isFHA ? (pmiBase * FHA_MIP_RATE) / 12 : (pmiBase * PMI_RATE) / 12
        }
        const fixedCost = propTaxMo + INSURANCE_MO + pmiMo
        const piAvailable = maxHousingPayment - fixedCost
        if (piAvailable <= 0) break
        loanAmount = calcMaxLoan(piAvailable, annualRate, loanTerm)
        if (isFHA) loanAmount = loanAmount / (1 + FHA_UFMIP)
        const newPrice = loanAmount + downPayment
        if (Math.abs(newPrice - purchasePrice) < 100) break
        purchasePrice = newPrice
    }
    purchasePrice = Math.max(loanAmount + downPayment, 0)
    const downPct       = (downPayment / purchasePrice) * 100
    const finalLoanAmt  = isFHA ? loanAmount * (1 + FHA_UFMIP) : loanAmount
    const piPayment     = calcMonthlyPayment(finalLoanAmt, annualRate, loanTerm)
    const propTaxMo     = (purchasePrice * PROP_TAX_RATE) / 12
    const pmiMo         = downPct < 20
        ? isFHA ? (finalLoanAmt * FHA_MIP_RATE) / 12 : (finalLoanAmt * PMI_RATE) / 12
        : 0
    const totalMonthly  = piPayment + propTaxMo + INSURANCE_MO + pmiMo
    const frontEndDTI   = (totalMonthly / grossMonthly) * 100
    const backEndDTI    = ((totalMonthly + existingDebts) / grossMonthly) * 100
    const rangeLow      = Math.round(purchasePrice * 0.92 / 1000) * 1000
    const rangeHigh     = Math.round(purchasePrice * 1.02 / 1000) * 1000
    return {
        qualified: true, tier, annualRate, loanTerm, isFHA,
        purchasePrice: Math.round(purchasePrice / 1000) * 1000,
        rangeLow, rangeHigh,
        loanAmount: Math.round(finalLoanAmt),
        downPayment, downPct: downPct.toFixed(1),
        piPayment: Math.round(piPayment),
        propTaxMo: Math.round(propTaxMo),
        insuranceMo: INSURANCE_MO,
        pmiMo: Math.round(pmiMo),
        totalMonthly: Math.round(totalMonthly),
        frontEndDTI: frontEndDTI.toFixed(1),
        backEndDTI: backEndDTI.toFixed(1),
        frontEndOK: frontEndDTI <= (isFHA ? 31 : 28),
        backEndOK: backEndDTI <= 43,
    }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PrequalToolMobile({ onClose, userId }) {
    const [step, setStep]               = useState(1)
    const [grossMonthly, setGrossMonthly]   = useState('')
    const [existingDebts, setExistingDebts] = useState('')
    const [downPayment, setDownPayment]     = useState('')
    const [creditTier, setCreditTier]       = useState(1)
    const [loanTerm, setLoanTerm]           = useState(30)
    const [result, setResult]               = useState(null)
    const [saving, setSaving]               = useState(false)
    const [saved, setSaved]                 = useState(false)
    const [savedAt, setSavedAt]             = useState(null)
    const [loadingExisting, setLoadingExisting] = useState(true)

    // ── Load existing saved estimate on mount ────────────────────────────────
    useEffect(() => {
        if (!userId) { setLoadingExisting(false); return }
        const load = async () => {
            const { data } = await supabase
                .from('prequal_estimates')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            if (data) {
                setGrossMonthly(String(data.gross_monthly))
                setExistingDebts(String(data.existing_debts))
                setDownPayment(String(data.down_payment))
                setCreditTier(data.credit_tier_index)
                setLoanTerm(data.loan_term)
                // Rehydrate tier object from stored result
                const storedResult = data.result
                if (storedResult) {
                    storedResult.tier = CREDIT_TIERS[data.credit_tier_index]
                    setResult(storedResult)
                    setStep(2)
                }
                setSaved(true)
                setSavedAt(new Date(data.updated_at))
            }
            setLoadingExisting(false)
        }
        load()
    }, [userId])

    const handleCalculate = () => {
        const res = computePrequal({
            grossMonthly:  parseFloat(grossMonthly)  || 0,
            existingDebts: parseFloat(existingDebts) || 0,
            downPayment:   parseFloat(downPayment)   || 0,
            creditTier, loanTerm,
        })
        setResult(res)
        setSaved(false)
        setStep(2)
    }

    const handleSave = async () => {
        if (!userId || !result) return
        setSaving(true)
        const payload = {
            user_id:           userId,
            gross_monthly:     parseFloat(grossMonthly)  || 0,
            existing_debts:    parseFloat(existingDebts) || 0,
            down_payment:      parseFloat(downPayment)   || 0,
            credit_tier_index: creditTier,
            credit_tier_label: CREDIT_TIERS[creditTier].label,
            loan_term:         loanTerm,
            result:            { ...result, tier: undefined }, // don't store function refs
            updated_at:        new Date().toISOString(),
        }
        const { error } = await supabase
            .from('prequal_estimates')
            .upsert(payload, { onConflict: 'user_id' })

        setSaving(false)
        if (!error) {
            setSaved(true)
            setSavedAt(new Date())
        } else {
            alert('Error guardando: ' + error.message)
        }
    }

    const canCalculate = parseFloat(grossMonthly) > 500
    const fmt = (n) => n?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const fmtDate = (d) => d ? d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

    if (loadingExisting) {
        return (
            <div className="prequal-overlay" onClick={onClose}>
                <div className="prequal-sheet" onClick={e => e.stopPropagation()}>
                    <div className="prequal-header">
                        <div className="prequal-header-left">
                            <div className="prequal-header-icon"><BarChart3 size={22} color="#fff" /></div>
                            <div><h2>Estimador de Pre-Calificación</h2><p>Cargando datos guardados...</p></div>
                        </div>
                        <button className="prequal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                    <div className="prequal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                        <div className="prequal-loading-spinner" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="prequal-overlay" onClick={onClose}>
            <div className="prequal-sheet" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="prequal-header">
                    <div className="prequal-header-left">
                        <div className="prequal-header-icon"><BarChart3 size={22} color="#fff" /></div>
                        <div>
                            <h2>Estimador de Pre-Calificación</h2>
                            {saved && savedAt
                                ? <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={10} /> Guardado: {fmtDate(savedAt)}
                                  </p>
                                : <p>Herramienta interna · No oficial</p>
                            }
                        </div>
                    </div>
                    <button className="prequal-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Step indicator */}
                <div className="prequal-steps">
                    <div className={`prequal-step ${step >= 1 ? 'active' : ''}`}>
                        <span>1</span> Datos del cliente
                    </div>
                    <div className="prequal-step-line" />
                    <div className={`prequal-step ${step >= 2 ? 'active' : ''}`}>
                        <span>2</span> Resultados
                    </div>
                </div>

                <div className="prequal-body">
                    {/* ── STEP 1: Input form ────────────────────────────────── */}
                    {step === 1 && (
                        <div className="prequal-form">
                            <div className="prequal-field">
                                <label>
                                    <DollarSign size={14} /> Ingreso bruto mensual del cliente
                                    <span className="prequal-hint">Antes de impuestos (suma todos los ingresos)</span>
                                </label>
                                <div className="prequal-input-wrap">
                                    <span className="prequal-prefix">$</span>
                                    <input type="number" placeholder="5,000" value={grossMonthly}
                                        onChange={e => { setGrossMonthly(e.target.value); setSaved(false) }}
                                        className="prequal-input" />
                                </div>
                            </div>

                            <div className="prequal-field">
                                <label>
                                    <TrendingUp size={14} /> Deudas mensuales existentes
                                    <span className="prequal-hint">Auto, student loans, mínimos de tarjetas (0 si no tiene)</span>
                                </label>
                                <div className="prequal-input-wrap">
                                    <span className="prequal-prefix">$</span>
                                    <input type="number" placeholder="400" value={existingDebts}
                                        onChange={e => { setExistingDebts(e.target.value); setSaved(false) }}
                                        className="prequal-input" />
                                </div>
                            </div>

                            <div className="prequal-field">
                                <label>
                                    <Home size={14} /> Enganche disponible (down payment)
                                    <span className="prequal-hint">Efectivo disponible para el enganche inicial</span>
                                </label>
                                <div className="prequal-input-wrap">
                                    <span className="prequal-prefix">$</span>
                                    <input type="number" placeholder="15,000" value={downPayment}
                                        onChange={e => { setDownPayment(e.target.value); setSaved(false) }}
                                        className="prequal-input" />
                                </div>
                            </div>

                            <div className="prequal-field">
                                <label>
                                    <Shield size={14} /> Score crediticio aproximado
                                    <span className="prequal-hint">Pídele al cliente su rango general</span>
                                </label>
                                <div className="prequal-credit-grid">
                                    {CREDIT_TIERS.map((t, i) => (
                                        <button key={i}
                                            className={`prequal-credit-btn ${creditTier === i ? 'selected' : ''}`}
                                            style={{ '--tier-color': t.color }}
                                            onClick={() => { setCreditTier(i); setSaved(false) }}>
                                            <span className="prequal-credit-emoji">{t.emoji}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="prequal-field">
                                <label>Término del préstamo preferido</label>
                                <div className="prequal-toggle-row">
                                    <button className={`prequal-toggle ${loanTerm === 30 ? 'active' : ''}`} onClick={() => { setLoanTerm(30); setSaved(false) }}>
                                        30 años <span>Cuota más baja</span>
                                    </button>
                                    <button className={`prequal-toggle ${loanTerm === 15 ? 'active' : ''}`} onClick={() => { setLoanTerm(15); setSaved(false) }}>
                                        15 años <span>Menos interés total</span>
                                    </button>
                                </div>
                            </div>

                            <button className="prequal-btn-primary" disabled={!canCalculate} onClick={handleCalculate}>
                                Calcular Pre-Calificación <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Results ─────────────────────────────────────── */}
                    {step === 2 && result && (
                        <div className="prequal-results">
                            {result.qualified ? (
                                <>
                                    <div className="prequal-range-card">
                                        <div className="prequal-range-label"> Rango de Casa Estimado</div>
                                        <div className="prequal-range-values">
                                            <span className="prequal-range-low">{fmt(result.rangeLow)}</span>
                                            <span className="prequal-range-dash">—</span>
                                            <span className="prequal-range-high">{fmt(result.rangeHigh)}</span>
                                        </div>
                                        <div className="prequal-loan-type" style={{ background: result.tier?.color || '#10B981' }}>
                                            {result.tier?.type || result.isFHA ? 'FHA' : 'Convencional'} · {result.annualRate}% @ {result.loanTerm} años
                                        </div>
                                    </div>

                                    <div className="prequal-dti-row">
                                        <div className={`prequal-dti-card ${result.frontEndOK ? 'ok' : 'warn'}`}>
                                            {result.frontEndOK ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            <div>
                                                <span className="prequal-dti-label">DTI Front-End</span>
                                                <span className="prequal-dti-value">{result.frontEndDTI}%</span>
                                                <span className="prequal-dti-limit">Límite: {result.isFHA ? '31' : '28'}%</span>
                                            </div>
                                        </div>
                                        <div className={`prequal-dti-card ${result.backEndOK ? 'ok' : 'warn'}`}>
                                            {result.backEndOK ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            <div>
                                                <span className="prequal-dti-label">DTI Back-End</span>
                                                <span className="prequal-dti-value">{result.backEndDTI}%</span>
                                                <span className="prequal-dti-limit">Límite: 43%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prequal-breakdown-card">
                                        <div className="prequal-breakdown-title">
                                             Pago mensual estimado
                                            <span className="prequal-breakdown-total">{fmt(result.totalMonthly)}/mes</span>
                                        </div>
                                        <div className="prequal-breakdown-rows">
                                            <div className="prequal-br-row">
                                                <span>Principal + Interés ({result.annualRate}%)</span>
                                                <span>{fmt(result.piPayment)}</span>
                                            </div>
                                            <div className="prequal-br-row">
                                                <span>Impuestos estimados (~1.2% anual)</span>
                                                <span>{fmt(result.propTaxMo)}</span>
                                            </div>
                                            <div className="prequal-br-row">
                                                <span>Seguro del hogar</span>
                                                <span>{fmt(result.insuranceMo)}</span>
                                            </div>
                                            {result.pmiMo > 0 && (
                                                <div className="prequal-br-row warn-row">
                                                    <span>{result.isFHA ? 'MIP (seguro FHA)' : 'PMI (seguro hipotecario)'}</span>
                                                    <span>{fmt(result.pmiMo)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="prequal-br-divider" />
                                        <div className="prequal-br-row total-row">
                                            <span>TOTAL MENSUAL</span>
                                            <span>{fmt(result.totalMonthly)}</span>
                                        </div>
                                        {result.pmiMo > 0 && (
                                            <div className="prequal-pmi-note">
                                                <Info size={12} />
                                                {result.isFHA
                                                    ? 'El seguro MIP de FHA se aplica de por vida si el enganche es menor al 10%.'
                                                    : 'El PMI desaparece automáticamente cuando el préstamo baja al 80% del valor de la propiedad.'
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="prequal-key-nums">
                                        <div className="prequal-kn">
                                            <span>Monto del préstamo</span>
                                            <strong>{fmt(result.loanAmount)}</strong>
                                        </div>
                                        <div className="prequal-kn">
                                            <span>Enganche</span>
                                            <strong>{fmt(result.downPayment)} ({result.downPct}%)</strong>
                                        </div>
                                    </div>

                                    {parseFloat(result.downPct) < 20 && (
                                        <div className="prequal-tip warn">
                                            <AlertCircle size={14} />
                                            El enganche es menor al 20%. Un enganche mayor elimina el PMI y reduce la cuota mensual.
                                        </div>
                                    )}

                                    {/* Save button */}
                                    <button
                                        className={`prequal-save-btn ${saved ? 'saved' : ''}`}
                                        onClick={handleSave}
                                        disabled={saving || saved || !userId}
                                    >
                                        {saving
                                            ? 'Guardando...'
                                            : saved
                                                ? <><CheckCircle2 size={16} /> Guardado en el perfil</>
                                                : <><Save size={16} /> Guardar en el perfil del cliente</>
                                        }
                                    </button>

                                    <div className="prequal-disclaimer">
                                        <Info size={14} />
                                        <p>
                                            <strong>Aviso importante:</strong> Esta estimación es una herramienta de orientación interna basada en fórmulas estándar bancarias. <strong>No constituye una pre-aprobación oficial.</strong> Los resultados reales varían según el lender, historial crediticio completo, tipo de propiedad y condiciones del mercado.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="prequal-no-qualify">
                                    <AlertCircle size={48} color="var(--zhomes-red)" />
                                    <h3>No califica en este momento</h3>
                                    <p>{result.reason}</p>
                                    <div className="prequal-recommendations">
                                        <h4>Recomendaciones para el cliente:</h4>
                                        <ul>
                                            <li>Reducir deudas mensuales por debajo del 43% del ingreso bruto</li>
                                            <li>Mejorar el score crediticio pagando deudas existentes</li>
                                            <li>Aumentar el ingreso o agregar un co-borrower</li>
                                            <li>Consultar con un credit counselor</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="prequal-actions">
                                <button className="prequal-btn-back" onClick={() => setStep(1)}>
                                    <ChevronLeft size={16} /> Recalcular
                                </button>
                                <button className="prequal-btn-primary" onClick={onClose}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
