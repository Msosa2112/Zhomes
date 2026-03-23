import { useState, useEffect, useRef } from 'react'
import { PartyPopper, Home, User, Calendar, Eye, Star, Share2, X, Key } from 'lucide-react'
import './ClosingCelebration.css'

/**
 * ClosingCelebration — Pantalla cinematográfica de celebración al cerrar una transacción.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - transaction: { address, city, price, image, listDate, daysOnMarket }
 * - realtor: { name, photo, rating, sales }
 * - propertiesViewed: number (cuántas propiedades vio el comprador)
 */

function ConfettiCanvas({ active }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!active) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const colors = ['#E31E24', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4']
        const pieces = []

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: 4 + Math.random() * 8,
                h: 6 + Math.random() * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 3,
                vy: 1.5 + Math.random() * 3,
                opacity: 0.7 + Math.random() * 0.3,
            })
        }

        let animId
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            pieces.forEach(p => {
                p.y += p.vy
                p.x += p.vx
                p.rotation += p.rotSpeed

                if (p.y > canvas.height + 20) {
                    p.y = -20
                    p.x = Math.random() * canvas.width
                }

                ctx.save()
                ctx.globalAlpha = p.opacity
                ctx.translate(p.x, p.y)
                ctx.rotate((p.rotation * Math.PI) / 180)
                ctx.fillStyle = p.color
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
                ctx.restore()
            })

            animId = requestAnimationFrame(animate)
        }

        animate()
        return () => cancelAnimationFrame(animId)
    }, [active])

    return <canvas ref={canvasRef} className="cc-confetti" />
}

export default function ClosingCelebration({ isOpen, onClose, transaction, realtor, propertiesViewed = 8 }) {
    const [phase, setPhase] = useState(0) // 0=intro, 1=confetti+recap, 2=share
    const [rating, setRating] = useState(0)
    const [review, setReview] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setPhase(0)
            setRating(0)
            setReview('')
            return
        }

        // Phase transitions
        const t1 = setTimeout(() => setPhase(1), 2200)
        const t2 = setTimeout(() => setPhase(2), 4500)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [isOpen])

    if (!isOpen || !transaction) return null

    const closeDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    const startDate = new Date(transaction.listDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className={`cc-overlay ${phase >= 0 ? 'active' : ''}`}>
            <ConfettiCanvas active={phase >= 1} />

            <button className="cc-close" onClick={onClose}>
                <X size={24} />
            </button>

            {/* Phase 0: Intro */}
            <div className={`cc-intro ${phase === 0 ? 'visible' : 'hidden'}`}>
                <Key size={48} className="cc-intro-icon" />
                <h1 className="cc-intro-title">¡Felicidades!</h1>
                <p className="cc-intro-sub">Tu transacción ha sido completada</p>
            </div>

            {/* Phase 1+2: Content */}
            <div className={`cc-content ${phase >= 1 ? 'visible' : 'hidden'}`}>
                <div className="cc-card">
                    {/* Property Hero */}
                    <div className="cc-hero">
                        <img src={transaction.image} alt={transaction.address} className="cc-hero-img" />
                        <div className="cc-hero-overlay">
                            <PartyPopper size={28} />
                            <h2>¡Tu Nuevo Hogar!</h2>
                            <p className="cc-hero-address">{transaction.address}</p>
                            <p className="cc-hero-city">{transaction.city}</p>
                        </div>
                    </div>

                    {/* Journey Recap */}
                    <div className="cc-journey">
                        <h3 className="cc-section-title">Tu Journey</h3>
                        <div className="cc-journey-items">
                            <div className="cc-journey-item animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                <Calendar size={18} />
                                <div>
                                    <span className="cc-j-label">Inicio de búsqueda</span>
                                    <span className="cc-j-value">{startDate}</span>
                                </div>
                            </div>
                            <div className="cc-journey-item animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                <Eye size={18} />
                                <div>
                                    <span className="cc-j-label">Propiedades visitadas</span>
                                    <span className="cc-j-value">{propertiesViewed} propiedades</span>
                                </div>
                            </div>
                            <div className="cc-journey-item animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                                <Home size={18} />
                                <div>
                                    <span className="cc-j-label">La elegida</span>
                                    <span className="cc-j-value">{transaction.address}</span>
                                </div>
                            </div>
                            {realtor && (
                                <div className="cc-journey-item animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                                    <User size={18} />
                                    <div>
                                        <span className="cc-j-label">Tu Realtor</span>
                                        <span className="cc-j-value">{realtor.name}</span>
                                    </div>
                                </div>
                            )}
                            <div className="cc-journey-item animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                                <Key size={18} />
                                <div>
                                    <span className="cc-j-label">Fecha de cierre</span>
                                    <span className="cc-j-value cc-j-highlight">{closeDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Realtor Card */}
                    {realtor && (
                        <div className={`cc-realtor ${phase >= 2 ? 'visible' : ''}`}>
                            <img src={realtor.photo} alt={realtor.name} className="cc-realtor-photo" />
                            <div className="cc-realtor-info">
                                <span className="cc-realtor-name">{realtor.name}</span>
                                <span className="cc-realtor-role">Tu Realtor ZHOMES</span>
                            </div>
                        </div>
                    )}

                    {/* Review Section */}
                    <div className={`cc-review ${phase >= 2 ? 'visible' : ''}`}>
                        <h3 className="cc-section-title">¿Cómo fue tu experiencia?</h3>

                        <div className="cc-stars">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    className={`cc-star ${rating >= s ? 'active' : ''}`}
                                    onClick={() => setRating(s)}
                                >
                                    <Star size={28} fill={rating >= s ? '#F59E0B' : 'none'} />
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <div className="cc-review-form animate-fadeInUp">
                                <textarea
                                    placeholder="Cuéntanos sobre tu experiencia con ZHOMES..."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    rows={3}
                                />
                                <button className="btn btn-primary cc-submit-btn">
                                    Enviar Testimonio
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Share Section */}
                    <div className={`cc-share ${phase >= 2 ? 'visible' : ''}`}>
                        <button className="cc-share-btn">
                            <Share2 size={16} />
                            Compartir mi historia
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
