import { FileText, Search, Filter, Eye, ChevronRight, MapPin } from 'lucide-react'
import './TransactionsPage.css'

const TRANSACTIONS = [
    { id: 1, address: '8708 Denise Dr', city: 'Louisville, KY', price: '$425,000', status: 'listed', statusLabel: 'Listada', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '3/7', date: '2025-01-15' },
    { id: 2, address: '4411 Lambert Rd', city: 'Louisville, KY', price: '$289,000', status: 'listed', statusLabel: 'Listada', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', docs: '2/7', date: '2025-01-20' },
    { id: 3, address: '2215 Tremont Dr', city: 'Louisville, KY', price: '$567,000', status: 'under_contract', statusLabel: 'Bajo Contrato', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', docs: '5/7', date: '2024-12-18' },
    { id: 4, address: '9320 Galene Dr', city: 'Louisville, KY', price: '$199,000', status: 'inspection', statusLabel: 'Inspección', realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png', docs: '4/7', date: '2024-12-10' },
    { id: 5, address: '1850 Lakewood Hills', city: 'Prospect, KY', price: '$715,000', status: 'pre_close', statusLabel: 'Pre-Cierre', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', docs: '6/7', date: '2024-11-22' },
    { id: 6, address: '3744 Springhurst Blvd', city: 'Louisville, KY', price: '$345,000', status: 'closed', statusLabel: 'Cerrada', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', docs: '7/7', date: '2024-11-05' },
    { id: 7, address: '220 River Rd', city: 'Anchorage, KY', price: '$899,000', status: 'paid', statusLabel: 'Pagada', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', docs: '7/7', date: '2024-10-15' },
]

const statusColors = {
    listed: '#3B82F6',
    under_contract: '#8B5CF6',
    inspection: '#F59E0B',
    appraisal: '#F97316',
    pre_close: '#10B981',
    closed: '#06B6D4',
    paid: '#22C55E',
}

export default function TransactionsPage() {
    return (
        <div className="transactions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transacciones</h1>
                    <p className="page-subtitle">Gestiona todas las transacciones activas y cerradas.</p>
                </div>
                <button className="btn btn-gold">
                    <FileText size={16} />
                    Nueva Transacción
                </button>
            </div>

            <div className="transactions-toolbar">
                <div className="search-box">
                    <Search size={16} />
                    <input type="text" className="input" placeholder="Buscar por dirección o realtor..." />
                </div>
                <button className="btn btn-ghost"><Filter size={14} /> Filtros</button>
            </div>

            <div className="transactions-table">
                <div className="table-header">
                    <span>Propiedad</span>
                    <span>Precio</span>
                    <span>Status</span>
                    <span>Realtor</span>
                    <span>Documentos</span>
                    <span>Fecha</span>
                    <span></span>
                </div>
                {TRANSACTIONS.map((t, i) => (
                    <div key={t.id} className="table-row animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <div className="cell-property">
                            <span className="cell-address">{t.address}</span>
                            <span className="cell-city"><MapPin size={12} />{t.city}</span>
                        </div>
                        <span className="cell-price">{t.price}</span>
                        <span>
                            <span className="status-badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status], borderColor: `${statusColors[t.status]}40` }}>
                                {t.statusLabel}
                            </span>
                        </span>
                        <div className="cell-realtor">
                            <img src={t.avatar} alt="" className="cell-avatar" />
                            <span>{t.realtor}</span>
                        </div>
                        <div className="cell-docs">
                            <div className="docs-bar">
                                <div className="docs-fill" style={{ width: `${(parseInt(t.docs) / 7) * 100}%` }}></div>
                            </div>
                            <span className="docs-text">{t.docs}</span>
                        </div>
                        <span className="cell-date">{t.date}</span>
                        <button className="btn btn-icon btn-ghost"><Eye size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}
