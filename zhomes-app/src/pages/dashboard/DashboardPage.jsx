import { TrendingUp, FileText, Users, AlertCircle, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import KanbanPipeline from '../../components/kanban/KanbanPipeline'
import StackedAlerts from '../../components/shared/StackedAlerts'
import AIInsightsWidget from '../../components/dashboard/AIInsightsWidget'
import './DashboardPage.css'

const ALERTS = [
    { type: 'danger', icon: AlertCircle, text: 'Maylin subió documentos del cierre de 4411 Lambert — PENDIENTE REVISIÓN', time: 'Hace 2 horas' },
    { type: 'warning', icon: Clock, text: 'Faltan 3 documentos para cerrar 2215 Tremont Dr', time: 'Hace 5 horas' },
    { type: 'success', icon: CheckCircle2, text: 'Oferta aceptada para 4411 Lambert Ave — Jessica H.', time: 'Hace 1 día' },
    { type: 'info', icon: FileText, text: 'Yurima subió la inspección de 9320 Galene Dr', time: 'Hace 1 día' },
]

export default function DashboardPage() {
    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Centro de Mando</h1>
                    <p className="page-subtitle">Bienvenido, Gilbert. Aquí está el resumen de hoy.</p>
                </div>
            </div>

            {/* AI Insights Widget */}
            <div className="mb-6 animate-fadeInUp">
                <AIInsightsWidget />
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card animate-fadeInUp">
                    <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                        <FileText size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">14</span>
                        <span className="kpi-label">Transacciones Activas</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +3</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-1">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                        <Clock size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">7</span>
                        <span className="kpi-label">Docs Pendientes</span>
                    </div>
                    <span className="kpi-trend down">Urgente</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-2">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">$1.2M</span>
                        <span className="kpi-label">Revenue del Mes</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +18%</span>
                </div>
                <div className="kpi-card animate-fadeInUp delay-3">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 166, 35, 0.15)', color: '#F5A623' }}>
                        <Users size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-value">8</span>
                        <span className="kpi-label">Agentes Activos</span>
                    </div>
                    <span className="kpi-trend up"><ArrowUpRight size={14} /> +1</span>
                </div>
            </div>

            {/* Kanban Pipeline */}
            <KanbanPipeline />

            {/* Alerts */}
            <div className="alerts-section">
                <StackedAlerts
                    alerts={ALERTS}
                    title="Alertas Recientes"
                />
            </div>
        </div >
    )
}
