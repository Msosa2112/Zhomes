import { useState } from 'react'
import { Calendar, Clock, MapPin, User, Phone, ChevronRight, Plus, X, Check, XCircle, ChevronLeft, Home, Star, MessageSquare, Navigation } from 'lucide-react'
import './ShowingScheduleMobile.css'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const INITIAL_SHOWINGS = [
    { id: 1, property: '4132 Craig Ave', address: 'Louisville, KY 40216', time: '10:00 AM', date: '2026-03-26', duration: 30, agent: 'Jessica Hernandez', agentAvatar: '/assets/agents/Jessica Hernandez.png', client: 'Rosa Gutiérrez', clientPhone: '(502) 555-0205', status: 'confirmed', feedback: null, price: '$175,000' },
    { id: 2, property: '2215 Tremont Dr', address: 'Louisville, KY 40205', time: '11:30 AM', date: '2026-03-26', duration: 45, agent: 'Miriam C Castaño', agentAvatar: '/assets/agents/Miriam Castano.png', client: 'Carlos Rodríguez', clientPhone: '(502) 555-0202', status: 'pending', feedback: null, price: '$289,000' },
    { id: 3, property: '1045 Oak St', address: 'Louisville, KY 40208', time: '2:00 PM', date: '2026-03-26', duration: 30, agent: 'Judith N Gonzalez', agentAvatar: '/assets/agents/Judith Gonzalez.png', client: 'Ana Martínez', clientPhone: '(502) 555-0203', status: 'confirmed', feedback: null, price: '$225,000' },
    { id: 4, property: '9320 Galene Dr', address: 'Louisville, KY 40229', time: '4:00 PM', date: '2026-03-26', duration: 30, agent: 'Jessica Hernandez', agentAvatar: '/assets/agents/Jessica Hernandez.png', client: 'John Smith', clientPhone: '(502) 555-0204', status: 'confirmed', feedback: null, price: '$345,000' },
    { id: 5, property: '3744 Springhurst Blvd', address: 'Louisville, KY 40241', time: '10:00 AM', date: '2026-03-27', duration: 60, agent: 'Rocio Martinez', agentAvatar: '/assets/agents/Rocio Martinez.png', client: 'Laura Díaz', clientPhone: '(502) 555-0207', status: 'pending', feedback: null, price: '$410,000' },
    { id: 6, property: '220 River Rd', address: 'Louisville, KY 40207', time: '1:00 PM', date: '2026-03-25', duration: 30, agent: 'Miriam C Castaño', agentAvatar: '/assets/agents/Miriam Castano.png', client: 'María López', clientPhone: '(502) 555-0201', status: 'completed', feedback: { liked: true, rating: 4, comment: 'Le encantó el patio, pero quiere ver opciones con garaje' }, price: '$199,000' },
]

