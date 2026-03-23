import { FileText, Search, Filter, Eye, ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import './TransactionsPageMobile.css'

const TRANSACTIONS = [
    { id: 1, address: '8708 Denise Dr', city: 'Louisville, KY', price: '$425,000', status: 'listed', statusLabel: 'Listada', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '3/7', date: '2025-01-15' },
    { id: 2, address: '4411 Lambert Rd', city: 'Louisville, KY', price: '$289,000', status: 'listed', statusLabel: 'Listada', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', docs: '2/7', date: '2025-01-20' },
    { id: 3, address: '2215 Tremont Dr', city: 'Louisville, KY', price: '$567,000', status: 'under_contract', statusLabel: 'Bajo Contrato', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', docs: '5/7', date: '2024-12-18' },
    { id: 4, address: '9320 Galene Dr', city: 'Louisville, KY', price: '$199,000', status: 'inspection', statusLabel: 'Inspección', realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png', docs: '4/7', date: '2024-12-10' },
    { id: 5, address: '1850 Lakewood Hills', city: 'Prospect, KY', price: '$715,000', status: 'pre_close', statusLabel: 'Pre-Cierre', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '6/7', date: '2024-11-22' },
]

const statusColors = {
    listed: '#3B82F6',
    under_contract: '#8B5CF6',
    inspection: '#F59E0B',
    pre_close: '#10B981',
}

export default function TransactionsPageMobile() {
    return (
        <div className="mobile-tx-page">
            <div className="mobile-tx-header">
                <h1>Transacciones</h1>
                <p>Gestiona todas las activas y cerradas.</p>

                <div className="mobile-tx-actions">
                    <div className="mobile-search-mock">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar dirección..." />
                    </div>
                    <button className="mobile-filter-btn"><Filter size={18} /></button>
                </div>
            </div>

            <div className="mobile-tx-list">
                {TRANSACTIONS.map((t, i) => (
                    <Link to="/dashboard/deal" key={t.id} className="mobile-tx-card animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <div className="tx-card-top">
                            <div>
                                <h3>{t.address}</h3>
                                <span className="tx-city"><MapPin size={12} /> {t.city}</span>
                            </div>
                            <span className="tx-price">{t.price}</span>
                        </div>

                        <div className="tx-card-mid">
                            <span className="tx-status" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>
                                {t.statusLabel}
                            </span>
                            <div className="tx-docs">Docs: <strong>{t.docs}</strong></div>
                        </div>

                        <div className="tx-card-bottom">
                            <div className="tx-realtor">
                                <img src={t.avatar} alt="" />
                                <span>{t.realtor}</span>
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
