import { useState } from 'react'
import { Star, Home, Award, Phone, MessageCircle, Mail, Sparkles } from 'lucide-react'
import { REALTORS } from '../../data/mockData'
import RealtorRevealModal from '../../components/public/RealtorRevealModal'
import './RealtorsPage.css'

/* ---- ProfileCard cinematográfico (inspirado en Card01) ---- */
function ProfileCard({ realtor, index, onClick }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className={`rp-card animate-fadeInUp delay-${index + 1}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(v => !v)}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            {/* Gradiente de difuminado inferior (se oculta en hover) */}
            <div
                className="rp-card-vignette"
                style={{
                    opacity: isHovered ? 0 : 1,
                    transform: isHovered ? 'translateY(100%)' : 'translateY(0)',
                }}
            />

            {/* Badge Top Producer */}
            {realtor.topProducer && (
                <div className="rp-card-badge">
                    <Award size={11} /> Top Producer
                </div>
            )}

            {/* Foto — portrait → square en hover */}
            <img
                src={realtor.photo}
                alt={realtor.name}
                className="rp-card-img"
                style={{
                    objectFit: 'contain',
                    aspectRatio: isHovered ? '1 / 1' : '2 / 3',
                    objectPosition: isHovered ? '50% 15%' : 'center bottom',
                }}
            />

            {/* Info panel — sube desde abajo en hover */}
            <section
                className="rp-card-info"
                style={{
                    transform: isHovered
                        ? 'translateY(0)'
                        : 'translateY(calc(100% + 2rem))',
                }}
            >
                {/* Nombre */}
                <h3
                    className="rp-card-name"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(-1rem)',
                        transitionDelay: isHovered ? '0.08s' : '0s',
                    }}
                >
                    {realtor.name}
                </h3>

                {/* Título y especialidad */}
                <p
                    className="rp-card-title"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(-0.5rem)',
                        transitionDelay: isHovered ? '0.16s' : '0s',
                    }}
                >
                    {realtor.title} · {realtor.specialty}
                </p>

                {/* Stats + idiomas */}
                <div
                    className="rp-card-meta"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(-0.5rem)',
                        transitionDelay: isHovered ? '0.22s' : '0s',
                    }}
                >
                    <span className="rp-card-stat">
                        <Star size={12} fill="var(--zhomes-gold)" stroke="var(--zhomes-gold)" />
                        {realtor.rating}
                    </span>
                    <span className="rp-card-stat">
                        <Home size={12} />
                        {realtor.sales} ventas
                    </span>
                    <span className="rp-card-stat">
                        {realtor.experience}
                    </span>
                    <span className="rp-card-stat rp-card-langs">
                        {realtor.languages.join(' · ')}
                    </span>
                </div>

                {/* Botones de contacto */}
                <div
                    className="rp-card-actions"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(-0.5rem)',
                        transitionDelay: isHovered ? '0.30s' : '0s',
                    }}
                >
                    <a
                        href={`https://wa.me/${realtor.phone.replace(/\D/g, '')}`}
                        className="rp-action-btn rp-whatsapp"
                        title="WhatsApp"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle size={15} />
                        WhatsApp
                    </a>
                    <a
                        href={`tel:${realtor.phone}`}
                        className="rp-action-btn rp-phone"
                        title="Llamar"
                    >
                        <Phone size={15} />
                    </a>
                    <a
                        href={`mailto:${realtor.email}`}
                        className="rp-action-btn rp-email"
                        title="Email"
                    >
                        <Mail size={15} />
                    </a>
                </div>
            </section>
        </div>
    )
}

/* ---- Página principal ---- */
export default function RealtorsPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [initialIndex, setInitialIndex] = useState(null)

    const handleCardClick = (index) => {
        setInitialIndex(index)
        setModalOpen(true)
    }

    return (
        <div className="realtors-page">
            {/* Hero */}
            <div className="realtors-hero">
                <span className="section-eyebrow animate-fadeInDown">
                    <Sparkles size={14} /> ZHOMES Real Estate
                </span>
                <h1 className="animate-fadeInUp">
                    Nuestro <span className="text-red">Equipo</span>
                </h1>
                <p className="animate-fadeInUp delay-1">
                    Conoce a nuestros agentes expertos en el mercado de Kentucky
                </p>
            </div>

            {/* Grid de cards */}
            <div className="realtors-grid-cin">
                {REALTORS.map((r, i) => (
                    <ProfileCard key={r.id} realtor={r} index={i} onClick={() => handleCardClick(i)} />
                ))}
            </div>

            <RealtorRevealModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialIndex={initialIndex}
                openDirectly={true}
            />
        </div>
    )
}
