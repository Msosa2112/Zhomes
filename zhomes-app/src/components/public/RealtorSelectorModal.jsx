import { X, Star, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import './RealtorSelectorModal.css'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function RealtorSelectorModal({ isOpen, onClose, onSelect }) {
    const [selectedId, setSelectedId] = useState(null)
    const [realtors, setRealtors] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isOpen) return
        const fetchRealtors = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('zhomes_agents')
                .select('id, full_name, first_name, last_name, email, phone, bio, status')
                .eq('status', 'Active')
                .order('full_name')
            if (error) console.warn('[RealtorSelector] Error:', error.message)
            if (!error && data) setRealtors(data)
            setLoading(false)
        }
        fetchRealtors()
    }, [isOpen])

    if (!isOpen) return null

    const handleConfirm = () => {
        if (selectedId) {
            const realtor = realtors.find(r => r.id === selectedId)
            onSelect(realtor)
        }
    }

    return (
        <motion.div
            className="realtor-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="realtor-modal-container glass-card">
                <button className="btn-close" onClick={onClose}><X size={24} /></button>

                <div className="rm-header">
                    <h2>Elige a tu Advisor</h2>
                    <p>Selecciona quién presentará tu oferta hoy.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Cargando agentes...
                    </div>
                ) : (
                    <div className="realtors-grid">
                        {realtors.map((r, i) => (
                            <motion.div
                                key={r.id}
                                className={`realtor-card-select ${selectedId === r.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(r.id)}
                                whileHover={{ scale: 1.02 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="r-avatar">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.full_name)}&background=E31E24&color=fff&size=200&bold=true`}
                                        alt={r.full_name}
                                    />
                                    {selectedId === r.id && <div className="check-badge"><CheckCircle2 size={16} fill="#10B981" color="white" /></div>}
                                </div>
                                <div className="r-info">
                                    <h3>{r.full_name}</h3>
                                    <div className="r-stats">
                                        <span><Star size={12} fill="gold" color="gold" /> 5.0</span>
                                        <span>•</span>
                                        <span>ZHomes Agent</span>
                                    </div>
                                    <div className="r-tags">
                                        <span className="tag">Español</span>
                                        <span className="tag">Top 1%</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="rm-footer">
                    <button
                        className="btn-confirm-realtor"
                        disabled={!selectedId}
                        onClick={handleConfirm}
                    >
                        Continuar con Oferta
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
