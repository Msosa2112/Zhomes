import { useState } from 'react'
import { Calendar, Clock, User, Phone, Mail, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import './BookingWidget.css'

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// Generate time slots 9am-5pm
const TIME_SLOTS = Array.from({ length: 8 }, (_, i) => {
  const h = i + 9
  const suffix = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${display}:00 ${suffix}` }
})

export default function BookingWidget({ propertyAddress, realtorName, onBook, onClose }) {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' })
  const [booked, setBooked] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generate calendar days
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const calendarDays = []
  for (let i = 0; i < startPad; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(d)

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  const isDateSelectable = (day) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date >= today && date.getDay() !== 0 // No Sundays
  }

  const isSelected = (day) => {
    if (!selectedDate || !day) return false
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
  }

  const handleDateSelect = (day) => {
    if (!isDateSelectable(day)) return
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const handleConfirm = () => {
    if (onBook) {
      onBook({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        ...formData
      })
    }
    setBooked(true)
  }

  if (booked) {
    return (
      <div className="bw-overlay" onClick={onClose}>
        <div className="bw-modal" onClick={e => e.stopPropagation()}>
          <div className="bw-success">
            <div className="bw-success-circle"><Check size={32} /></div>
            <h3>¡Cita Agendada!</h3>
            <p>{selectedDate.toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p className="bw-success-time">{TIME_SLOTS.find(t => t.value === selectedTime)?.label}</p>
            <p className="bw-success-addr">{propertyAddress}</p>
            <button className="bw-btn primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bw-overlay" onClick={onClose}>
      <div className="bw-modal" onClick={e => e.stopPropagation()}>
        <div className="bw-header">
          <div>
            <h3><Calendar size={18} /> Agendar Visita</h3>
            <p className="bw-subtitle">{propertyAddress}</p>
          </div>
          <button className="bw-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Step indicators */}
        <div className="bw-steps">
          <div className={`bw-step ${step >= 1 ? 'active' : ''}`}>1. Fecha</div>
          <div className={`bw-step ${step >= 2 ? 'active' : ''}`}>2. Hora</div>
          <div className={`bw-step ${step >= 3 ? 'active' : ''}`}>3. Datos</div>
        </div>

        {step === 1 && (
          <div className="bw-calendar">
            <div className="bw-cal-nav">
              <button onClick={prevMonth}><ChevronLeft size={18} /></button>
              <span>{MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button onClick={nextMonth}><ChevronRight size={18} /></button>
            </div>
            <div className="bw-cal-grid">
              {DAYS_ES.map(d => <div key={d} className="bw-cal-header">{d}</div>)}
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`bw-cal-day ${!day ? 'empty' : ''} ${isDateSelectable(day) ? 'selectable' : 'disabled'} ${isSelected(day) ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(day)}
                >
                  {day}
                </div>
              ))}
            </div>
            <button
              className="bw-btn primary"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
            >
              Siguiente →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bw-time-select">
            <p className="bw-selected-date">
              <Calendar size={14} /> {selectedDate.toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="bw-time-grid">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.value}
                  className={`bw-time-btn ${selectedTime === slot.value ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(slot.value)}
                >
                  <Clock size={14} /> {slot.label}
                </button>
              ))}
            </div>
            <div className="bw-nav-btns">
              <button className="bw-btn secondary" onClick={() => setStep(1)}>← Atrás</button>
              <button className="bw-btn primary" disabled={!selectedTime} onClick={() => setStep(3)}>Siguiente →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bw-form">
            <p className="bw-selected-date">
              <Calendar size={14} /> {selectedDate.toLocaleDateString('es-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {TIME_SLOTS.find(t => t.value === selectedTime)?.label}
            </p>
            <div className="bw-input-group">
              <User size={16} />
              <input placeholder="Tu nombre" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="bw-input-group">
              <Phone size={16} />
              <input placeholder="Teléfono" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="bw-input-group">
              <Mail size={16} />
              <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <textarea
              className="bw-textarea"
              placeholder="Notas adicionales (opcional)"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
            <div className="bw-nav-btns">
              <button className="bw-btn secondary" onClick={() => setStep(2)}>← Atrás</button>
              <button
                className="bw-btn primary"
                disabled={!formData.name || !formData.phone}
                onClick={handleConfirm}
              >
                <Check size={16} /> Confirmar
              </button>
            </div>
          </div>
        )}

        {realtorName && <p className="bw-agent-note">Con: {realtorName}</p>}
      </div>
    </div>
  )
}
