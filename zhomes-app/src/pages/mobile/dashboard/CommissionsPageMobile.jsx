import { DollarSign, TrendingUp, Clock, CheckCircle2, Download } from 'lucide-react'
import './CommissionsPageMobile.css'

const COMMISSIONS = [
    { id: 1, address: '220 River Rd', realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png', salePrice: '$899,000', commission: '$13,485', status: 'paid', date: '2024-10-20' },
    { id: 2, address: '3744 Springhurst Blvd', realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', salePrice: '$345,000', commission: '$5,175', status: 'paid', date: '2024-11-10' },
    { id: 3, address: '1850 Lakewood Hills', realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png', salePrice: '$715,000', commission: '$10,725', status: 'approved', date: '—' },
    { id: 4, address: '9320 Galene Dr', realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png', salePrice: '$199,000', commission: '$2,985', status: 'docs_complete', date: '—' },
]

const statusMap = {
    paid: { label: 'Pagada', color: '#22C55E' },
    approved: { label: 'Aprobada', color: '#3B82F6' },
    docs_complete: { label: 'Completos', color: '#F59E0B' },
}

export default function CommissionsPageMobile() {
    return (
        <div className="mobile-comm-page">
            <div className="mobile-comm-header">
                <h1>Comisiones</h1>

                {/* Horizontal scrollable KPIs */}
                <div className="mobile-comm-kpis">
                    <div className="m-ck-card active">
                        <DollarSign size={20} />
                        <div><strong>$40.8K</strong><span>Totales</span></div>
                    </div>
                    <div className="m-ck-card">
                        <CheckCircle2 size={20} className="text-green" />
                        <div><strong>$18.6K</strong><span>Pagadas</span></div>
                    </div>
                    <div className="m-ck-card">
                        <TrendingUp size={20} className="text-blue" />
                        <div><strong>3</strong><span>Por Aprobar</span></div>
                    </div>
                </div>
            </div>

            <div className="mobile-comm-list">
                <h2>Historial y Pendientes</h2>
                {COMMISSIONS.map((c, i) => (
                    <div key={c.id} className="mobile-comm-card animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <div className="m-comm-top">
                            <div>
                                <h3 className="m-comm-address">{c.address}</h3>
                                <span className="m-comm-price">Venta: {c.salePrice}</span>
                            </div>
                            <div className="m-comm-amount">{c.commission}</div>
                        </div>

                        <div className="m-comm-bot">
                            <div className="m-comm-agent">
                                <img src={c.avatar} alt="" />
                                <span>{c.realtor}</span>
                            </div>

                            <div className="m-comm-actions">
                                <span className="m-comm-status" style={{ color: statusMap[c.status].color, background: `${statusMap[c.status].color}20` }}>
                                    {statusMap[c.status].label}
                                </span>
                                {c.status === 'docs_complete' && <button className="mobile-btn-gold-sm">Aprobar</button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ height: '90px' }} />
        </div>
    )
}
