import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, ArrowRight, MapPin, Heart, Star, TrendingUp, Home, DollarSign, Sparkles, ChevronRight, BedDouble, Bath, Maximize, Calculator, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MotionCarousel } from '../../../components/ui/MotionCarousel'
import { useProperties } from '../../../context/PropertyContext'
import './LandingPageMobile.css'

const CATEGORIES = [
    { id: 'all', label: 'Todas', icon: '🏠' },
    { id: 'exclusive', label: 'Exclusivas', icon: '⭐' },
    { id: 'new', label: 'Nuevas', icon: '🆕' },
    { id: 'under300', label: 'Bajo $300K', icon: '💰' },
    { id: 'luxury', label: 'Lujo', icon: '👑' },
]

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true
                const duration = 1500
                const steps = 40
                const increment = target / steps
                let current = 0
                const timer = setInterval(() => {
                    current += increment
                    if (current >= target) {
                        setCount(target)
                        clearInterval(timer)
                    } else {
                        setCount(Math.floor(current))
                    }
                }, duration / steps)
            }
        }, { threshold: 0.3 })
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target])

    return <strong ref={ref}>{prefix}{count.toLocaleString()}{suffix}</strong>
}

export default function LandingPageMobile() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [demoUser, setDemoUser] = useState(null)

    const { properties: globalProperties, loading: ctxLoading } = useProperties()

    useEffect(() => {
        const stored = localStorage.getItem('zhomes_demo_user')
        if (stored) {
            try { setDemoUser(JSON.parse(stored)) } catch {}
        }
    }, [])

    const properties = globalProperties || []

    const heroProps = useMemo(() => {
        const excl = properties.filter(p => p.exclusive)
        return excl.length > 0 ? excl.slice(0, 3) : properties.slice(0, 3)
    }, [properties])

    const [heroIdx, setHeroIdx] = useState(0)
    useEffect(() => {
        if (heroProps.length <= 1) return
        const t = setInterval(() => setHeroIdx(i => (i + 1) % heroProps.length), 5000)
        return () => clearInterval(t)
    }, [heroProps.length])

    const recentProps = useMemo(() => properties.slice(0, 10), [properties])

    const filteredByCategory = useMemo(() => {
        if (activeCategory === 'all') return properties.slice(0, 6)
        if (activeCategory === 'exclusive') return properties.filter(p => p.exclusive).slice(0, 6)
        if (activeCategory === 'new') return properties.slice(0, 6)
        if (activeCategory === 'under300') return properties.filter(p => p.price < 300000).slice(0, 6)
        if (activeCategory === 'luxury') return properties.filter(p => p.price >= 500000).slice(0, 6)
        return properties.slice(0, 6)
    }, [properties, activeCategory])

    const handleSearch = (e) => {
        e.preventDefault()
        navigate(searchQuery.trim() ? `/propiedades?q=${encodeURIComponent(searchQuery)}` : '/propiedades')
    }

    const stats = useMemo(() => ({
        total: properties.length,
        exclusive: properties.filter(p => p.exclusive).length,
        avgPrice: properties.length > 0 ? Math.round(properties.reduce((a, p) => a + (p.price || 0), 0) / properties.length / 1000) : 0,
    }), [properties])

    if (ctxLoading) {
        return (
            <div className="landing-loading">
                <img src="/assets/logo/fav.png" alt="Z" className="landing-loading-logo" />
                <p>Cargando propiedades...</p>
            </div>
        )
    }

    const heroProperty = heroProps[heroIdx] || heroProps[0]

    return (
        <div className="app-home">
            {/* ─── Immersive Hero ─── */}
            <section className="ah-hero">
                {heroProperty && (
                    <>
                        <div className="ah-hero-imgs">
                            {heroProps.map((p, i) => (
                                <img
                                    key={p.id}
                                    src={p.image}
                                    alt={p.address}
                                    className={`ah-hero-img ${i === heroIdx ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                        <div className="ah-hero-gradient" />

                        <div className="ah-hero-content">
                            <div className="ah-hero-bottom">
                                <span className="ah-hero-price">${Number(heroProperty.price).toLocaleString()}</span>
                                <h2 className="ah-hero-addr">{heroProperty.address}</h2>
                                <div className="ah-hero-meta">
                                    <MapPin size={12} /> {heroProperty.city}
                                    <span>•</span>
                                    {heroProperty.beds} hab
                                    <span>•</span>
                                    {heroProperty.baths} baños
                                </div>
                            </div>

                            {heroProps.length > 1 && (
                                <div className="ah-hero-dots">
                                    {heroProps.map((_, i) => (
                                        <button
                                            key={i}
                                            className={`ah-dot ${i === heroIdx ? 'active' : ''}`}
                                            onClick={() => setHeroIdx(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* ─── Search ─── */}
            <form className="ah-search" onSubmit={handleSearch}>
                <Search size={18} className="ah-search-icon" />
                <input
                    type="text"
                    placeholder="Ciudad, dirección o ZIP..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </form>

            {/* ─── Categories ─── */}
            <section className="ah-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`ah-cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <span>{cat.icon}</span> {cat.label}
                    </button>
                ))}
            </section>

            {/* ─── ZHomes Match CTA ─── */}
            <Link to="/swipe" className="ah-match-cta">
                <div className="ah-match-left">
                    <div className="ah-match-icon-wrap">
                        <Heart size={20} fill="currentColor" />
                    </div>
                    <div>
                        <strong>ZHomes Match</strong>
                        <span>Desliza y encuentra tu hogar ideal</span>
                    </div>
                </div>
                <ChevronRight size={20} />
            </Link>

            {/* ─── Tools ─── */}
            <section className="ah-section">
                <div className="ah-section-header">
                    <h2>Herramientas</h2>
                </div>
                <div className="ah-tools">
                    <Link to="/calculadora" className="ah-tool-card">
                        <Calculator size={24} />
                        <strong>Calculadora</strong>
                        <span>Estima tu hipoteca</span>
                    </Link>
                    <Link to="/realtors" className="ah-tool-card">
                        <Users size={24} />
                        <strong>Agentes</strong>
                        <span>Nuestro equipo</span>
                    </Link>
                    <Link to="/propiedades" className="ah-tool-card">
                        <TrendingUp size={24} />
                        <strong>Mercado</strong>
                        <span>Explorar todo</span>
                    </Link>
                </div>
            </section>

            {/* ─── Recent Carousel ─── */}
            <section className="ah-section">
                <div className="ah-section-header">
                    <h2>Recién Listadas</h2>
                    <Link to="/propiedades">Ver todas <ChevronRight size={14} /></Link>
                </div>
                <MotionCarousel options={{ dragFree: false, containScroll: 'trimSnaps' }}>
                    {recentProps.map(prop => (
                        <Link to={`/propiedades/${prop.id}`} key={prop.id} className="ah-premium-card">
                            <img src={prop.image} alt={prop.address} className="ah-pc-img" />
                            <div className="ah-pc-gradient" />
                            
                            {prop.exclusive ? (
                                <div className="ah-pc-badge">
                                    <Star size={10} fill="currentColor" /> ZHomes
                                </div>
                            ) : (
                                <div className="ah-pc-badge" style={{background: 'rgba(0,0,0,0.5)'}}>
                                    NUEVO
                                </div>
                            )}

                            <div className="ah-pc-info">
                                <h3 className="ah-pc-price">${Number(prop.price).toLocaleString()}</h3>
                                <p className="ah-pc-addr">{prop.address}</p>
                                <span className="ah-pc-meta"><MapPin size={10} /> {prop.city}</span>
                            </div>
                        </Link>
                    ))}
                </MotionCarousel>
            </section>

            {/* ─── Category Results Grid ─── */}
            <section className="ah-section">
                <div className="ah-section-header">
                    <h2>{CATEGORIES.find(c => c.id === activeCategory)?.label || 'Propiedades'}</h2>
                    <span>{filteredByCategory.length} resultados</span>
                </div>
                <div className="ah-grid">
                    {filteredByCategory.map(prop => (
                        <Link to={`/propiedades/${prop.id}`} key={prop.id} className="ah-grid-card">
                            <img src={prop.image} alt={prop.address} className="ah-gc-img" />
                            <div className="ah-gc-info">
                                <strong>${Number(prop.price).toLocaleString()}</strong>
                                <p className="ah-gc-addr">{prop.address}</p>
                                <div className="ah-gc-specs">
                                    <span><BedDouble size={12} /> {prop.beds}</span>
                                    <span><Bath size={12} /> {prop.baths}</span>
                                    <span><Maximize size={12} /> {prop.sqft?.toLocaleString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ─── Animated Stats ─── */}
            <section className="ah-stats">
                <div className="ah-stat">
                    <Home size={20} />
                    <AnimatedCounter target={stats.total} suffix="+" />
                    <span>Propiedades</span>
                </div>
                <div className="ah-stat">
                    <Star size={20} />
                    <AnimatedCounter target={stats.exclusive} />
                    <span>Exclusivas</span>
                </div>
                <div className="ah-stat">
                    <DollarSign size={20} />
                    <AnimatedCounter target={stats.avgPrice} prefix="$" suffix="K" />
                    <span>Precio Medio</span>
                </div>
            </section>



            <div style={{ height: '100px' }} />
        </div>
    )
}
