import { useState } from 'react'
import {
    X, Bell, AlertCircle, CheckCircle2, Clock,
    MessageSquare, Upload
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
        title: 'Buyer Agent Agreement pendiente',
        body: 'Ernesto C. necesita firmar el Buyer Representation Agreement para 220 River Rd.',
        tx: '220 River Rd',
        time: 'Hace 1 hora',
        read: false,
        action: 'Ver Documento',
        icon: Upload,
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
]

const typeColors = {
    urgent: '#EF4444',
    action: '#F59E0B',
    info: '#3B82F6',
    completed: '#10B981',
}

export default function NotificationCenter({ isOpen, onClose }) {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    if (!isOpen) return null

    return (
        <div className={`notif-popup ${isOpen ? 'open' : ''}`}>
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
                            Marcar leídas
                        </button>
                    )}
                    <button className="notif-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Notification list */}
            <div className="notif-list">
                {notifications.length === 0 ? (
                    <div className="notif-empty">
                        <Bell size={24} />
                        <p>No hay notificaciones</p>
                    </div>
                ) : (
                    <div className="notif-items-container">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`notif-item ${n.read ? 'read' : 'unread'} type-${n.type}`}
                                onClick={() => markAsRead(n.id)}
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
                                        {n.tx && <span className="notif-tx"> {n.tx}</span>}
                                    </div>
                                    {n.action && (
                                        <button className="notif-action-btn" style={{ color: typeColors[n.type], borderColor: `${typeColors[n.type]}30`, background: `${typeColors[n.type]}06` }}>
                                            {n.action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