const STATUS_MAP = {
    pending: { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    confirmed: { label: 'Confirmado', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    completed: { label: 'Completado', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    cancelled: { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

export default function ShowingScheduleMobile() {
    const [showings, setShowings] = useState(INITIAL_SHOWINGS)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedShowing, setSelectedShowing] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Calendar helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const calendarDays = []
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    for (let i = 0; i < firstDay; i++) calendarDays.push(null)
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

    const formatDate = (d) => {
        const year = currentMonth.getFullYear()
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
        return `${year}-${month}-${String(d).padStart(2, '0')}`
    }

    const getShowingsForDate = (dateStr) => showings.filter(s => s.date === dateStr)
    const todayShowings = getShowingsForDate(selectedDate)

    const updateStatus = (id, status) => {
        setShowings(showings.map(s => s.id === id ? { ...s, status } : s))
        if (selectedShowing?.id === id) setSelectedShowing({ ...selectedShowing, status })
    }

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

    const todayStr = new Date().toISOString().split('T')[0]
    const upcomingCount = showings.filter(s => s.date >= todayStr && s.status !== 'cancelled').length
    const pendingCount = showings.filter(s => s.status === 'pending').length

    return (
        <>
            <div className="showing-page">
                <div className="showing-header">
                    <div className="showing-title-row">
                        <h1>Visitas</h1>
                        <button className="showing-add-btn" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="showing-stats">
                        <div className="showing-stat">
                            <Calendar size={14} />
                            <strong>{upcomingCount}</strong>
                            <span>Próximas</span>
                        </div>
                        <div className="showing-stat warn">
                            <Clock size={14} />
                            <strong>{pendingCount}</strong>
                            <span>Pendientes</span>
                        </div>
                        <div className="showing-stat">
                            <Check size={14} />
                            <strong>{showings.filter(s => s.status === 'completed').length}</strong>
                            <span>Completadas</span>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="showing-calendar">
                    <div className="cal-nav">
                        <button onClick={prevMonth}><ChevronLeft size={18} /></button>
                        <h3>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                        <button onClick={nextMonth}><ChevronRight size={18} /></button>
                    </div>
                    <div className="cal-grid">
                        {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                        {calendarDays.map((day, i) => {
                            if (!day) return <div key={`e${i}`} className="cal-cell empty" />
                            const dateStr = formatDate(day)
                            const count = getShowingsForDate(dateStr).length
                            const isToday = dateStr === todayStr
                            const isSelected = dateStr === selectedDate
                            return (
                                <button
                                    key={i}
                                    className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${count > 0 ? 'has-events' : ''}`}
                                    onClick={() => setSelectedDate(dateStr)}
                                >
                                    <span>{day}</span>
                                    {count > 0 && <div className="cal-dots">{Array(Math.min(count, 3)).fill(0).map((_, j) => <span key={j} className="cal-dot" />)}</div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Day Schedule */}
                <div className="showing-day-section">
                    <h3>{selectedDate === todayStr ? 'Hoy' : new Date(selectedDate + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>

                    {todayShowings.length === 0 ? (
                        <div className="showing-empty">
                            <Calendar size={32} />
                            <p>No hay visitas programadas</p>
                        </div>
                    ) : (
                        <div className="showing-timeline">
                            {todayShowings.sort((a, b) => a.time.localeCompare(b.time)).map((showing, idx) => (
                                <div
                                    key={showing.id}
                                    className={`showing-card animate-fadeInUp`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                    onClick={() => setSelectedShowing(showing)}
                                >
                                    <div className="showing-time-col">
                                        <span className="showing-time">{showing.time}</span>
                                        <span className="showing-duration">{showing.duration}min</span>
                                    </div>
                                    <div className="showing-info-col">
                                        <div className="showing-card-top">
                                            <strong>{showing.property}</strong>
                                            <span className="showing-price">{showing.price}</span>
                                        </div>
                                        <p className="showing-addr">{showing.address}</p>
                                        <div className="showing-card-footer">
                                            <div className="showing-agent-mini">
                                                <img src={showing.agentAvatar} alt="" />
                                                <span>{showing.agent.split(' ')[0]}</span>
                                            </div>
                                            <span className="showing-status" style={{ color: STATUS_MAP[showing.status].color, background: STATUS_MAP[showing.status].bg }}>
                                                {STATUS_MAP[showing.status].label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ height: '100px' }} />
            </div>

            {/* Showing Detail */}
            {selectedShowing && (
                <div className="crm-modal-overlay" onClick={() => setSelectedShowing(null)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>{selectedShowing.property}</h2>
                            <button onClick={() => setSelectedShowing(null)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="showing-detail-banner" style={{ background: STATUS_MAP[selectedShowing.status].bg }}>
                                <span style={{ color: STATUS_MAP[selectedShowing.status].color, fontWeight: 700 }}>
                                    {STATUS_MAP[selectedShowing.status].label}
                                </span>
                                <span>{selectedShowing.date} · {selectedShowing.time} · {selectedShowing.duration}min</span>
                            </div>

                            <div className="crm-detail-section">
                                <h4>Propiedad</h4>
                                <div className="crm-detail-row">
                                    <Home size={16} /> {selectedShowing.property}
                                </div>
                                <div className="crm-detail-row">
                                    <MapPin size={16} /> {selectedShowing.address}
                                </div>
                                <div className="crm-detail-row">
                                    <span style={{ fontWeight: 700, color: 'var(--zhomes-red)' }}>{selectedShowing.price}</span>
                                </div>
                            </div>

                            <div className="crm-detail-section">
                                <h4>Agente</h4>
                                <div className="crm-detail-row">
                                    <img src={selectedShowing.agentAvatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                    <span>{selectedShowing.agent}</span>
                                </div>
                            </div>

                            <div className="crm-detail-section">
                                <h4>Cliente</h4>
                                <div className="crm-detail-row">
                                    <User size={16} /> {selectedShowing.client}
                                </div>
                                <a href={`tel:${selectedShowing.clientPhone}`} className="crm-detail-row clickable">
                                    <Phone size={16} /> {selectedShowing.clientPhone}
                                </a>
                            </div>

                            {selectedShowing.feedback && (
                                <div className="crm-detail-section">
                                    <h4>Feedback Post-Visita</h4>
                                    <div className="showing-feedback-card">
                                        <div className="showing-rating">
                                            {Array(5).fill(0).map((_, i) => (
                                                <Star key={i} size={16} fill={i < selectedShowing.feedback.rating ? '#F59E0B' : 'none'} color={i < selectedShowing.feedback.rating ? '#F59E0B' : 'var(--text-tertiary)'} />
                                            ))}
                                        </div>
                                        <p>{selectedShowing.feedback.comment}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedShowing.status === 'pending' && (
                                <div className="showing-actions">
                                    <button className="showing-action-btn confirm" onClick={() => updateStatus(selectedShowing.id, 'confirmed')}>
                                        <Check size={16} /> Confirmar
                                    </button>
                                    <button className="showing-action-btn cancel" onClick={() => updateStatus(selectedShowing.id, 'cancelled')}>
                                        <XCircle size={16} /> Rechazar
                                    </button>
                                </div>
                            )}
                            {selectedShowing.status === 'confirmed' && (
                                <div className="showing-actions">
                                    <button className="showing-action-btn complete" onClick={() => updateStatus(selectedShowing.id, 'completed')}>
                                        <Check size={16} /> Marcar Completada
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
