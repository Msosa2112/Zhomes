import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Users, TrendingUp, Star, MapPin } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import './LandingPage.css'

export default function LandingPage() {
    const { theme } = useTheme()
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        const scrollContainer = document.querySelector('.dashboard-screen')
        if (!scrollContainer) return

        const handleScroll = (e) => {
            setScrollY(e.target.scrollTop)
        }

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
        setScrollY(scrollContainer.scrollTop || 0)

        return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }, [])

    const stats = [
        { value: '150+', label: 'Propiedades Vendidas', icon: Building2 },
        { value: '4', label: 'Realtors Expertos', icon: Users },
        { value: '$45M+', label: 'En Ventas', icon: TrendingUp },
        { value: '4.9★', label: 'Calificación', icon: Star },
    ]

    const featured = [
        {
            image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
            price: '$425,000',
            address: '8708 Denise Dr',
            city: 'Louisville, KY',
            beds: 4, baths: 3, sqft: '2,450',
        },
        {
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
            price: '$289,000',
            address: '4411 Lambert Rd',
            city: 'Louisville, KY',
            beds: 3, baths: 2, sqft: '1,800',
        },
        {
            image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
            price: '$567,000',
            address: '2215 Tremont Dr',
            city: 'Louisville, KY',
            beds: 5, baths: 4, sqft: '3,200',
        },
    ]

    return (
        <div className="landing-page squishy-vibe">
            {/* HERO */}
            <section className="hero-section-squishy">
                <motion.div
                    className="hero-squishy-card"
                    style={{ translateY: scrollY * 0.4, opacity: Math.max(0, 1 - scrollY / 600) }}
                >
                    <div className="hero-content hero-content--centered">
                        <div className="hero-text hero-text--centered">
                            <span className="section-eyebrow animate-fadeInDown squishy-eyebrow">
                                <MapPin size={14} /> Louisville, Kentucky
                            </span>
                            <h1 className="animate-fadeInUp text-slate-800">
                                Tu Hogar Ideal<br />
                                <span className="text-blue-accent">Está Aquí</span>
                            </h1>
                            <p className="animate-fadeInUp delay-2 text-slate-500">
                                ZHOMES conecta familias con las mejores propiedades de Kentucky.
                                Realtors expertos, servicio personalizado, resultados excepcionales.
                            </p>
                            <div className="hero-cta animate-fadeInUp delay-3 mt-4">
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Link to="/vibe" className="btn btn-primary-squishy btn-lg">
                                        <Building2 size={20} />
                                        <span>Buscar Mi Vibra</span>
                                        <ArrowRight size={18} />
                                    </Link>
                                </motion.div>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Link to="/realtors" className="btn btn-ghost-squishy btn-lg">
                                        <Users size={20} />
                                        <span>Nuestros Realtors</span>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* STATS */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className={`stat-card-squishy animate-fadeInUp delay-${i + 1}`}
                            whileHover={{ y: -8, scale: 1.02 }}
                        >
                            <div className="stat-icon-wrapper"><stat.icon size={24} /></div>
                            <span className="stat-number text-blue-accent">{stat.value}</span>
                            <span className="stat-label text-slate-500 font-bold">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FEATURED */}
            <section className="featured-section">
                <div className="section-header">
                    <span className="section-eyebrow squishy-eyebrow">Destacadas</span>
                    <h2 className="text-slate-800">Propiedades <span className="text-blue-accent">Premium</span></h2>
                    <p className="text-slate-500">Las mejores opciones del mercado de Louisville, seleccionadas por nuestros expertos.</p>
                </div>

                <div className="featured-grid">
                    {featured.map((prop, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link to="/propiedades" className={`featured-card-squishy animate-fadeInUp delay-${i + 2}`}>
                                <div className="featured-image-squishy">
                                    <img src={prop.image} alt={prop.address} />
                                    <div className="featured-price-squishy">{prop.price}</div>
                                </div>
                                <div className="featured-info text-slate-800">
                                    <h3>{prop.address}</h3>
                                    <div className="featured-specs text-slate-500">
                                        <span>{prop.beds} hab</span>
                                        <span>·</span>
                                        <span>{prop.baths} baños</span>
                                        <span>·</span>
                                        <span>{prop.sqft} sqft</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section squishy-cta">
                <div className="cta-card-squishy">
                    <h2 className="text-slate-800">¿Listo para encontrar tu hogar?</h2>
                    <p className="text-slate-500">Agenda una consulta gratuita con uno de nuestros realtors expertos.</p>
                    <motion.div whileTap={{ scale: 0.95 }} className="inline-block mt-4">
                        <Link to="/realtors" className="btn btn-primary-squishy btn-lg">
                            <Users size={20} />
                            Elige Tu Realtor
                            <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
