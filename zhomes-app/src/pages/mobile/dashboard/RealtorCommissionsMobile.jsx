import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { REALTOR_COMMISSIONS } from '../../../data/mockData'
import './CommissionsPageMobile.css'

const statusMap = {
    paid: { label: 'Pagada', color: '#22C55E' },
    approved: { label: 'Aprobada', color: '#3B82F6' },
    pending: { label: 'Pendiente', color: '#F59E0B' },
}

export default function RealtorCommissionsMobile() {
    const totalEarned = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.netAmount, 0)
    const totalPending = REALTOR_COMMISSIONS.filter(c => c.status !== 'paid').reduce((acc, c) => acc + c.netAmount, 0)
    
    return (
        <div className="mobile-comm-page">
            <div className="mobile-comm-header">
                <h1>Mis Comisiones</h1>

                <div className="mobile-comm-kpis">
                    <div className="m-ck-card active" style={{flex: '1 1 auto', border: '1px solid var(--zhomes-gold)'}}>
                        <CheckCircle2 size={20} color="var(--zhomes-gold)" />
                        <div><strong>${(totalEarned / 1000).toFixed(1)}K</strong><span>Pagadas (YTD)</span></div>
                    </div>
                    <div className="m-ck-card" style={{flex: '1 1 auto'}}>
                        <Clock size={20} className="text-blue" />
                        <div><strong>${(totalPending / 1000).toFixed(1)}K</strong><span>Pendientes</span></div>
                    </div>
                </div>
            </div>

            <div className="mobile-comm-list">
                <h2>Historial de Comisiones</h2>
                {REALTOR_COMMISSIONS.map((c, i) => (
                    <div key={c.id} className="mobile-comm-card animate-fadeInUp" style={{ animationDelay: `${0.05 * i}s` }}>
                        <div className="m-comm-top">
                            <div>
                                <h3 className="m-comm-address">{c.address}</h3>
                            </div>
                            <div className="m-comm-amount">${c.netAmount.toLocaleString()}</div>
                        </div>

                        <div className="m-comm-bot">
                            <div className="m-comm-agent">
                                <span>Total Venta: <strong>{c.salePrice}</strong></span>
                            </div>

                            <div className="m-comm-actions">
                                <span className="m-comm-status" style={{ color: statusMap[c.status]?.color || '#888', background: `${statusMap[c.status]?.color || '#888'}20` }}>
                                    {statusMap[c.status]?.label || 'Desconocido'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ height: '90px' }} />
        </div>
    )
}
