import { Brain, TrendingUp, Users, Target, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import './DashboardPageMobile.css'

export default function DashboardPageMobile() {
    return (
        <div className="mobile-dash-page">
            <div className="mobile-dash-header">
                <h2>Hola, Gilbert 👋</h2>
                <p>Aquí tienes el estado de tu agencia.</p>
            </div>

    <div className="mobile-quick-actions">
                <Link to="/comisiones" className="m-quick-btn">
                    <div className="mq-icon"><CheckCircle2 size={24} /></div>
                    <span>Comis</span>
                </Link>
                <Link to="/analytics" className="m-quick-btn">
                    <div className="mq-icon"><TrendingUp size={24} /></div>
                    <span>Analytics</span>
                </Link>
                <Link to="/equipo" className="m-quick-btn">
                    <div className="mq-icon"><Users size={24} /></div>
                    <span>Equipo</span>
                </Link>
            </div>

            <div className="m-ai-widget">
                <div className="mai-head"><Brain size={18} /> ZhomesAI</div>
                <p>El pipeline tiene 3 deals listos para cierre. Te recomiendo revisar urgente los documentos de Tremont Dr.</p>
            </div>

            <div className="m-kpi-scroller">
                <div className="mk-card">
                    <TrendingUp size={20} className="kblue" />
                    <span>Revenue</span>
                    <strong>$1.2M</strong>
                </div>
                <div className="mk-card">
                    <Target size={20} className="kgreen" />
                    <span>Cierres</span>
                    <strong>28</strong>
                </div>
                <div className="mk-card">
                    <Users size={20} className="kviolet" />
                    <span>Agentes</span>
                    <strong>12</strong>
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Ventas Activas (Pipeline)</h3>
                <div className="m-pipeline-list">
                    <div className="m-pipe-row">
                        <span className="pname">Bajo Contrato</span>
                        <div className="pbar"><div style={{ width: '60%', background: '#8B5CF6' }}></div></div>
                        <span className="pcount">5 deals</span>
                    </div>
                    <div className="m-pipe-row">
                        <span className="pname">Inspección</span>
                        <div className="pbar"><div style={{ width: '30%', background: '#F59E0B' }}></div></div>
                        <span className="pcount">3 deals</span>
                    </div>
                    <div className="m-pipe-row">
                        <span className="pname">Pre-Cierre</span>
                        <div className="pbar"><div style={{ width: '15%', background: '#10B981' }}></div></div>
                        <span className="pcount">2 deals</span>
                    </div>
                </div>
            </div>

            <div className="m-dash-section">
                <h3>Alertas <span className="m-badge-red">3</span></h3>
                <div className="m-alerts-list">
                    <div className="m-alert">
                        <AlertCircle size={16} color="#EF4444" />
                        <p>Falta tasación en 2215 Tremont Dr.</p>
                    </div>
                    <div className="m-alert">
                        <AlertCircle size={16} color="#F59E0B" />
                        <p>Documento subido por Miriam C. en espera de revisión.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
