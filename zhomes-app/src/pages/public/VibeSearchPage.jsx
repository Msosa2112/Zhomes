import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Coffee, VolumeX, TreePine, Users, MapPin } from 'lucide-react'
import './VibeSearchPage.css'

const QUESTIONS = [
    {
        id: 'sunday',
        question: '¿Cómo pinta tu domingo ideal?',
        options: [
            { id: 'walkable', label: 'Caminar por la ciudad por un café', icon: Coffee },
            { id: 'quiet', label: 'Paz, silencio y un buen libro', icon: VolumeX },
            { id: 'nature', label: 'Senderismo y vitamina D', icon: TreePine },
            { id: 'community', label: 'Barbacoa con la tribu', icon: Users },
        ],
    },
    {
        id: 'space',
        question: 'Si tu casa fuera un moodboard...',
        options: [
            { id: 'minimalist', label: 'Minimalismo y luz natural', icon: MapPin },
            { id: 'cozy', label: 'Acogedora, rústica y cálida', icon: MapPin },
            { id: 'spacious', label: 'Loft abierto: libertad total', icon: MapPin },
        ],
    },
]

export default function VibeSearchPage({ onComplete }) {
    const [step, setStep] = useState(0)
    const [badges, setBadges] = useState([])
    const [direction, setDirection] = useState(1)

    const handleSelect = (optionId) => {
        const newBadges = [...badges, optionId]
        if (step < QUESTIONS.length - 1) {
            setDirection(1)
            setBadges(newBadges)
            setStep(step + 1)
        } else {
            if (onComplete) onComplete(newBadges)
            else alert(`Buscando propiedades con vibes: ${newBadges.join(', ')}`)
        }
    }

    const currentQ = QUESTIONS[step]

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 50 : -50, opacity: 0 }),
    }

    return (
        <div className="vibe-search-wrapper">
            <div className="vibe-search-card glass-card">
                <div className="vs-header">
                    <span className="vs-step">Paso {step + 1} de {QUESTIONS.length}</span>
                    <Search className="vs-icon" />
                </div>

                <div className="vs-container">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="vs-slide"
                        >
                            <h2 className="vs-question">{currentQ.question}</h2>
                            <div className="vs-options">
                                {currentQ.options.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSelect(opt.id)} className="vs-option-btn group">
                                        <div className="vs-opt-icon-wrap">
                                            <opt.icon className="vs-opt-icon" />
                                        </div>
                                        <span className="vs-opt-label">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
