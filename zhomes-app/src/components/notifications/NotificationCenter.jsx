import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import {
    X, Bell, AlertCircle, CheckCircle2, Clock,
    DollarSign, MessageSquare, Upload, ArrowUpRight
} from 'lucide-react'
import './NotificationCenter.css'

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: 'urgent',
        title: 'Documento rechazado',
        body: 'El contrato de compra-venta de 2215 Tremont Dr fue rechazado por errores en la firma.',
        tx: '2215 Tremont Dr',
        time: 'Hace 10 min',
        read: false,
        action: 'Ver Documento',
        icon: AlertCircle,
    },
    {
        id: 2,
        type: 'action',
        title: 'Nuevo documento subido',
        body: 'Jessica M. subió la inspección de 8708 Denise Dr. Requiere tu aprobación.',
        tx: '8708 Denise Dr',
        time: 'Hace 25 min',
        read: false,
        action: 'Revisar',
        icon: Upload,
    },
    {
        id: 3,
        type: 'action',
        title: 'Comisión pendiente de aprobación',
        body: 'La comisión de $4,500 para Ernesto C. por 220 River Rd está lista para aprobar.',
        tx: '220 River Rd',
        time: 'Hace 1 hora',
        read: false,
        action: 'Aprobar Pago',
        icon: DollarSign,
    },
    {
        id: 4,
        type: 'info',
        title: 'Mensaje nuevo',
        body: 'Maylin R. envió un mensaje en el canal de 4411 Lambert Rd.',
        tx: '4411 Lambert Rd',
        time: 'Hace 2 horas',
        read: false,
        action: 'Ver Mensaje',
        icon: MessageSquare,
    },
    {
        id: 5,
        type: 'completed',
        title: 'Transacción cerrada',
        body: '3744 Springhurst Blvd ha sido marcada como cerrada. Todos los documentos completos.',
        tx: '3744 Springhurst Blvd',
        time: 'Hace 4 horas',
        read: true,
        action: null,
        icon: CheckCircle2,
    },
    {
        id: 6,
        type: 'info',
        title: 'Recordatorio de docs',
        body: 'Faltan 2 documentos para completar 9320 Galene Dr. Han pasado 5 días.',
        tx: '9320 Galene Dr',
        time: 'Ayer',
        read: true,
        action: 'Ver Transacción',
        icon: Clock,
    },
    {
        id: 7,
        type: 'completed',
        title: 'Comisión pagada',
        body: 'Se procesó el pago de $3,200 a Miriam S. por 3744 Springhurst Blvd.',
        tx: '3744 Springhurst Blvd',
        time: 'Ayer',
        read: true,
        action: null,
        icon: DollarSign,
    },
]

const FILTERS = [
    { key: 'all', label: 'Todas' },
    { key: 'urgent', label: '🔴 Urgentes' },
    { key: 'action', label: '🟡 Acción' },
    { key: 'info', label: '🔵 Info' },
    { key: 'completed', label: '✅ Completas' },
]

const typeColors = {
    urgent: '#EF4444',
    action: '#F59E0B',
    info: '#3B82F6',
    completed: '#10B981',
}

const SPRING = {
    type: 'spring',
    stiffness: 300,
    damping: 26,
}

