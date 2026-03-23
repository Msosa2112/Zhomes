import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, AlertCircle, CheckCircle2, Clock, Info, Upload, FileText, Zap } from 'lucide-react'
import './StackedAlerts.css'

const SPRING = {
    type: 'spring',
    stiffness: 300,
    damping: 26,
}

const getCardVariants = (i) => ({
    collapsed: {
        marginTop: i === 0 ? 0 : -48,
        scaleX: 1 - i * 0.04,
        opacity: i > 2 ? 0 : 1,
    },
    expanded: {
        marginTop: i === 0 ? 0 : 6,
        scaleX: 1,
        opacity: 1,
    },
})

const fadeSwitchTransition = {
    duration: 0.22,
    ease: 'easeInOut',
}

const TYPE_CONFIG = {
    danger: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', icon: AlertCircle },
    warning: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', icon: Clock },
    success: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', icon: CheckCircle2 },
    info: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)', icon: Info },
}

/**
 * StackedAlerts — Stacked notification cards that expand on hover.
 * 
 * Props:
 * - alerts: Array of { type, text, time?, icon? }
 * - title: string (header text, e.g. "Alertas Recientes")
 * - titleIcon: React element (optional icon before title)
 * - variant: 'default' | 'compact' (compact for sidebar)
 * - onViewAll: function (optional callback for "Ver todas")
 */
export default function StackedAlerts({ alerts = [], title = 'Alertas', titleIcon, variant = 'default', onViewAll }) {
    const [isHovered, setIsHovered] = useState(false)

    if (!alerts.length) return null

    return (
        <motion.div
            className={`stacked-alerts ${variant}`}
            initial="collapsed"
            animate={isHovered ? 'expanded' : 'collapsed'}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Cards */}
            <div className="sa-cards">
                {alerts.map((alert, i) => {
                    const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info
                    const Icon = alert.icon || config.icon

                    return (
                        <motion.div
                            key={i}
                            className={`sa-card sa-${alert.type}`}
                            variants={getCardVariants(i)}
                            transition={SPRING}
                            style={{ zIndex: alerts.length - i }}
                        >
                            <div className="sa-card-icon" style={{ color: config.color, background: config.bg }}>
                                <Icon size={16} />
                            </div>
                            <div className="sa-card-body">
                                <p className="sa-card-text">{alert.text}</p>
                                {alert.time && <span className="sa-card-time">{alert.time}</span>}
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="sa-footer">
                <div className="sa-count" style={{ background: alerts.length > 0 ? TYPE_CONFIG[alerts[0].type]?.bg : undefined, color: alerts.length > 0 ? TYPE_CONFIG[alerts[0].type]?.color : undefined }}>
                    {alerts.length}
                </div>
                <span className="sa-footer-text-wrap">
                    <motion.span
                        className="sa-footer-text sa-footer-label"
                        variants={{
                            collapsed: { opacity: 1, y: 0 },
                            expanded: { opacity: 0, y: -14 },
                        }}
                        transition={fadeSwitchTransition}
                    >
                        {titleIcon}{title}
                    </motion.span>
                    <motion.span
                        className="sa-footer-text sa-footer-viewall"
                        variants={{
                            collapsed: { opacity: 0, y: 14 },
                            expanded: { opacity: 1, y: 0 },
                        }}
                        transition={fadeSwitchTransition}
                        onClick={onViewAll}
                    >
                        Ver todas <ArrowUpRight size={14} />
                    </motion.span>
                </span>
            </div>
        </motion.div>
    )
}
