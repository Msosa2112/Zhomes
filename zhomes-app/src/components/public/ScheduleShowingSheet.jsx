import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Calendar as CalendarIcon, Clock, Send, Info } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import './ScheduleShowingSheet.css'

// Helper para generar los próximos 7 días
const getNextDays = () => {
    const days = []
    const date = new Date()
    for (let i = 0; i < 7; i++) {
        const d = new Date(date)
        d.setDate(date.getDate() + i)
        
        // Formato: "Lun, 5 Abr"
        const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
        const monthStr = d.toLocaleDateString('es-ES', { month: 'short' });
        const label = `${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)}, ${d.getDate()} ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}`
        
        // Evitar domingos si es requerido, pero por ahora mostramos todos
        days.push({
            dateObj: d,
            value: d.toISOString().split('T')[0],
            label: i === 0 ? 'Hoy' : (i === 1 ? 'Mañana' : label)
        })
    }
    return days
}

// Helper para generar slots de 30 mins (9 AM a 7:30 PM)
const getTimeSlots = () => {
    const slots = []
    for (let h = 9; h <= 19; h++) {
        for (let m of ['00', '30']) {
            if (h === 19 && m === '30') continue; // Termina 7:00 PM
            const suffix = h >= 12 ? 'PM' : 'AM'
            const displayH = h > 12 ? h - 12 : h
            slots.push(`${displayH}:${m} ${suffix}`)
        }
    }
    return slots
}

export default function ScheduleShowingSheet({ propertyId, activeAgent, onClose }) {
    const [days] = useState(getNextDays())
    const [timeSlots] = useState(getTimeSlots())
    
    const [selectedDate, setSelectedDate] = useState(days[0].value)
    const [selectedTime, setSelectedTime] = useState('')
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Detiene el scroll del fondo cuando el modal esta abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = 'auto' }
    }, [])

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTime) return;
        
        setIsSubmitting(true)
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const { error } = await supabase.from('bookings').insert({
                property_id: propertyId,
                client_id: userId,
                agent_id: activeAgent?.id || null, // Si es null, "se los guarda Gilbert"
                booking_date: selectedDate,
                time_slot: selectedTime,
                status: 'pending_agent_confirmation'
            })
            
            if (error) throw error;
            setIsSuccess(true);
        } catch (err) {
            console.error("Error agendando cita:", err)
            alert("Hubo un error agendando. Intenta de nuevo.");
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div 
                className="sss-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div 
                    className="sss-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sss-handle" />
                    
                    {!isSuccess ? (
                        <>
                            <div className="sss-header">
                                <h3>Agendar Visita Rápida</h3>
                                <button className="sss-close" onClick={onClose}><X size={20}/></button>
                            </div>

                            <p className="sss-section-title">1. ¿Qué día prefieres?</p>
                            <div className="sss-days-row">
                                {days.map(d => (
                                    <button 
                                        key={d.value} 
                                        className={`sss-day-chip ${selectedDate === d.value ? 'active' : ''}`}
                                        onClick={() => setSelectedDate(d.value)}
                                    >
                                        <CalendarIcon size={14} style={{ display: 'inline', marginRight: 6, marginBottom: 2 }}/>
                                        {d.label}
                                    </button>
                                ))}
                            </div>

                            <p className="sss-section-title" autoFocus style={{ marginTop: 24 }}>2. ¿A qué hora?</p>
                            <div className="sss-time-grid">
                                {timeSlots.map(time => (
                                    <button 
                                        key={time} 
                                        className={`sss-time-chip ${selectedTime === time ? 'active' : ''}`}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="sss-submit-btn" 
                                disabled={!selectedDate || !selectedTime || isSubmitting}
                                onClick={handleConfirm}
                            >
                                {isSubmitting ? 'Enviando...' : `Solicitar Visita ${selectedTime ? 'a las ' + selectedTime : ''}`}
                                {!isSubmitting && <Send size={18} />}
                            </button>
                        </>
                    ) : (
                        <div className="sss-success-view">
                            <div className="sss-success-circle">
                                <Clock size={32} />
                            </div>
                            <h3>Solicitud en proceso</h3>
                            
                            <div className="sss-tracker-status">
                                <Info size={24} color="#E31E24" style={{ flexShrink: 0 }} />
                                <p>Solicitud enviada a tu agente. Te confirmaremos en breve si la casa está disponible exactamente a las <strong>{selectedTime}</strong>.</p>
                            </div>

                            <button className="sss-submit-btn" onClick={onClose} style={{ marginTop: 10 }}>
                                Listo, Entendido
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
