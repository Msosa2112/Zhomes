import { useState, useEffect, useCallback } from 'react'
import {
    Calendar, Clock, MapPin, User, Phone, ChevronRight, Plus, X,
    Check, XCircle, ChevronLeft, Home, Star, MessageSquare,
    Navigation, Loader2, Trash2
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './ShowingScheduleMobile.css'

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const STATUS_MAP = {
    pending:   { label: 'Pendiente',   color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
    confirmed: { label: 'Confirmado',  color: '#10B981', bg: 'var(--bg-secondary)' },
    completed: { label: 'Completado',  color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
    cancelled: { label: 'Cancelado',   color: 'var(--zhomes-red)', bg: 'rgba(228,31,37,0.08)' },
    no_show:   { label: 'No se presentó', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

// Adaptar un row de Supabase al formato del componente
function adaptShowing(row) {
    return {
        id: row.id,
        property: row.property_address || 'Propiedad sin especificar',
        address: row.property_address || '',
        price: row.property_price || '',
        time: row.time_slot?.slice(0, 5) || '',
        date: row.booking_date,
        duration: row.duration_min || 30,
        agent: row.agent_name || 'Sin agente',
        agentAvatar: row.agent_avatar || '/assets/logo/fav.png',
        client: row.client_name,
        clientPhone: row.client_phone,
        status: row.status,
        feedback: null,
    }
}

export default function ShowingScheduleMobile() {
    const [showings, setShowings] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedShowing, setSelectedShowing] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const [newShowing, setNewShowing] = useState({
        client_name: '', client_phone: '', client_email: '',
        property_address: '', property_price: '',
        booking_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00',
        duration_min: 30,
        agent_name: '',
        notes: '',
    })

    // ── Cargar visitas ───────────────────────────────────────
    const fetchShowings = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('booking_date', { ascending: true })
            .order('time_slot', { ascending: true })
        if (!error) setShowings((data || []).map(adaptShowing))
        setLoading(false)
    }, [])

    useEffect(() => { fetchShowings() }, [fetchShowings])

    // ── Calendar helpers ─────────────────────────────────────
    const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const getFirstDay    = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay()

    const calendarDays = []
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay    = getFirstDay(currentMonth)
    for (let i = 0; i < firstDay; i++) calendarDays.push(null)
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

    const formatDate = (d) => {
        const y = currentMonth.getFullYear()
        const m = String(currentMonth.getMonth() + 1).padStart(2, '0')
        return `${y}-${m}-${String(d).padStart(2, '0')}`
    }

    const getShowingsForDate = (dateStr) => showings.filter(s => s.date === dateStr)
    const todayShowings = getShowingsForDate(selectedDate)
    const todayStr = new Date().toISOString().split('T')[0]

    // ── Actualizar status ────────────────────────────────────
    const updateStatus = async (id, status) => {
        const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
        if (!error) {
            setShowings(prev => prev.map(s => s.id === id ? { ...s, status } : s))
            if (selectedShowing?.id === id) setSelectedShowing(prev => ({ ...prev, status }))
        }
    }

    // ── Agregar nueva visita ─────────────────────────────────
    const handleAddShowing = async () => {
        if (!newShowing.client_name || !newShowing.client_phone || !newShowing.property_address) return
        setSaving(true)
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                ...newShowing,
                realtor_id: (await supabase.auth.getSession()).data?.session?.user?.id,
                status: 'pending',
            }])
            .select().single()
        if (!error && data) setShowings(prev => [...prev, adaptShowing(data)])
        setShowAddModal(false)
        setNewShowing({
            client_name: '', client_phone: '', client_email: '',
            property_address: '', property_price: '',
            booking_date: new Date().toISOString().split('T')[0],
            time_slot: '10:00', duration_min: 30, agent_name: '', notes: '',
        })
        setSaving(false)
    }

    // ── Eliminar visita ──────────────────────────────────────
    const handleDelete = async (id) => {
        const { error } = await supabase.from('bookings').delete().eq('id', id)
        if (!error) {
            setShowings(prev => prev.filter(s => s.id !== id))
            setSelectedShowing(null)
        }
    }

    const upcomingCount = showings.filter(s => s.date >= todayStr && s.status !== 'cancelled').length
    const pendingCount  = showings.filter(s => s.status === 'pending').length

    if (loading) {
        return (
            <div className="showing-page">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Cargando agenda...</p>
                </div>
            </div>
        )
    }

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
                    <div className="showing-stats">
                        <div className="showing-stat"><Calendar size={14} /><strong>{upcomingCount}</strong><span>Próximas</span></div>
                        <div className="showing-stat warn"><Clock size={14} /><strong>{pendingCount}</strong><span>Pendientes</span></div>
                        <div className="showing-stat"><Check size={14} /><strong>{showings.filter(s => s.status === 'completed').length}</strong><span>Completadas</span></div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="showing-calendar">
                    <div className="cal-nav">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeft size={18} /></button>
                        <h3>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRight size={18} /></button>
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
                                    {count > 0 && (
                                        <div className="cal-dots">
                                            {Array(Math.min(count, 3)).fill(0).map((_, j) => <span key={j} className="cal-dot" />)}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Day Schedule */}
                <div className="showing-day-section">
                    <h3>
                        {selectedDate === todayStr
                            ? 'Hoy'
                            : new Date(selectedDate + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h3>
                    {todayShowings.length === 0 ? (
                        <div className="showing-empty">
                            <Calendar size={32} />
                            <p>No hay visitas programadas</p>
                            <button className="showing-add-inline" onClick={() => {
                                setNewShowing(prev => ({ ...prev, booking_date: selectedDate }))
                                setShowAddModal(true)
                            }}>
                                <Plus size={14} /> Agendar visita para este día
                            </button>
                        </div>
                    ) : (
                        <div className="showing-timeline">
                            {todayShowings.sort((a, b) => a.time.localeCompare(b.time)).map((showing, idx) => (
                                <div
                                    key={showing.id}
                                    className="showing-card animate-fadeInUp"
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
                                            {showing.price && <span className="showing-price">{showing.price}</span>}
                                        </div>
                                        <p className="showing-addr">{showing.address}</p>
                                        <div className="showing-card-footer">
                                            <div className="showing-agent-mini">
                                                <img src={showing.agentAvatar} alt="" onError={e => { e.target.style.display='none' }} />
                                                <span>{showing.agent.split(' ')[0]}</span>
                                            </div>
                                            <span className="showing-status" style={{ color: STATUS_MAP[showing.status]?.color, background: STATUS_MAP[showing.status]?.bg }}>
                                                {STATUS_MAP[showing.status]?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ height: 100 }} />
            </div>

            {/* Showing Detail Modal */}
            {selectedShowing && (
                <div className="crm-modal-overlay" onClick={() => setSelectedShowing(null)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>{selectedShowing.property}</h2>
                            <button onClick={() => setSelectedShowing(null)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="showing-detail-banner" style={{ background: STATUS_MAP[selectedShowing.status]?.bg }}>
                                <span style={{ color: STATUS_MAP[selectedShowing.status]?.color, fontWeight: 700 }}>
                                    {STATUS_MAP[selectedShowing.status]?.label}
                                </span>
                                <span>{selectedShowing.date} · {selectedShowing.time} · {selectedShowing.duration}min</span>
                            </div>
                            <div className="crm-detail-section">
                                <h4>Propiedad</h4>
                                <div className="crm-detail-row"><Home size={16} /> {selectedShowing.property}</div>
                                {selectedShowing.price && (
                                    <div className="crm-detail-row"><span style={{ fontWeight: 700, color: 'var(--zhomes-red)' }}>{selectedShowing.price}</span></div>
                                )}
                            </div>
                            <div className="crm-detail-section">
                                <h4>Agente</h4>
                                <div className="crm-detail-row"><User size={16} /> {selectedShowing.agent}</div>
                            </div>
                            <div className="crm-detail-section">
                                <h4>Cliente</h4>
                                <div className="crm-detail-row"><User size={16} /> {selectedShowing.client}</div>
                                {selectedShowing.clientPhone && (
                                    <a href={`tel:${selectedShowing.clientPhone}`} className="crm-detail-row clickable">
                                        <Phone size={16} /> {selectedShowing.clientPhone}
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="showing-actions">
                                {selectedShowing.status === 'pending' && (
                                    <>
                                        <button className="showing-action-btn confirm" onClick={() => updateStatus(selectedShowing.id, 'confirmed')}>
                                            <Check size={16} /> Confirmar
                                        </button>
                                        <button className="showing-action-btn cancel" onClick={() => updateStatus(selectedShowing.id, 'cancelled')}>
                                            <XCircle size={16} /> Rechazar
                                        </button>
                                    </>
                                )}
                                {selectedShowing.status === 'confirmed' && (
                                    <button className="showing-action-btn complete" onClick={() => updateStatus(selectedShowing.id, 'completed')}>
                                        <Check size={16} /> Marcar Completada
                                    </button>
                                )}
                            </div>
                            <button
                                style={{ width: '100%', padding: '12px', marginTop: 8, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                onClick={() => { if (window.confirm('¿Eliminar esta visita?')) handleDelete(selectedShowing.id) }}
                            >
                                <Trash2 size={16} /> Eliminar Visita
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Showing Modal */}
            {showAddModal && (
                <div className="crm-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>Nueva Visita</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body form">
                            <label>Cliente *</label>
                            <input type="text" placeholder="Nombre del cliente *" value={newShowing.client_name} onChange={e => setNewShowing({ ...newShowing, client_name: e.target.value })} />
                            <input type="tel" placeholder="Teléfono *" value={newShowing.client_phone} onChange={e => setNewShowing({ ...newShowing, client_phone: e.target.value })} />
                            <input type="email" placeholder="Email" value={newShowing.client_email} onChange={e => setNewShowing({ ...newShowing, client_email: e.target.value })} />

                            <label>Propiedad *</label>
                            <input type="text" placeholder="Dirección de la propiedad *" value={newShowing.property_address} onChange={e => setNewShowing({ ...newShowing, property_address: e.target.value })} />
                            <input type="text" placeholder="Precio (ej. $225,000)" value={newShowing.property_price} onChange={e => setNewShowing({ ...newShowing, property_price: e.target.value })} />

                            <label>Fecha y hora</label>
                            <input type="date" value={newShowing.booking_date} onChange={e => setNewShowing({ ...newShowing, booking_date: e.target.value })} />
                            <input type="time" value={newShowing.time_slot} onChange={e => setNewShowing({ ...newShowing, time_slot: e.target.value })} />
                            <select value={newShowing.duration_min} onChange={e => setNewShowing({ ...newShowing, duration_min: Number(e.target.value) })}>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>1 hora</option>
                                <option value={90}>1.5 horas</option>
                            </select>

                            <label>Agente</label>
                            <input type="text" placeholder="Nombre del agente" value={newShowing.agent_name} onChange={e => setNewShowing({ ...newShowing, agent_name: e.target.value })} />

                            <textarea placeholder="Notas adicionales..." rows={2} value={newShowing.notes} onChange={e => setNewShowing({ ...newShowing, notes: e.target.value })} />

                            <button
                                className="crm-save-btn"
                                onClick={handleAddShowing}
                                disabled={!newShowing.client_name || !newShowing.client_phone || !newShowing.property_address || saving}
                            >
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                {saving ? 'Guardando...' : 'Guardar Visita'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
