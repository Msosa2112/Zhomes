import { DollarSign, TrendingUp, Clock, CheckCircle2, Download } from 'lucide-react'
import './CommissionsPage.css'

const COMMISSIONS = [
    { id: 1, address: '220 River Rd', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', salePrice: '$899,000', commission: '$13,485', split: '60/40', status: 'paid', date: '2024-10-20' },
    { id: 2, address: '3744 Springhurst Blvd', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', salePrice: '$345,000', commission: '$5,175', split: '50/50', status: 'paid', date: '2024-11-10' },
    { id: 3, address: '1850 Lakewood Hills', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', salePrice: '$715,000', commission: '$10,725', split: '55/45', status: 'approved', date: '—' },
    { id: 4, address: '9320 Galene Dr', realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png', salePrice: '$199,000', commission: '$2,985', split: '50/50', status: 'docs_complete', date: '—' },
    { id: 5, address: '2215 Tremont Dr', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', salePrice: '$567,000', commission: '$8,505', split: '60/40', status: 'pending', date: '—' },
]

const statusMap = {
    paid: { label: 'Pagada', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
    approved: { label: 'Aprobada', color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
    docs_complete: { label: 'Docs Completos', color: 'var(--text-secondary)', bg: 'rgba(245,158,11,0.15)' },
    pending: { label: 'Pendiente', color: 'var(--zhomes-red)', bg: 'rgba(239,68,68,0.15)' },
}

export default function CommissionsPage() {
    return (
        <div className="commissions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Control de Comisiones</h1>
                    <p className="page-subtitle">Gestiona pagos y comisiones de tu equipo.</p>
                </div>
                <button className="btn btn-ghost">
                    <Download size={16} />
                    Exportar CSV
                </button>
            </div>

            <div className="commission-kpis">
                <div className="ck-card animate-fadeInUp">
                    <DollarSign size={20} />
                    <div>
                        <span className="ck-value">$40,875</span>
                        <span className="ck-label">Total Comisiones</span>
                    </div>
                </div>
                <div className="ck-card animate-fadeInUp delay-1">
                    <CheckCircle2 size={20} />
                    <div>
                        <span className="ck-value">$18,660</span>
                        <span className="ck-label">Pagadas</span>
                    </div>
                </div>
                <div className="ck-card animate-fadeInUp delay-2">
                    <Clock size={20} />
                    <div>
                        <span className="ck-value">$22,215</span>
                        <span className="ck-label">Pendientes</span>
                    </div>
                </div>
                <div className="ck-card animate-fadeInUp delay-3">
                    <TrendingUp size={20} />
                    <div>
                        <span className="ck-value">3</span>
                        <span className="ck-label">Por Aprobar</span>
                    </div>
                </div>
            </div>

            <div className="commissions-table">
                <div className="c-table-header">
                    <span>Propiedad</span>
                    <span>Realtor</span>
                    <span>Precio Venta</span>
                    <span>Comisión</span>
                    <span>Split</span>
                    <span>Status</span>
                    <span>Acción</span>
                </div>
                {COMMISSIONS.map((c, i) => (
                    <div key={c.id} className="c-table-row animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <span className="c-address">{c.address}</span>
                        <div className="c-realtor">
                            <img src={c.avatar} alt="" />
                            <span>{c.realtor}</span>
                        </div>
                        <span className="c-price">{c.salePrice}</span>
                        <span className="c-commission">{c.commission}</span>
                        <span className="c-split">{c.split}</span>
                        <span>
                            <span className="c-status" style={{ color: statusMap[c.status].color, background: statusMap[c.status].bg }}>
                                {statusMap[c.status].label}
                            </span>
                        </span>
                        <span>
                            {c.status === 'docs_complete' && <button className="btn btn-gold" style={{ fontSize: '12px', padding: '4px 12px' }}>Aprobar</button>}
                            {c.status === 'approved' && <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}>Pagar</button>}
                            {c.status === 'pending' && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Esperando docs</span>}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
