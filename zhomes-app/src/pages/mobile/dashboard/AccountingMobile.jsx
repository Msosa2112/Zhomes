import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, PieChart, Users, Calendar, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Receipt, Building } from 'lucide-react'
import './AccountingMobile.css'

const MONTHS_DATA = [
    { month: 'Mar 2026', revenue: 42500, expenses: 8200, net: 34300, deals: 5 },
    { month: 'Feb 2026', revenue: 38700, expenses: 7800, net: 30900, deals: 4 },
    { month: 'Ene 2026', revenue: 29400, expenses: 7500, net: 21900, deals: 3 },
    { month: 'Dic 2025', revenue: 51200, expenses: 9100, net: 42100, deals: 6 },
]

const TRANSACTIONS = [
    { id: 1, type: 'income', description: 'Comisión - 4132 Craig Ave', agent: 'Jessica Hernandez', agentAvatar: '/assets/agents/Jessica Hernandez.png', amount: 5250, date: '2026-03-25', salePrice: 175000, commRate: 3, split: { agent: 70, broker: 30 }, agentNet: 3675, brokerNet: 1575, category: 'Comisión Compra' },
    { id: 2, type: 'income', description: 'Comisión - 220 River Rd', agent: 'Miriam C Castaño', agentAvatar: '/assets/agents/Miriam Castano.png', amount: 13485, date: '2026-03-22', salePrice: 449500, commRate: 3, split: { agent: 70, broker: 30 }, agentNet: 9440, brokerNet: 4046, category: 'Comisión Venta' },
    { id: 3, type: 'income', description: 'Comisión - 3744 Springhurst', agent: 'Judith N Gonzalez', agentAvatar: '/assets/agents/Judith Gonzalez.png', amount: 10350, date: '2026-03-18', salePrice: 345000, commRate: 3, split: { agent: 65, broker: 35 }, agentNet: 6728, brokerNet: 3623, category: 'Comisión Compra' },
    { id: 4, type: 'expense', description: 'E&O Insurance - Mensual', agent: null, agentAvatar: null, amount: -450, date: '2026-03-15', salePrice: null, commRate: null, split: null, agentNet: null, brokerNet: null, category: 'Seguro' },
    { id: 5, type: 'expense', description: 'MLS Fees - Greater Louisville', agent: null, agentAvatar: null, amount: -285, date: '2026-03-10', salePrice: null, commRate: null, split: null, agentNet: null, brokerNet: null, category: 'MLS' },
    { id: 6, type: 'expense', description: 'Spark API - Mensual', agent: null, agentAvatar: null, amount: -150, date: '2026-03-08', salePrice: null, commRate: null, split: null, agentNet: null, brokerNet: null, category: 'Tecnología' },
    { id: 7, type: 'income', description: 'Comisión - 9320 Galene Dr', agent: 'Rocio Martinez', agentAvatar: '/assets/agents/Rocio Martinez.png', amount: 5970, date: '2026-03-05', salePrice: 199000, commRate: 3, split: { agent: 70, broker: 30 }, agentNet: 4179, brokerNet: 1791, category: 'Comisión Venta' },
    { id: 8, type: 'expense', description: 'Oficina - Alquiler Marzo', agent: null, agentAvatar: null, amount: -2800, date: '2026-03-01', salePrice: null, commRate: null, split: null, agentNet: null, brokerNet: null, category: 'Oficina' },
]

