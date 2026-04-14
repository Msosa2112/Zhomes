import { useState } from 'react'
import { CheckCircle2, Clock, Upload, ChevronDown, ChevronUp, FileText, Eye, PartyPopper } from 'lucide-react'
import TransactionTimeline from '../../components/shared/TransactionTimeline'
import ClosingCelebration from '../../components/shared/ClosingCelebration'
import { REALTOR_TRANSACTIONS, REALTORS } from '../../data/mockData'
import './RealtorTransactions.css'

const STATUS_FILTERS = [
    { key: 'all', label: 'Todas' },
    { key: 'listed', label: 'Listada' },
    { key: 'under_contract', label: 'Bajo Contrato' },
    { key: 'inspection', label: 'Inspección' },
    { key: 'pre_close', label: 'Pre-Cierre' },
    { key: 'closed', label: 'Cerrada' },
]

const DOC_STATUS_ICON = {
    approved: { icon: CheckCircle2, color: '#10B981', label: 'Aprobado' },
    uploaded: { icon: Eye, color: 'var(--text-secondary)', label: 'En revisión' },
    pending: { icon: Clock, color: '#9CA3AF', label: 'Pendiente' },
}

export default function RealtorTransactions() {
    const [filter, setFilter] = useState('all')
    const [expandedId, setExpandedId] = useState(null)
    const [celebrateTransaction, setCelebrateTransaction] = useState(null)

    const filtered = filter === 'all'
        ? REALTOR_TRANSACTIONS
        : REALTOR_TRANSACTIONS.filter(t => t.status === filter)

    return (
        <div className="rt-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mis Transacciones</h1>
                    <p className="page-subtitle">{REALTOR_TRANSACTIONS.length} transacciones totales</p>
                </div>
            </div>

            {/* Filters */}
            <div className="rt-filters">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`rt-filter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Transaction list */}
            <div className="rt-list">
                {filtered.map(t => {
                    const isExpanded = expandedId === t.id
                    const completedDocs = t.documents.filter(d => d.status === 'approved').length
                    const totalDocs = t.documents.length
                    const docProgress = Math.round((completedDocs / totalDocs) * 100)

                    return (
                        <div key={t.id} className={`rt-card ${isExpanded ? 'expanded' : ''}`}>
                            <div className="rt-card-main" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                                <img src={t.image} alt="" className="rt-card-img" />
                                <div className="rt-card-info">
                                    <h3>{t.address}</h3>
                                    <span className="rt-card-city">{t.city}</span>
                                </div>
                                <div className="rt-card-price">${t.price.toLocaleString()}</div>
                                <span className="rt-card-status" style={{ color: t.statusColor, background: `${t.statusColor}12` }}>
                                    {t.statusLabel}
                                </span>
                                <div className="rt-card-docs-bar">
                                    <div className="rt-progress-track">
                                        <div className="rt-progress-fill" style={{ width: `${docProgress}%`, background: docProgress === 100 ? '#10B981' : '#3B82F6' }}></div>
                                    </div>
                                    <span className="rt-docs-count">{completedDocs}/{totalDocs}</span>
                                </div>
                                <button className="rt-expand-btn">
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="rt-card-expand animate-fadeInUp">
                                    <TransactionTimeline
                                        status={t.status}
                                        address={t.address}
                                        variant="full"
                                    />
                                    <div className="rt-docs-header">
                                        <FileText size={16} />
                                        <span>Documentos Requeridos</span>
                                    </div>
                                    <div className="rt-docs-list">
                                        {t.documents.map((doc, i) => {
                                            const st = DOC_STATUS_ICON[doc.status]
                                            return (
                                                <div key={i} className={`rt-doc-item ${doc.status}`}>
                                                    <st.icon size={16} style={{ color: st.color }} />
                                                    <span className="rt-doc-name">{doc.name}</span>
                                                    <span className="rt-doc-status" style={{ color: st.color }}>{st.label}</span>
                                                    {doc.status === 'pending' && (
                                                        <button className="rt-upload-btn">
                                                            <Upload size={14} />
                                                            Subir
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="rt-card-meta">
                                        <span>Listada: {t.listDate}</span>
                                        <span>{t.daysOnMarket} días en mercado</span>
                                        {t.status === 'closed' && (
                                            <button
                                                className="rt-celebrate-btn"
                                                onClick={() => setCelebrateTransaction(t)}
                                            >
                                                <PartyPopper size={14} />
                                                Celebrar Cierre
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <ClosingCelebration
                isOpen={!!celebrateTransaction}
                onClose={() => setCelebrateTransaction(null)}
                transaction={celebrateTransaction}
                realtor={{ name: REALTORS[0].name, photo: REALTORS[0].image }}
            />
        </div>
    )
}
