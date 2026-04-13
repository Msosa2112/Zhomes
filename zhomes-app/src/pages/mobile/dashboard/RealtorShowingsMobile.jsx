import { useState } from 'react'
import { Calendar, Plus, Clock, MapPin, User, Phone, ChevronLeft, ChevronRight, Check, X, Star, AlertCircle, MessageSquare, Home } from 'lucide-react'
import './RealtorShowingsMobile.css'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const INITIAL_SHOWINGS = [
    { id: 1, property: '4132 Craig Ave', client: 'María López', clientPhone: '(502) 555-0201', date: '2026-03-26', time: '10:00 AM', duration: 30, status: 'confirmed', notes: 'Primera visita, busca 3BR', feedback: null },
    { id: 2, property: '8708 Denise Dr', client: 'Carlos Rodríguez', clientPhone: '(502) 555-0202', date: '2026-03-26', time: '2:00 PM', duration: 45, status: 'pending', notes: 'Quiere ver el patio y garaje', feedback: null },
    { id: 3, property: '4300 Hillview Ave', client: 'Ana Martínez', clientPhone: '(502) 555-0203', date: '2026-03-27', time: '11:00 AM', duration: 30, status: 'confirmed', notes: 'Pre-aprobada FHA $225K', feedback: null },
    { id: 4, property: '3918 River Park Dr', client: 'John Smith', clientPhone: '(502) 555-0204', date: '2026-03-27', time: '3:30 PM', duration: 60, status: 'pending', notes: 'Busca piscina, mínimo 4BR', feedback: null },
    { id: 5, property: '4215 Vermont Ave', client: 'Rosa Gutiérrez', clientPhone: '(502) 555-0205', date: '2026-03-28', time: '9:00 AM', duration: 30, status: 'confirmed', notes: 'Segunda visita, muy interesada', feedback: null },
    { id: 6, property: '4020 Craig Ave', client: 'Pedro Sánchez', clientPhone: '(502) 555-0206', date: '2026-03-25', time: '10:00 AM', duration: 30, status: 'completed', notes: 'Le encantó', feedback: { rating: 5, interest: 'high', comment: 'Quiere hacer oferta mañana' } },
    { id: 7, property: '4100 Lees Ln', client: 'Laura Díaz', clientPhone: '(502) 555-0207', date: '2026-03-24', time: '4:00 PM', duration: 30, status: 'cancelled', notes: 'Canceló, reagendar', feedback: null },
]