const AGENT_SPLITS = [
    { agent: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png', deals: 2, grossComm: 5250, split: '70/30', agentNet: 3675, brokerNet: 1575 },
    { agent: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', deals: 1, grossComm: 13485, split: '70/30', agentNet: 9440, brokerNet: 4046 },
    { agent: 'Judith N Gonzalez', avatar: '/assets/agents/Judith Gonzalez.png', deals: 1, grossComm: 10350, split: '65/35', agentNet: 6728, brokerNet: 3623 },
    { agent: 'Rocio Martinez', avatar: '/assets/agents/Rocio Martinez.png', deals: 1, grossComm: 5970, split: '70/30', agentNet: 4179, brokerNet: 1791 },
]

export default function AccountingMobile() {
    const [view, setView] = useState('overview') // 'overview' | 'transactions' | 'splits'
    const [period, setPeriod] = useState('month')

    const totalIncome = TRANSACTIONS.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const totalExpenses = Math.abs(TRANSACTIONS.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0))
    const netIncome = totalIncome - totalExpenses
    const brokerTotal = TRANSACTIONS.filter(t => t.brokerNet).reduce((a, t) => a + t.brokerNet, 0)

    return (
        <div className="accounting-page">
            <div className="accounting-header">
                <h1>Contabilidad</h1>
                <div className="accounting-period-tabs">
                    <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mes</button>
                    <button className={period === 'quarter' ? 'active' : ''} onClick={() => setPeriod('quarter')}>Trim</button>
                    <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Año</button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="acc-main-kpi">
                <div className="acc-kpi-large">
                    <span>Ingreso Neto (Broker)</span>
                    <strong className="acc-net-positive">${brokerTotal.toLocaleString()}</strong>
                    <span className="acc-trend positive"><ArrowUpRight size={14} /> +18% vs mes anterior</span>
                </div>
            </div>

            <div className="acc-kpi-row">
                <div className="acc-kpi">
                    <TrendingUp size={14} className="acc-icon-green" />
                    <strong>${totalIncome.toLocaleString()}</strong>
                    <span>Ingresos</span>
                </div>
                <div className="acc-kpi">
                    <TrendingDown size={14} className="acc-icon-red" />
                    <strong>${totalExpenses.toLocaleString()}</strong>
                    <span>Gastos</span>
                </div>
                <div className="acc-kpi">
                    <PieChart size={14} className="acc-icon-blue" />
                    <strong>{TRANSACTIONS.filter(t => t.type === 'income').length}</strong>
                    <span>Cierres</span>
                </div>
            </div>

            {/* View Toggle */}
            <div className="crm-view-toggle" style={{ marginTop: '8px' }}>
                <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>Resumen</button>
                <button className={view === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')}>Movimientos</button>
                <button className={view === 'splits' ? 'active' : ''} onClick={() => setView('splits')}>Splits</button>
            </div>

            {view === 'overview' && (
                <>
                    {/* Monthly Breakdown */}
                    <div className="acc-section">
                        <h3>Historial Mensual</h3>
                        {MONTHS_DATA.map((m, idx) => (
                            <div key={m.month} className="acc-month-row animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="acc-month-info">
                                    <strong>{m.month}</strong>
                                    <span>{m.deals} cierres</span>
                                </div>
                                <div className="acc-month-bars">
                                    <div className="acc-bar-wrap">
                                        <div className="acc-bar income" style={{ width: `${(m.revenue / 55000) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="acc-month-amounts">
                                    <span className="acc-income">+${(m.revenue / 1000).toFixed(1)}K</span>
                                    <span className="acc-expense">-${(m.expenses / 1000).toFixed(1)}K</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expense Breakdown */}
                    <div className="acc-section">
                        <h3>Desglose de Gastos</h3>
                        <div className="acc-expense-list">
                            {[
                                { cat: 'Oficina', amount: 2800, color: 'var(--text-secondary)', pct: 34 },
                                { cat: 'Seguro E&O', amount: 450, color: 'var(--text-secondary)', pct: 5 },
                                { cat: 'MLS Fees', amount: 285, color: 'var(--text-secondary)', pct: 3 },
                                { cat: 'Tecnología', amount: 150, color: '#10B981', pct: 2 },
                            ].map(exp => (
                                <div key={exp.cat} className="acc-expense-row">
                                    <div className="acc-exp-dot" style={{ background: exp.color }} />
                                    <span className="acc-exp-name">{exp.cat}</span>
                                    <div className="acc-exp-bar"><div style={{ width: `${exp.pct}%`, background: exp.color }} /></div>
                                    <span className="acc-exp-amount">${exp.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {view === 'transactions' && (
                <div className="acc-section">
                    <h3>Movimientos de Marzo</h3>
                    {TRANSACTIONS.map((t, idx) => (
                        <div key={t.id} className="acc-tx-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.04}s` }}>
                            <div className="acc-tx-icon" style={{ background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                {t.type === 'income' ? <ArrowUpRight size={16} color="#10B981" /> : <ArrowDownRight size={16} color="var(--zhomes-red)" />}
                            </div>
                            <div className="acc-tx-info">
                                <strong>{t.description}</strong>
                                <span>{t.date} · {t.category}</span>
                                {t.agent && (
                                    <span className="acc-tx-agent">
                                        <img src={t.agentAvatar} alt="" />
                                        {t.agent.split(' ')[0]}
                                        {t.split && ` · Split ${t.split.agent}/${t.split.broker}`}
                                    </span>
                                )}
                            </div>
                            <div className={`acc-tx-amount ${t.type}`}>
                                {t.type === 'income' ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'splits' && (
                <div className="acc-section">
                    <h3>Splits por Agente</h3>
                    <p className="acc-splits-subtitle">Distribución de comisiones del mes</p>
                    {AGENT_SPLITS.map((a, idx) => (
                        <div key={a.agent} className="acc-split-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className="acc-split-top">
                                <div className="acc-split-agent">
                                    <img src={a.avatar} alt="" />
                                    <div>
                                        <strong>{a.agent}</strong>
                                        <span>{a.deals} cierres · Split {a.split}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="acc-split-bar-wrap">
                                <div className="acc-split-bar">
                                    <div className="acc-split-agent-fill" style={{ width: `${a.split.split('/')[0]}%` }} />
                                    <div className="acc-split-broker-fill" style={{ width: `${a.split.split('/')[1]}%` }} />
                                </div>
                            </div>
                            <div className="acc-split-amounts">
                                <div className="acc-split-col">
                                    <span>Agente</span>
                                    <strong className="text-green">${a.agentNet.toLocaleString()}</strong>
                                </div>
                                <div className="acc-split-col">
                                    <span>Broker</span>
                                    <strong className="text-blue">${a.brokerNet.toLocaleString()}</strong>
                                </div>
                                <div className="acc-split-col">
                                    <span>Bruto</span>
                                    <strong>${a.grossComm.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Export Button */}
            <button className="acc-export-btn">
                <Download size={16} /> Exportar a QuickBooks
            </button>

            <div style={{ height: '100px' }} />
        </div>
    )
}
