import { useState, useMemo } from 'react'

/* ── Kentucky / Louisville defaults ── */
const DEFAULTS = {
    homePrice: 300000,
    downPaymentPercent: 20,
    interestRate: 6.75,
    loanTermYears: 30,
    propertyTaxRate: 0.86,       // Jefferson County effective
    homeInsuranceYear: 2086,     // Louisville avg
    pmiRate: 0.5,                // annual % of loan
    hoaMonthly: 0,
    extraPaymentMonthly: 0,
}

/* ── Core math ── */
function calcMonthlyPayment(principal, annualRate, termYears) {
    if (principal <= 0) return 0
    if (annualRate <= 0) return principal / (termYears * 12)
    const i = annualRate / 100 / 12
    const n = termYears * 12
    return principal * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
}

function buildAmortization(principal, annualRate, termYears, extraMonthly = 0) {
    const schedule = []
    if (principal <= 0) return schedule

    const i = annualRate <= 0 ? 0 : annualRate / 100 / 12
    const basePayment = calcMonthlyPayment(principal, annualRate, termYears)
    let balance = principal
    let totalInterest = 0
    let totalPrincipal = 0

    const maxMonths = termYears * 12
    for (let month = 1; month <= maxMonths && balance > 0; month++) {
        const interestPart = balance * i
        let principalPart = basePayment - interestPart + extraMonthly

        // Don't overpay
        if (principalPart > balance) principalPart = balance

        balance -= principalPart
        if (balance < 0.01) balance = 0

        totalInterest += interestPart
        totalPrincipal += principalPart

        schedule.push({
            month,
            year: Math.ceil(month / 12),
            payment: principalPart + interestPart,
            principal: principalPart,
            interest: interestPart,
            balance,
            totalInterest,
            totalPrincipal,
        })
    }
    return schedule
}

function aggregateByYear(schedule) {
    const years = []
    let currentYear = null

    for (const row of schedule) {
        if (!currentYear || currentYear.year !== row.year) {
            if (currentYear) years.push(currentYear)
            currentYear = {
                year: row.year,
                principal: 0,
                interest: 0,
                balance: row.balance,
            }
        }
        currentYear.principal += row.principal
        currentYear.interest += row.interest
        currentYear.balance = row.balance
    }
    if (currentYear) years.push(currentYear)
    return years
}

/* ── Hook ── */
export default function useMortgageCalc(initialValues = {}) {
    const [inputs, setInputs] = useState({ ...DEFAULTS, ...initialValues })

    const update = (key, value) => {
        setInputs(prev => ({ ...prev, [key]: value }))
    }

    const resetDefaults = () => setInputs({ ...DEFAULTS })

    const results = useMemo(() => {
        const {
            homePrice, downPaymentPercent, interestRate, loanTermYears,
            propertyTaxRate, homeInsuranceYear, pmiRate, hoaMonthly,
            extraPaymentMonthly,
        } = inputs

        const downPaymentAmount = homePrice * (downPaymentPercent / 100)
        const loanAmount = homePrice - downPaymentAmount
        const needsPmi = downPaymentPercent < 20

        // Monthly components
        const monthlyPrincipalInterest = calcMonthlyPayment(loanAmount, interestRate, loanTermYears)
        const monthlyTax = (homePrice * (propertyTaxRate / 100)) / 12
        const monthlyInsurance = homeInsuranceYear / 12
        const monthlyPmi = needsPmi ? (loanAmount * (pmiRate / 100)) / 12 : 0
        const monthlyHoa = hoaMonthly

        const monthlyTotal = monthlyPrincipalInterest + monthlyTax + monthlyInsurance + monthlyPmi + monthlyHoa

        // Amortization
        const amortization = buildAmortization(loanAmount, interestRate, loanTermYears, extraPaymentMonthly)
        const amortizationByYear = aggregateByYear(amortization)

        const totalInterest = amortization.length > 0
            ? amortization[amortization.length - 1].totalInterest
            : 0
        const totalPaid = loanAmount + totalInterest
        const actualTermMonths = amortization.length
        const savedMonths = (loanTermYears * 12) - actualTermMonths

        // Amortization WITHOUT extra payments (for comparison)
        const baseAmortization = extraPaymentMonthly > 0
            ? buildAmortization(loanAmount, interestRate, loanTermYears, 0)
            : amortization
        const baseTotalInterest = baseAmortization.length > 0
            ? baseAmortization[baseAmortization.length - 1].totalInterest
            : 0
        const interestSaved = baseTotalInterest - totalInterest

        // Breakdown for donut chart
        const breakdown = [
            { label: 'Principal', value: monthlyPrincipalInterest - (loanAmount > 0 ? loanAmount * (interestRate / 100 / 12) : 0), color: 'var(--zhomes-red)' },
            { label: 'Interés', value: loanAmount > 0 ? loanAmount * (interestRate / 100 / 12) : 0, color: '#FF6B6B' },
            { label: 'Taxes', value: monthlyTax, color: '#4ECDC4' },
            { label: 'Seguro', value: monthlyInsurance, color: '#45B7D1' },
        ]
        if (needsPmi) breakdown.push({ label: 'PMI', value: monthlyPmi, color: '#FFA07A' })
        if (monthlyHoa > 0) breakdown.push({ label: 'HOA', value: monthlyHoa, color: '#9B59B6' })

        return {
            loanAmount,
            downPaymentAmount,
            needsPmi,
            monthlyPrincipalInterest,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi,
            monthlyHoa,
            monthlyTotal,
            totalInterest,
            totalPaid,
            actualTermMonths,
            savedMonths,
            interestSaved,
            amortization,
            amortizationByYear,
            breakdown,
        }
    }, [inputs])

    return { inputs, update, resetDefaults, results }
}

export { DEFAULTS }