export default function NotificationCenter({ isOpen, onClose }) {
    const [filter, setFilter] = useState('all')
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
    const [isExpanded, setIsExpanded] = useState(false)
    const cardsRef = useRef(null)
    const [collapsedH, setCollapsedH] = useState(140)
    const [fullH, setFullH] = useState(800)

    const filtered = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter)

    const unreadCount = notifications.filter(n => !n.read).length
    const extraCount = Math.max(0, filtered.length - 1)

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    // Measure first card + full scroll height
    useEffect(() => {
        if (cardsRef.current && isOpen) {
            const el = cardsRef.current
            const cards = el.children
            if (cards.length > 0) {
                setCollapsedH(cards[0].offsetHeight)
                setFullH(el.scrollHeight)
            }
        }
    }, [filtered, isOpen])

    if (!isOpen) return null

    return (
        <>
            <div className="notif-overlay" onClick={onClose}></div>
            <div className={`notif-panel ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="notif-header">
                    <div className="notif-header-left">
                        <Bell size={20} />
                        <h2>Notificaciones</h2>
                        {unreadCount > 0 && (
                            <span className="notif-unread-badge">{unreadCount}</span>
                        )}
                    </div>
                    <div className="notif-header-right">
                        {unreadCount > 0 && (
                            <button className="notif-mark-all" onClick={markAllRead}>
                                Marcar todas leídas
                            </button>
                        )}
                        <button className="notif-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="notif-filters">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`notif-filter-btn ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Notification list */}
                <div className="notif-list">
                    {filtered.length === 0 ? (
                        <div className="notif-empty">
                            <Bell size={24} />
                            <p>No hay notificaciones</p>
                        </div>
                    ) : (
                        <div
                            className="notif-stack-container"
                            onMouseEnter={() => setIsExpanded(true)}
                            onMouseLeave={() => setIsExpanded(false)}
                        >
                            {/* Deck wrapper — first card + peek strips behind */}
                            <div className="notif-stack-deck">
                                {/* Real cards — clipped to first card height when collapsed */}
                                <motion.div
                                    className="notif-stack-cards"
                                    ref={cardsRef}
                                    animate={{ height: isExpanded ? fullH : collapsedH }}
                                    transition={SPRING}
                                    style={{ position: 'relative', zIndex: 3 }}
                                >
                                    {filtered.map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            className={`notif-item ${n.read ? 'read' : 'unread'} type-${n.type}`}
                                            onClick={() => markAsRead(n.id)}
                                            transition={SPRING}
                                            style={{ position: 'relative', zIndex: filtered.length - i }}
                                        >
                                            <div className="notif-icon-wrap" style={{ color: typeColors[n.type], background: `${typeColors[n.type]}10` }}>
                                                <n.icon size={18} />
                                            </div>
                                            <div className="notif-content">
                                                <div className="notif-title-row">
                                                    <span className="notif-title">{n.title}</span>
                                                    {!n.read && <span className="notif-dot"></span>}
                                                </div>
                                                <p className="notif-body">{n.body}</p>
                                                <div className="notif-meta">
                                                    <span className="notif-time">{n.time}</span>
                                                    {n.tx && <span className="notif-tx">📍 {n.tx}</span>}
                                                </div>
                                                {n.action && (
                                                    <button className="notif-action-btn" style={{ color: typeColors[n.type], borderColor: `${typeColors[n.type]}30`, background: `${typeColors[n.type]}06` }}>
                                                        {n.action}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Peek strips — thin shadow bars behind the first card */}
                                {extraCount >= 1 && (
                                    <motion.div
                                        className="notif-peek-strip"
                                        animate={{
                                            scaleX: isExpanded ? 1 : 0.94,
                                            opacity: isExpanded ? 0 : 1,
                                            y: isExpanded ? 10 : 0,
                                        }}
                                        transition={SPRING}
                                        style={{ zIndex: 2 }}
                                    />
                                )}
                                {extraCount >= 2 && (
                                    <motion.div
                                        className="notif-peek-strip notif-peek-strip-2"
                                        animate={{
                                            scaleX: isExpanded ? 1 : 0.88,
                                            opacity: isExpanded ? 0 : 0.7,
                                            y: isExpanded ? 10 : 0,
                                        }}
                                        transition={SPRING}
                                        style={{ zIndex: 1 }}
                                    />
                                )}
                            </div>

                            {/* Footer — count badge + toggle text */}
                            <div className="notif-stack-footer">
                                <div className="notif-stack-count">
                                    {filtered.length}
                                </div>
                                <span className="notif-stack-text-wrap">
                                    <motion.span
                                        className="notif-stack-text notif-stack-label"
                                        animate={{ opacity: isExpanded ? 0 : 1, y: isExpanded ? -14 : 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    >
                                        Notificaciones
                                    </motion.span>
                                    <motion.span
                                        className="notif-stack-text notif-stack-viewall"
                                        animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : 14 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    >
                                        Ver todas <ArrowUpRight size={14} />
                                    </motion.span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
