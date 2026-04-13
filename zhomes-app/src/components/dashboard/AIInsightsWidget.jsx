import { useState, useEffect } from 'react'
import { Brain, TrendingUp, Zap, User, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import './AIInsightsWidget.css'

const MOCK_INSIGHTS = [
    { type: 'lead', name: 'Jessy Hernández', score: 94, action: 'Vio 5 casas hoy', time: 'Hace 10m' },
    { type: 'lead', name: 'Carlos Mendoza', score: 88, action: 'Revisó calculadora (Budget: $450k)', time: 'Hace 30m' },
    { type: 'market', title: 'Oportunidad en Highlands', desc: 'Inventario bajó 15%. Momento de vender.', time: 'Hoy' },
    { type: 'task', title: 'Contrato Vence', desc: '123 Main St expira en 48h. Renovar?', time: 'Urgente' }
]

export default function AIInsightsWidget() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="ai-widget glass-card">
            <div className="ai-header">
                <div className="ai-title">
                    <div className="ai-icon-pulse">
                        <Brain size={20} className="text-gold" />
                    </div>
                    <span>ZHOMES Intelligence</span>
                </div>
                <div className="ai-badge">LIVE</div>
            </div>

            {loading ? (
                <div className="ai-loading">
                    <Sparkles className="animate-spin-slow text-gold" size={24} />
                    <p>Analizando 4.2M de puntos de datos...</p>
                </div>
            ) : (
                <div className="ai-content">
                    <div className="ai-section">
                        <h4> Leads Calientes (Top 1%)</h4>
                        {MOCK_INSIGHTS.filter(i => i.type === 'lead').map((lead, idx) => (
                            <motion.div
                                key={idx}
                                className="ai-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="ai-score-ring" style={{ borderColor: lead.score > 90 ? '#10B981' : '#F59E0B' }}>
                                    {lead.score}
                                </div>
                                <div className="ai-info">
                                    <span className="ai-name">{lead.name}</span>
                                    <span className="ai-action">{lead.action}</span>
                                </div>
                                <button className="ai-action-btn"><Zap size={14} /></button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="ai-section">
                        <h4> Predicción de Mercado</h4>
                        <div className="ai-market-pulse">
                            <TrendingUp size={16} className="text-success" />
                            <span>Alta Demanda en 40205 (+12% vs ayer)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
