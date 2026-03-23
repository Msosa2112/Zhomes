import { Check, Circle, Clock, FileText, Search, Handshake, Home, PartyPopper, Key } from 'lucide-react'
import './TransactionTimeline.css'

/**
 * TransactionTimeline — Pipeline visual animado del proceso de compra/venta.
 * 
 * Props:
 * - status: string (listed | inspection | under_contract | pre_close | closed)
 * - address: string
 * - variant: 'full' | 'compact' (default: 'full')
 * - onCelebrate: function (callback when reaching 'closed')
 */

const STEPS = [
    {
        key: 'listed',
        label: 'Listada',
        icon: FileText,
        narrative: 'Tu propiedad está activa en el mercado y visible para compradores.',
    },
    {
        key: 'inspection',
        label: 'Inspección',
        icon: Search,
        narrative: '¡Hay interés! La inspección de la propiedad está en proceso.',
    },
    {
        key: 'under_contract',
        label: 'Bajo Contrato',
        icon: Handshake,
        narrative: '¡Oferta aceptada! 🎉 Los documentos legales están en proceso.',
    },
    {
        key: 'pre_close',
        label: 'Pre-Cierre',
        icon: Home,
        narrative: 'Casi listo — La tasación y documentos finales están en revisión.',
    },
    {
        key: 'closed',
        label: '¡Cerrada!',
        icon: Key,
        narrative: '🎉 ¡Felicidades! La transacción se completó exitosamente.',
    },
]

function getStepIndex(status) {
    const idx = STEPS.findIndex(s => s.key === status)
    return idx >= 0 ? idx : 0
}

function getDaysEstimate(currentStep) {
    const remaining = STEPS.length - 1 - currentStep
    return remaining * 8 // ~8 days per step average
}

export default function TransactionTimeline({ status = 'listed', address, variant = 'full', onCelebrate }) {
    const currentStep = getStepIndex(status)
    const progress = ((currentStep) / (STEPS.length - 1)) * 100
    const daysLeft = getDaysEstimate(currentStep)
    const isClosed = status === 'closed'

    return (
        <div className={`tx-timeline ${variant} ${isClosed ? 'tx-closed' : ''}`}>
            {/* Header */}
            {variant === 'full' && (
                <div className="tx-header">
                    <div className="tx-header-left">
                        <h3 className="tx-title">Progreso de Transacción</h3>
                        {address && <p className="tx-address">{address}</p>}
                    </div>
                    <div className="tx-header-right">
                        {isClosed ? (
                            <span className="tx-badge tx-badge-success">
                                <PartyPopper size={14} />
                                Completada
                            </span>
                        ) : (
                            <span className="tx-badge tx-badge-active">
                                <Clock size={14} />
                                ~{daysLeft} días restantes
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="tx-progress-bar">
                <div className="tx-progress-track">
                    <div
                        className="tx-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="tx-steps">
                {STEPS.map((step, i) => {
                    const StepIcon = step.icon
                    const isCompleted = i < currentStep
                    const isCurrent = i === currentStep
                    const isFuture = i > currentStep

                    return (
                        <div
                            key={step.key}
                            className={`tx-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
                        >
                            <div className="tx-step-icon">
                                {isCompleted ? (
                                    <Check size={16} strokeWidth={3} />
                                ) : isCurrent ? (
                                    <StepIcon size={16} />
                                ) : (
                                    <Circle size={14} />
                                )}
                            </div>
                            <span className="tx-step-label">{step.label}</span>
                            {isCurrent && variant === 'full' && (
                                <div className="tx-step-narrative">
                                    <p>{step.narrative}</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Narrative for closed */}
            {isClosed && variant === 'full' && (
                <div className="tx-celebration-hint">
                    <PartyPopper size={18} />
                    <p>¡Enhorabuena! La transacción de <strong>{address}</strong> se ha cerrado exitosamente.</p>
                </div>
            )}
        </div>
    )
}
