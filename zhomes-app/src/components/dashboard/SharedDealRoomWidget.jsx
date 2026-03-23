import { motion } from 'motion/react'
import { UploadCloud, CheckCircle2 } from 'lucide-react'
import './SharedDealRoomWidget.css'

const STAGES = ['Oferta', 'Aceptada', 'Inspección', 'Cierre']

export default function SharedDealRoomWidget({ currentStageIndex = 2 }) {
    return (
        <div className="sdr-widget glass-card">
            <div className="sdr-header">
                <h2>Estado del Deal</h2>
                <span className="sdr-badge">Activo</span>
            </div>

            <div className="sdr-timeline-wrapper">
                <div className="sdr-timeline-inner">
                    <div className="sdr-tl-bg-line" />

                    <motion.div
                        className="sdr-tl-progress-line"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: currentStageIndex / (STAGES.length - 1) }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />

                    <div className="sdr-tl-nodes">
                        {STAGES.map((stage, idx) => {
                            const isCompleted = idx <= currentStageIndex
                            const isCurrent = idx === currentStageIndex

                            return (
                                <div key={stage} className="sdr-tl-node-col">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            backgroundColor: isCompleted ? 'var(--zhomes-teal, #10b981)' : 'var(--bg-tertiary)',
                                            borderColor: isCompleted ? 'var(--zhomes-teal, #10b981)' : 'var(--border-subtle)',
                                            scale: isCurrent ? 1.15 : 1
                                        }}
                                        className="sdr-tl-node"
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 color="white" size={18} />
                                        ) : (
                                            <div className="sdr-tl-dot" />
                                        )}
                                    </motion.div>
                                    <span className={`sdr-tl-label ${isCompleted ? 'completed' : ''}`}>
                                        {stage}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Secure Docs Dropzone */}
            <div className="sdr-dropzone hover-glow">
                <div className="sdr-dz-icon-wrap">
                    <UploadCloud size={28} />
                </div>
                <h3>Bóveda de Documentos</h3>
                <p>Arrastra tu W-2 o ID aquí, o haz clic para encriptar y subir de forma segura.</p>
            </div>
        </div>
    )
}
