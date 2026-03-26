import { useState, useEffect } from 'react'
import { ArrowRight, MapPin, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProperties } from '../../../context/PropertyContext'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './LandingPageMobile.css'

export default function LandingPageMobile() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    const { properties: globalProperties, loading: ctxLoading } = useProperties();

    useEffect(() => {
        if (!ctxLoading) {
            if (globalProperties && globalProperties.length > 0) {
                 setFeatured(globalProperties.slice(0, 3));
            } else {
                 setFeatured(MOCK_PROPERTIES.slice(0, 3));
            }
            setLoading(false);
        }
    }, [globalProperties, ctxLoading]);

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
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Cargando propiedades...</div>
                    ) : featured.map(prop => (
                        <Link to={`/propiedades/${prop.id}`} key={prop.id} className="mlp-prop-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <img src={prop.image} alt={prop.address} className="mlp-prop-img" />
                            <div className="mlp-prop-info">
                                <span className="mlp-prop-price">${Number(prop.price).toLocaleString()}</span>
                                <h3 className="mlp-prop-addr">{prop.address}</h3>
                                <p className="mlp-prop-city"><MapPin size={12} /> {prop.city}</p>
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
