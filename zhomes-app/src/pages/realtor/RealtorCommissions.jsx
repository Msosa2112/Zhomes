import { DollarSign, TrendingUp, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react'
import { REALTOR_COMMISSIONS } from '../../data/mockData'
import './RealtorCommissions.css'

const STATUS_MAP = {
    paid: { label: 'Pagada', color: '#10B981', icon: CheckCircle2 },
    approved: { label: 'Aprobada', color: '#3B82F6', icon: ArrowUpRight },
    pending: { label: 'Pendiente', color: '#F59E0B', icon: Clock },
}

export default function RealtorCommissions() {
    const totalEarned = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').reduce((s, c) => s + c.netAmount, 0)
    const totalPending = REALTOR_COMMISSIONS.filter(c => c.status !== 'paid').reduce((s, c) => s + c.netAmount, 0)
    const lastPayment = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').sort((a, b) => b.paidDate.localeCompare(a.paidDate))[0]

    return (
        <div className="rc-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mis Comisiones</h1>
                    <p className="page-subtitle">Historial de pagos y comisiones pendientes</p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="rc-summary">
                <div className="rc-summary-card earned">
                    <div className="rc-summary-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className="rc-summary-amount">${totalEarned.toLocaleString()}</span>
                        <span className="rc-summary-label">Total Ganado (Año)</span>
                    </div>
                </div>
                <div className="rc-summary-card pending">
                    <div className="rc-summary-icon">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="rc-summary-amount">${totalPending.toLocaleString()}</span>
                        <span className="rc-summary-label">Pendiente por Cobrar</span>
                    </div>
                </div>
                <div className="rc-summary-card last">
                    <div className="rc-summary-icon">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="rc-summary-amount">${lastPayment?.netAmount.toLocaleString()}</span>
                        <span className="rc-summary-label">Último Pago ({lastPayment?.paidDate})</span>
                    </div>
                </div>
            </div>

            {/* Commissions table */}
            <div className="rc-table-wrap">
                <table className="rc-table">
                    <thead>
                        <tr>
                            <th>Propiedad</th>
                            <th>Precio Venta</th>
                            <th>Com. %</th>
                            <th>Split</th>
                            <th>Comisión Bruta</th>
                            <th>Fee Broker</th>
                            <th>Neto a Recibir</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {REALTOR_COMMISSIONS.map(c => {
                            const st = STATUS_MAP[c.status]
                            return (
                                <tr key={c.id} className={`rc-row ${c.status}`}>
                                    <td className="rc-address">{c.address}</td>
                                    <td>${c.salePrice.toLocaleString()}</td>
                                    <td>{c.commissionPct}%</td>
                                    <td>{c.split}/{100 - c.split}</td>
                                    <td>${c.grossAmount.toLocaleString()}</td>
                                    <td className="rc-fee">-${c.brokerFee.toLocaleString()}</td>
                                    <td className="rc-net">${c.netAmount.toLocaleString()}</td>
                                    <td>
                                        <span className="rc-status-badge" style={{ color: st.color, background: `${st.color}12` }}>
                                            <st.icon size={14} />
                                            {st.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
