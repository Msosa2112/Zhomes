import { X, Star, Award, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { REALTORS } from '../../data/mockData'
import './RealtorSelectorModal.css'
import { useState } from 'react'

export default function RealtorSelectorModal({ isOpen, onClose, onSelect }) {
    const [selectedId, setSelectedId] = useState(null)

    if (!isOpen) return null

    const handleConfirm = () => {
        if (selectedId) {
            const realtor = REALTORS.find(r => r.id === selectedId)
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

                <div className="realtors-grid">
                    {REALTORS.map((r, i) => (
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
                                <img src={r.image || r.avatar || `https://ui-avatars.com/api/?name=${r.name}`} alt={r.name} />
                                {selectedId === r.id && <div className="check-badge"><CheckCircle2 size={16} fill="#10B981" color="white" /></div>}
                            </div>
                            <div className="r-info">
                                <h3>{r.name}</h3>
                                <div className="r-stats">
                                    <span><Star size={12} fill="gold" color="gold" /> 5.0</span>
                                    <span>•</span>
                                    <span>{10 + i * 5} Deals</span>
                                </div>
                                <div className="r-tags">
                                    <span className="tag">Español</span>
                                    <span className="tag">Top 1%</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

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
