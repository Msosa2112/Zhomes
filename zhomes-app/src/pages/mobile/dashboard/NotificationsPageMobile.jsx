import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Bell, AlertCircle, CheckCircle2, Clock,
    MessageSquare, Upload
} from 'lucide-react'
import './NotificationsPageMobile.css'

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

export default function NotificationsPageMobile() {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    return (
        <div className="notif-page-wrapper">
            {/* Cabecera Clásica */}
            <div className="notif-page-header">
                <button className="notif-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="notif-page-title-col">
                    <h2>Notificaciones</h2>
                    {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} nuevas</span>}
                </div>
                {unreadCount > 0 ? (
                    <button className="notif-page-markall" onClick={markAllRead}>
                        Marcar leídas
                    </button>
                ) : (
                    <div style={{ width: 60 }}></div> /* Placeholder for balance */
                )}
            </div>

            {/* Lista de Notificaciones */}
            <div className="notif-page-content">
                {notifications.length === 0 ? (
                    <div className="notif-page-empty">
                        <div className="notif-empty-icon">
                            <Bell size={28} />
                        </div>
                        <p>No tienes notificaciones por ahora</p>
                    </div>
                ) : (
                    <div className="notif-page-list">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`notif-card ${n.read ? 'read' : 'unread'}`}
                                onClick={() => markAsRead(n.id)}
                            >
                                <div 
                                    className="notif-card-icon" 
                                    style={{ 
                                        color: typeColors[n.type], 
                                        background: `${typeColors[n.type]}15` 
                                    }}
                                >
                                    <n.icon size={20} />
                                </div>
                                <div className="notif-card-content">
                                    <div className="notif-card-head">
                                        <h3>{n.title}</h3>
                                        <span className="notif-card-time">{n.time}</span>
                                    </div>
                                    <p className="notif-card-body">{n.body}</p>
                                    {n.tx && (
                                        <div className="notif-card-tx">
                                            {n.tx}
                                        </div>
                                    )}
                                    {n.action && (
                                        <button 
                                            className="notif-card-action"
                                            style={{ 
                                                color: typeColors[n.type], 
                                                borderColor: `${typeColors[n.type]}40`,
                                                background: `${typeColors[n.type]}08`
                                            }}
                                        >
                                            {n.action}
                                        </button>
                                    )}
                                </div>
                                {!n.read && <div className="notif-card-dot" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
