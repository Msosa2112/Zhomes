import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, ArrowRight, MapPin, Heart, Star, TrendingUp, Home, DollarSign, Sparkles, ChevronRight, BedDouble, Bath, Maximize, Calculator, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MotionCarousel } from '../../../components/ui/MotionCarousel'
import { useProperties } from '../../../context/PropertyContext'
import { useTranslation } from 'react-i18next'
import AddressAutocomplete from '../../../components/shared/AddressAutocomplete'
import './LandingPageMobile.css'

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
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [demoUser, setDemoUser] = useState(null)

    const CATEGORIES = [
        { id: 'all', label: t('home.categories.all'), icon: '🏠' },
        { id: 'exclusive', label: t('home.categories.exclusive'), icon: '⭐' },
        { id: 'new', label: t('home.categories.new'), icon: '🆕' },
        { id: 'under300', label: t('home.categories.under300'), icon: '💰' },
        { id: 'luxury', label: t('home.categories.luxury'), icon: '👑' },
    ]

    const { properties: globalProperties, loading: ctxLoading } = useProperties()



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
        if (e && e.preventDefault) e.preventDefault()
        navigate(searchQuery.trim() ? `/propiedades?search=${encodeURIComponent(searchQuery)}` : '/propiedades')
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
                <p>{t('home.loading')}</p>
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
                <AddressAutocomplete 
                    value={searchQuery} 
                    onChange={setSearchQuery} 
                    onSelect={(val) => {
                        setSearchQuery(val);
                        navigate(`/propiedades?search=${encodeURIComponent(val)}`);
                    }}
                    placeholder={t('home.searchPlaceholder')} 
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
                        <strong>{t('home.match.title')}</strong>
                        <span>{t('home.match.subtitle')}</span>
                    </div>
                </div>
                <ChevronRight size={20} />
            </Link>

            {/* ─── Tools ─── */}
            <section className="ah-section">
                <div className="ah-section-header">
                    <h2>{t('home.tools.title')}</h2>
                </div>
                <div className="ah-tools">
                    <Link to="/calculadora" className="ah-tool-card">
                        <Calculator size={24} />
                        <strong>{t('home.tools.calculator')}</strong>
                        <span>{t('home.tools.calculatorSub')}</span>
                    </Link>
                    <Link to="/realtors" className="ah-tool-card">
                        <Users size={24} />
                        <strong>{t('home.tools.agents')}</strong>
                        <span>{t('home.tools.agentsSub')}</span>
                    </Link>
                    <Link to="/propiedades" className="ah-tool-card">
                        <TrendingUp size={24} />
                        <strong>{t('home.tools.market')}</strong>
                        <span>{t('home.tools.marketSub')}</span>
                    </Link>
                </div>
            </section>

            {/* ─── Recent Carousel ─── */}
            <section className="ah-section">
                <div className="ah-section-header">
                    <h2>{t('home.recent.title')}</h2>
                    <Link to="/propiedades">{t('home.recent.viewAll')} <ChevronRight size={14} /></Link>
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
                                    {t('home.recent.newBadge')}
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
                    <h2>{CATEGORIES.find(c => c.id === activeCategory)?.label || t('home.categories.properties')}</h2>
                    <span>{filteredByCategory.length} {t('home.results')}</span>
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
                    <span>{t('home.stats.properties')}</span>
                </div>
                <div className="ah-stat">
                    <Star size={20} />
                    <AnimatedCounter target={stats.exclusive} />
                    <span>{t('home.stats.exclusive')}</span>
                </div>
                <div className="ah-stat">
                    <DollarSign size={20} />
                    <AnimatedCounter target={stats.avgPrice} prefix="$" suffix="K" />
                    <span>{t('home.stats.avgPrice')}</span>
                </div>
            </section>



            <div style={{ height: '100px' }} />
        </div>
    )
}
