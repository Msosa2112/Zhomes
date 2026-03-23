import { ArrowRight, MapPin, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPageMobile.css'

export default function LandingPageMobile() {
    return (
        <div className="mobile-landing">
            <header className="mlp-hero">
                <div className="mlp-hero-bg"></div>
                <div className="mlp-hero-content animate-fadeInUp">
                    <h1>Descubre El Hogar Que Mereces</h1>
                    <p>Propiedades exclusivas. Tecnología inteligente. Asesores expertos a tu disposición.</p>
                    <div className="mlp-hero-actions">
                        <Link to="/propiedades" className="mlp-btn-primary">Ver Catálogo <ArrowRight size={18} /></Link>
                    </div>
                </div>
            </header>

            <section className="mlp-stats-section animate-fadeInUp delay-1">
                <div className="mlp-stats-scroll">
                    <div className="mlp-stat-card">
                        <h2>$1.2B+</h2>
                        <p>Volumen en Ventas</p>
                    </div>
                    <div className="mlp-stat-card">
                        <h2>3,500+</h2>
                        <p>Familias Satisfechas</p>
                    </div>
                    <div className="mlp-stat-card">
                        <h2>45+</h2>
                        <p>Asesores Premium</p>
                    </div>
                </div>
            </section>

            <section className="mlp-section">
                <div className="mlp-section-header">
                    <h2>Propiedades Destacadas</h2>
                    <Link to="/propiedades">Ver todas</Link>
                </div>
                <div className="mlp-featured-list">
                    {[1, 2, 3].map(i => (
                        <Link to={`/propiedades/${i}`} key={i} className="mlp-prop-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <img src={`https://images.unsplash.com/photo-${i === 1 ? '1600596542815-ffad4c1539a9' : i === 2 ? '1600585154340-be6161a56a0c' : '1600607687939-ce8a6c25118c'}?w=400`} alt="" className="mlp-prop-img" />
                            <div className="mlp-prop-info">
                                <span className="mlp-prop-price">${i === 1 ? '425,000' : i === 2 ? '289,000' : '567,000'}</span>
                                <h3 className="mlp-prop-addr">{i === 1 ? '8708 Denise Dr' : i === 2 ? '4411 Lambert Rd' : '2215 Tremont Dr'}</h3>
                                <p className="mlp-prop-city"><MapPin size={12} /> Louisville, KY</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="mlp-cta-section">
                <h2>¿Listo para dar el siguiente paso?</h2>
                <p>Nuestros agentes están disponibles 24/7 para asistirte en cada detalle de tu futura inversión.</p>
                <Link to="/realtors" className="mlp-btn-secondary">Conoce al equipo</Link>
            </section>
        </div>
    )
}
