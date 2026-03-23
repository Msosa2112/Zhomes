import { useState, useEffect } from 'react'
import { ArrowRight, MapPin, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SparkService } from '../../../services/sparkService'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './LandingPageMobile.css'

export default function LandingPageMobile() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SparkService.getActiveListings("PropertyType Eq 'A' And MlsStatus Eq 'Active'", 3)
            .then(data => {
                const results = data.D?.Results;
                if (results && results.length > 0) {
                    setFeatured(results.map(p => ({
                        id: String(p.Id),
                        address: p.StandardFields.UnparsedAddress || 'Dirección no disponible',
                        city: `${p.StandardFields.City || ''}, ${p.StandardFields.StateOrProvince || ''}`,
                        price: p.StandardFields.ListPrice || 0,
                        image: p.StandardFields.Photos?.[0]?.Uri800 || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
                    })));
                } else {
                    throw new Error("No data returned from Spark API");
                }
            })
            .catch(err => {
                console.warn("Spark API Failed (App Pending Approval). Falling back to mock data.", err);
                setFeatured(MOCK_PROPERTIES.slice(0, 3));
            })
            .finally(() => setLoading(false));
    }, []);

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