export default function RealtorShowingsMobile() {
    const [showings, setShowings] = useState(INITIAL_SHOWINGS)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedShowing, setSelectedShowing] = useState(null)
    const [showFeedback, setShowFeedback] = useState(null)
    const [newShowing, setNewShowing] = useState({ property: '', client: '', clientPhone: '', date: '', time: '10:00 AM', duration: 30, notes: '' })
    const [feedbackData, setFeedbackData] = useState({ rating: 0, interest: 'medium', comment: '' })

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const selectedStr = selectedDate.toISOString().split('T')[0]

    // Calendar helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

    const hasShowingsOnDay = (day) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return showings.some(s => s.date === dateStr)
    }

    const dayShowings = showings
        .filter(s => s.date === selectedStr)
        .sort((a, b) => a.time.localeCompare(b.time))

    const todayShowings = showings.filter(s => s.date === todayStr && (s.status === 'confirmed' || s.status === 'pending'))
    const upcomingCount = showings.filter(s => s.date >= todayStr && s.status !== 'cancelled' && s.status !== 'completed').length
    const completedCount = showings.filter(s => s.status === 'completed').length
    const pendingCount = showings.filter(s => s.status === 'pending').length

    const statusConfig = {
        pending: { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        confirmed: { label: 'Confirmada', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        completed: { label: 'Completada', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        cancelled: { label: 'Cancelada', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    }

    const addShowing = () => {
        if (!newShowing.property.trim() || !newShowing.client.trim() || !newShowing.date) return
        const showing = { id: Date.now(), ...newShowing, status: 'pending', feedback: null }
        setShowings([showing, ...showings])
        setNewShowing({ property: '', client: '', clientPhone: '', date: '', time: '10:00 AM', duration: 30, notes: '' })
        setShowAddModal(false)
    }

    const updateStatus = (id, status) => {
        setShowings(showings.map(s => s.id === id ? { ...s, status } : s))
        if (selectedShowing?.id === id) setSelectedShowing({ ...selectedShowing, status })
    }

    const submitFeedback = (id) => {
        setShowings(showings.map(s => s.id === id ? { ...s, feedback: feedbackData, status: 'completed' } : s))
        setShowFeedback(null)
        setFeedbackData({ rating: 0, interest: 'medium', comment: '' })
    }

    return (
        <div className="rt-showings-page">
            <div className="rt-show-header">
                <div>
                    <h1>Mis Citas</h1>
                    <p>Agenda de visitas</p>
                </div>
                <button className="rt-show-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Nueva
                </button>
            </div>

            {/* KPIs */}
            <div className="rt-show-kpis">
                <div className="rt-show-kpi">
                    <Calendar size={14} className="rt-kpi-icon blue" />
                    <strong>{todayShowings.length}</strong>
                    <span>Hoy</span>
                </div>
                <div className="rt-show-kpi">
                    <Clock size={14} className="rt-kpi-icon amber" />
                    <strong>{pendingCount}</strong>
                    <span>Pendientes</span>
                </div>
                <div className="rt-show-kpi">
                    <AlertCircle size={14} className="rt-kpi-icon blue" />
                    <strong>{upcomingCount}</strong>
                    <span>Próximas</span>
                </div>
                <div className="rt-show-kpi">
                    <Check size={14} className="rt-kpi-icon green" />
                    <strong>{completedCount}</strong>
                    <span>Hechas</span>
                </div>
            </div>

            {/* Mini Calendar */}
            <div className="rt-show-calendar">
                <div className="rt-cal-nav">
                    <button onClick={prevMonth}><ChevronLeft size={18} /></button>
                    <strong>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</strong>
                    <button onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="rt-cal-days-header">
                    {DAYS.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="rt-cal-grid">
                    {Array(getFirstDayOfMonth(currentMonth)).fill(null).map((_, i) => <div key={`e${i}`} />)}
                    {Array(getDaysInMonth(currentMonth)).fill(null).map((_, i) => {
                        const day = i + 1
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const isSelected = dateStr === selectedStr
                        const isToday = dateStr === todayStr
                        const hasEvents = hasShowingsOnDay(day)
                        return (
                            <button
                                key={day}
                                className={`rt-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                            >
                                {day}
                                {hasEvents && <div className="rt-cal-dot" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Day's Showings */}
            <div className="rt-show-day-section">
                <h3>{selectedStr === todayStr ? 'Hoy' : selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
                {dayShowings.length === 0 && <p className="rt-show-empty">No hay citas para este día</p>}
                {dayShowings.map((s, idx) => {
                    const sc = statusConfig[s.status]
                    return (
                        <div key={s.id} className="rt-show-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => setSelectedShowing(s)}>
                            <div className="rt-show-time-col">
                                <strong>{s.time}</strong>
                                <span>{s.duration} min</span>
                            </div>
                            <div className="rt-show-info-col">
                                <div className="rt-show-property"><Home size={13} /> {s.property}</div>
                                <div className="rt-show-client"><User size={13} /> {s.client}</div>
                                {s.notes && <div className="rt-show-notes">{s.notes}</div>}
                            </div>
                            <div className="rt-show-status" style={{ background: sc.bg, color: sc.color }}>{sc.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Detail Modal */}
            {selectedShowing && (
                <div className="rt-modal-overlay" onClick={() => setSelectedShowing(null)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Detalle de Cita</h2>
                            <button onClick={() => setSelectedShowing(null)}><X size={20} /></button>
                        </div>
                        <div className="rt-modal-body">
                            <div className="rt-detail-row"><Home size={16} /> <strong>{selectedShowing.property}</strong></div>
                            <div className="rt-detail-row"><User size={16} /> {selectedShowing.client}</div>
                            <div className="rt-detail-row"><Phone size={16} /> <a href={`tel:${selectedShowing.clientPhone}`}>{selectedShowing.clientPhone}</a></div>
                            <div className="rt-detail-row"><Calendar size={16} /> {selectedShowing.date} · {selectedShowing.time}</div>
                            <div className="rt-detail-row"><Clock size={16} /> {selectedShowing.duration} minutos</div>
                            {selectedShowing.notes && <div className="rt-detail-notes"><MessageSquare size={14} /> {selectedShowing.notes}</div>}

                            {selectedShowing.feedback && (
                                <div className="rt-feedback-summary">
                                    <h4>Feedback</h4>
                                    <div className="rt-stars">{''.repeat(selectedShowing.feedback.rating)}{''.repeat(5 - selectedShowing.feedback.rating)}</div>
                                    <span className={`rt-interest rt-interest-${selectedShowing.feedback.interest}`}>Interés: {selectedShowing.feedback.interest === 'high' ? 'Alto' : selectedShowing.feedback.interest === 'medium' ? 'Medio' : 'Bajo'}</span>
                                    {selectedShowing.feedback.comment && <p>{selectedShowing.feedback.comment}</p>}
                                </div>
                            )}

                            <div className="rt-detail-actions">
                                {selectedShowing.status === 'pending' && (
                                    <>
                                        <button className="rt-action-btn confirm" onClick={() => updateStatus(selectedShowing.id, 'confirmed')}>
                                            <Check size={16} /> Confirmar
                                        </button>
                                        <button className="rt-action-btn cancel" onClick={() => updateStatus(selectedShowing.id, 'cancelled')}>
                                            <X size={16} /> Cancelar
                                        </button>
                                    </>
                                )}
                                {selectedShowing.status === 'confirmed' && (
                                    <>
                                        <button className="rt-action-btn complete" onClick={() => { setShowFeedback(selectedShowing.id); setSelectedShowing(null) }}>
                                            <Star size={16} /> Completar + Feedback
                                        </button>
                                        <button className="rt-action-btn cancel" onClick={() => updateStatus(selectedShowing.id, 'cancelled')}>
                                            <X size={16} /> Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="rt-modal-overlay" onClick={() => setShowFeedback(null)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Feedback de Visita</h2>
                            <button onClick={() => setShowFeedback(null)}><X size={20} /></button>
                        </div>
                        <div className="rt-modal-body">
                            <div className="rt-form-group">
                                <label>Rating del cliente</label>
                                <div className="rt-star-picker">
                                    {[1,2,3,4,5].map(n => (
                                        <button key={n} className={`rt-star-btn ${feedbackData.rating >= n ? 'active' : ''}`} onClick={() => setFeedbackData({...feedbackData, rating: n})}></button>
                                    ))}
                                </div>
                            </div>
                            <div className="rt-form-group">
                                <label>Nivel de interés</label>
                                <div className="rt-interest-picker">
                                    {['low', 'medium', 'high'].map(l => (
                                        <button key={l} className={`rt-interest-btn ${feedbackData.interest === l ? 'active' : ''}`} onClick={() => setFeedbackData({...feedbackData, interest: l})}>
                                            {l === 'high' ? ' Alto' : l === 'medium' ? ' Medio' : ' Bajo'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="rt-form-group">
                                <label>Comentarios</label>
                                <textarea rows={3} value={feedbackData.comment} onChange={e => setFeedbackData({...feedbackData, comment: e.target.value})} placeholder="¿Qué dijo el cliente? ¿Quiere hacer oferta?" />
                            </div>
                            <button className="rt-submit-btn" onClick={() => submitFeedback(showFeedback)}>
                                <Check size={18} /> Guardar Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Showing Modal */}
            {showAddModal && (
                <div className="rt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Nueva Cita</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="rt-modal-body">
                            <div className="rt-form-group">
                                <label>Propiedad *</label>
                                <input type="text" value={newShowing.property} onChange={e => setNewShowing({...newShowing, property: e.target.value})} placeholder="4132 Craig Ave" />
                            </div>
                            <div className="rt-form-row">
                                <div className="rt-form-group">
                                    <label>Cliente *</label>
                                    <input type="text" value={newShowing.client} onChange={e => setNewShowing({...newShowing, client: e.target.value})} placeholder="María López" />
                                </div>
                                <div className="rt-form-group">
                                    <label>Teléfono</label>
                                    <input type="tel" value={newShowing.clientPhone} onChange={e => setNewShowing({...newShowing, clientPhone: e.target.value})} placeholder="(502) 555-0000" />
                                </div>
                            </div>
                            <div className="rt-form-row">
                                <div className="rt-form-group">
                                    <label>Fecha *</label>
                                    <input type="date" value={newShowing.date} onChange={e => setNewShowing({...newShowing, date: e.target.value})} />
                                </div>
                                <div className="rt-form-group">
                                    <label>Hora</label>
                                    <select value={newShowing.time} onChange={e => setNewShowing({...newShowing, time: e.target.value})}>
                                        {['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="rt-form-group">
                                <label>Duración</label>
                                <select value={newShowing.duration} onChange={e => setNewShowing({...newShowing, duration: parseInt(e.target.value)})}>
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hora</option>
                                </select>
                            </div>
                            <div className="rt-form-group">
                                <label>Notas</label>
                                <textarea rows={2} value={newShowing.notes} onChange={e => setNewShowing({...newShowing, notes: e.target.value})} placeholder="Detalles importantes..." />
                            </div>
                            <button className="rt-submit-btn" onClick={addShowing} disabled={!newShowing.property.trim() || !newShowing.client.trim() || !newShowing.date}>
                                <Plus size={18} /> Crear Cita
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
