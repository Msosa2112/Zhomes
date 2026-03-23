import { FileText, Search, Filter, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { REALTOR_TRANSACTIONS } from '../../../data/mockData'
import './TransactionsPageMobile.css'

const statusColors = {
    listed: '#3B82F6',
    under_contract: '#8B5CF6',
    inspection: '#F59E0B',
    pre_close: '#10B981',
    closed: '#6B7280'
}

const statusLabels = {
    listed: 'Listada',
    under_contract: 'Bajo Contrato',
    inspection: 'Inspección',
    pre_close: 'Pre-Cierre',
    closed: 'Cierre'
}

export default function RealtorTransactionsMobile() {
    return (
        <div className="mobile-tx-page">
            <div className="mobile-tx-header">
                <h1>Mis Transacciones</h1>
                <p>Gestiona tu pipeline activo y cerrado.</p>

                <div className="mobile-tx-actions">
                    <div className="mobile-search-mock">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar propiedad..." />
                    </div>
                    <button className="mobile-filter-btn"><Filter size={18} /></button>
                </div>
            </div>

            <div className="mobile-tx-list">
                {REALTOR_TRANSACTIONS.map((t, i) => (
                    <Link to="/realtor" key={t.id} className="mobile-tx-card animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <div className="tx-card-top">
                            <div>
                                <h3>{t.address}</h3>
                                <span className="tx-city"><MapPin size={12} /> {t.city}</span>
                            </div>
                            <span className="tx-price">{t.price}</span>
                        </div>

                        <div className="tx-card-mid">
                            <span className="tx-status" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                                {statusLabels[t.status]}
                            </span>
                            <div className="tx-docs">Docs: <strong>{t.documents.filter(d => d.status === 'approved').length}/{t.documents.length}</strong></div>
                        </div>

                        <div className="tx-card-bottom">
                            <div className="tx-realtor">
                                <span>Cliente: <strong>{t.clientName}</strong></span>
                            </div>
                            <span className="tx-date">{t.date}</span>
                        </div>
                    </Link>
                ))}
            </div>
            {/* Espaciador nativo */}
            <div style={{ height: '90px' }} />
        </div>
    )
}
