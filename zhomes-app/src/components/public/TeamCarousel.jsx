import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star, Phone, MessageCircle, Mail, Award, Home, Clock } from 'lucide-react'
import './TeamCarousel.css'

export default function TeamCarousel({
    members = [],
    title = 'NUESTRO EQUIPO',
    cardWidth = 280,
    cardHeight = 400,
    autoPlay = 5000,
    onCardClick,
}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [touchStart, setTouchStart] = useState(0)
    const total = members.length

    const paginate = useCallback((dir) => {
        if (total === 0) return
        setCurrentIndex(prev => (prev + dir + total) % total)
    }, [total])

    // Auto-play
    useEffect(() => {
        if (autoPlay <= 0 || isHovered) return
        const timer = setInterval(() => paginate(1), autoPlay)
        return () => clearInterval(timer)
    }, [autoPlay, isHovered, paginate])

    // Keyboard nav
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') paginate(-1)
            if (e.key === 'ArrowRight') paginate(1)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [paginate])

    // Touch
    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
    const handleTouchEnd = (e) => {
        const diff = touchStart - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) paginate(diff > 0 ? 1 : -1)
    }

    // Position calc
    const getPosition = (index) => {
        let diff = index - currentIndex
        // Wrap around
        if (diff > total / 2) diff -= total
        if (diff < -total / 2) diff += total

        if (diff === 0) return 'center'
        if (diff === 1) return 'right-1'
        if (diff === 2) return 'right-2'
        if (diff === -1) return 'left-1'
        if (diff === -2) return 'left-2'
        return 'hidden'
    }

    const getStyle = (position) => {
        const base = {
            width: cardWidth,
            height: cardHeight,
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -cardWidth / 2,
            marginTop: -cardHeight / 2,
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            borderRadius: 20,
        }

        switch (position) {
            case 'center':
                return { ...base, zIndex: 10, opacity: 1, transform: 'scale(1.1)', filter: 'grayscale(0%)' }
            case 'right-1':
                return { ...base, zIndex: 5, opacity: 0.8, transform: `translateX(${cardWidth * 0.72}px) scale(0.9)`, filter: 'grayscale(100%)' }
            case 'right-2':
                return { ...base, zIndex: 1, opacity: 0.5, transform: `translateX(${cardWidth * 1.35}px) scale(0.78)`, filter: 'grayscale(100%)' }
            case 'left-1':
                return { ...base, zIndex: 5, opacity: 0.8, transform: `translateX(${-cardWidth * 0.72}px) scale(0.9)`, filter: 'grayscale(100%)' }
            case 'left-2':
                return { ...base, zIndex: 1, opacity: 0.5, transform: `translateX(${-cardWidth * 1.35}px) scale(0.78)`, filter: 'grayscale(100%)' }
            default:
                return { ...base, zIndex: 0, opacity: 0, transform: 'scale(0.7)', pointerEvents: 'none' }
        }
    }

    const current = members[currentIndex]

    return (
        <section
            className="team-carousel"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Title */}
            <h2 className="team-carousel-bg-title">{title}</h2>

            {/* Track */}
            <div className="team-carousel-track" style={{ height: cardHeight + 120 }}>
                {/* Arrows */}
                <button className="team-carousel-arrow left" onClick={() => paginate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <button className="team-carousel-arrow right" onClick={() => paginate(1)}>
                    <ChevronRight size={24} />
                </button>

                {/* Cards */}
                <div className="team-carousel-cards">
                    {members.map((member, index) => {
                        const position = getPosition(index)
                        if (position === 'hidden') return null
                        const isCurrent = index === currentIndex
                        return (
                            <div
                                key={member.id}
                                className={`team-card ${isCurrent ? 'active' : ''}`}
                                style={getStyle(position)}
                                onClick={() => {
                                    if (!isCurrent) setCurrentIndex(index)
                                    onCardClick?.(member, index)
                                }}
                            >
                                <img src={member.photo} alt={member.name} className="team-card-img" />
                                {member.topProducer && (
                                    <div className="team-card-badge">
                                        <Award size={11} /> Top Producer
                                    </div>
                                )}
                                {/* Hover overlay with quick stats */}
                                <div className="team-card-overlay">
                                    <div className="team-card-quick">
                                        <span><Star size={12} /> {member.rating}</span>
                                        <span><Home size={12} /> {member.sales}</span>
                                        <span><Clock size={12} /> {member.experience}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Info below */}
            {current && (
                <div className="team-carousel-info" key={current.id}>
                    <h3 className="team-carousel-name">{current.name}</h3>
                    <span className="team-carousel-role">{current.title}</span>
                    <span className="team-carousel-specialty">{current.specialty}</span>
                    <p className="team-carousel-bio">{current.bio}</p>

                    {/* Languages */}
                    <div className="team-carousel-langs">
                        {current.languages?.map((lang, i) => (
                            <span key={i} className="team-lang-tag">{lang}</span>
                        ))}
                    </div>

                    {/* Contact buttons */}
                    <div className="team-carousel-actions">
                        <a href={`https://wa.me/${current.phone?.replace(/\D/g, '')}`} className="team-action-btn whatsapp" target="_blank" rel="noreferrer">
                            <MessageCircle size={16} />
                            WhatsApp
                        </a>
                        <a href={`tel:${current.phone}`} className="team-action-btn phone">
                            <Phone size={16} />
                            Llamar
                        </a>
                        <a href={`mailto:${current.email}`} className="team-action-btn email">
                            <Mail size={16} />
                            Email
                        </a>
                    </div>
                </div>
            )}

            {/* Dots */}
            <div className="team-carousel-dots">
                {members.map((_, i) => (
                    <button
                        key={i}
                        className={`team-dot ${i === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(i)}
                    />
                ))}
            </div>
        </section>
    )
}
