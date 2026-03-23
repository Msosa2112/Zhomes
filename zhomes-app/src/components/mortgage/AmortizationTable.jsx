import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function AmortizationTable({ dataByYear, amortization }) {
    const [expandedYear, setExpandedYear] = useState(null)

    const fmt = (v) => v.toLocaleString('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    })

    if (!dataByYear || dataByYear.length === 0) return null

    return (
        <div className="amort-table-wrap">
            <h3 className="amort-table-title">Tabla de Amortización</h3>
            <div className="amort-table-scroll">
                <table className="amort-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Año</th>
                            <th>Principal</th>
                            <th>Interés</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataByYear.map((yr) => {
                            const isExpanded = expandedYear === yr.year
                            const monthRows = amortization.filter(m => m.year === yr.year)
                            return (
                                <>
                                    <tr
                                        key={`yr-${yr.year}`}
                                        className={`amort-row-year ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => setExpandedYear(isExpanded ? null : yr.year)}
                                    >
                                        <td className="amort-expand-cell">
                                            <ChevronDown
                                                size={14}
                                                className={`amort-chevron ${isExpanded ? 'open' : ''}`}
                                            />
                                        </td>
                                        <td><strong>Año {yr.year}</strong></td>
                                        <td>{fmt(yr.principal)}</td>
                                        <td>{fmt(yr.interest)}</td>
                                        <td>{fmt(yr.balance)}</td>
                                    </tr>
                                    {isExpanded && monthRows.map(m => (
                                        <tr key={`m-${m.month}`} className="amort-row-month">
                                            <td></td>
                                            <td className="amort-month-label">Mes {m.month}</td>
                                            <td>{fmt(m.principal)}</td>
                                            <td>{fmt(m.interest)}</td>
                                            <td>{fmt(m.balance)}</td>
                                        </tr>
                                    ))}
                                </>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
