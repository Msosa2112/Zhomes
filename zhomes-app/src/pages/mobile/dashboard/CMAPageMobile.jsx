import { useState } from 'react'
import { BarChart3, Home, MapPin, DollarSign, TrendingUp, TrendingDown, Calendar, Download, ChevronRight, Search, Ruler, BedDouble, Bath, Car, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react'
import { useProperties } from '../../../context/PropertyContext'
import './CMAPageMobile.css'

export default function CMAPageMobile() {
    const { properties } = useProperties()
    const [searchAddress, setSearchAddress] = useState('')
    const [showReport, setShowReport] = useState(false)
    const [selectedComp, setSelectedComp] = useState(null)
    const [subjectProperty, setSubjectProperty] = useState(null)
    const [comps, setComps] = useState([])

    const handleAnalyze = () => {
        // En un entorno real, buscaría la propiedad en una API pública. Aquí la simulamos.
        let subject = properties.find(p => p.address.toLowerCase().includes(searchAddress.toLowerCase()))
        if (!subject && properties.length > 0) subject = properties[0]; // Fallback

        if (subject) {
            setSubjectProperty({
                address: subject.address,
                city: subject.city,
                sqft: subject.sqft || 1500,
                beds: subject.beds,
                baths: subject.baths,
                garage: 2,
                yearBuilt: subject.yearBuilt || 2005,
                lotSize: '0.25 acres'
            })
            // Buscar comparables (usamos otras propiedades del contexto para demo)
            const availableComps = properties.filter(p => p.id !== subject.id).slice(0, 5)
            setComps(availableComps.map(p => ({
                id: p.id,
                address: p.address,
                city: p.city,
                price: p.price,
                sqft: p.sqft || 1500,
                beds: p.beds,
                baths: p.baths,
                garage: 2,
                soldDate: 'Hace ' + Math.floor(Math.random() * 30 + 5) + ' días',
                daysOnMarket: Math.floor(Math.random() * 20 + 5),
                pricePerSqft: Math.round(p.price / (p.sqft || 1500)),
                distanceMi: (Math.random() * 0.8 + 0.1).toFixed(1),
                status: 'sold'
            })))
            setShowReport(true)
        } else {
            alert("No se encontró la propiedad en el MLS de prueba. Intenta con otra.");
        }
    }

    const avgPrice = comps.length > 0 ? comps.reduce((a, c) => a + c.price, 0) / comps.length : 0
    const avgPriceSqft = comps.length > 0 ? comps.reduce((a, c) => a + c.pricePerSqft, 0) / comps.length : 0
    const avgDOM = comps.length > 0 ? comps.reduce((a, c) => a + c.daysOnMarket, 0) / comps.length : 0
    const suggestedPrice = subjectProperty ? Math.round(subjectProperty.sqft * avgPriceSqft / 1000) * 1000 : 0
    const priceRange = { low: suggestedPrice - 8000, high: suggestedPrice + 8000 }

    return (
        <div className="cma-page">
            <div className="cma-header">
                <h1>CMA</h1>
                <p>Análisis Comparativo de Mercado</p>
            </div>

            {/* Search */}
            <div className="cma-search">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Ingresa dirección de la propiedad..."
                    value={searchAddress}
                    onChange={e => setSearchAddress(e.target.value)}
                />
                <button className="cma-search-btn" onClick={handleAnalyze}>Analizar</button>
            </div>

            {!showReport && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>Ingresa una dirección para buscar propiedades comparables en Spark MLS e iniciar el análisis CMA.</p>
                </div>
            )}

            {showReport && subjectProperty && (
                <>
                    {/* Subject Property */}
                    <div className="cma-subject">
                        <div className="cma-subject-header">
                            <Home size={18} />
                            <h3>Propiedad en Análisis</h3>
                        </div>
                        <div className="cma-subject-info">
                            <strong>{subjectProperty.address}</strong>
                            <span>{subjectProperty.city}</span>
                        </div>
                        <div className="cma-subject-specs">
                            <div className="cma-spec"><Ruler size={14} /><span>{subjectProperty.sqft} sqft</span></div>
                            <div className="cma-spec"><BedDouble size={14} /><span>{subjectProperty.beds} BR</span></div>
                            <div className="cma-spec"><Bath size={14} /><span>{subjectProperty.baths} BA</span></div>
                            <div className="cma-spec"><Car size={14} /><span>{subjectProperty.garage} Gar</span></div>
                        </div>
                    </div>

                    {/* Suggested Price */}
                    <div className="cma-price-card">
                        <span className="cma-price-label">Precio Sugerido</span>
                        <strong className="cma-suggested-price">${suggestedPrice.toLocaleString()}</strong>
                        <div className="cma-price-range">
                            <span>${priceRange.low.toLocaleString()}</span>
                            <div className="cma-range-bar">
                                <div className="cma-range-fill" />
                                <div className="cma-range-marker" />
                            </div>
                            <span>${priceRange.high.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Market Stats */}
                    <div className="cma-stats-grid">
                        <div className="cma-stat-card">
                            <DollarSign size={16} className="cma-icon blue" />
                            <span>Precio Promedio</span>
                            <strong>${Math.round(avgPrice).toLocaleString()}</strong>
                        </div>
                        <div className="cma-stat-card">
                            <BarChart3 size={16} className="cma-icon green" />
                            <span>$/SqFt Prom.</span>
                            <strong>${Math.round(avgPriceSqft)}</strong>
                        </div>
                        <div className="cma-stat-card">
                            <Calendar size={16} className="cma-icon amber" />
                            <span>Días en Mercado</span>
                            <strong>{Math.round(avgDOM)}</strong>
                        </div>
                        <div className="cma-stat-card">
                            <Home size={16} className="cma-icon violet" />
                            <span>Comparables</span>
                            <strong>{comps.length}</strong>
                        </div>
                    </div>

                    {/* Comps List */}
                    <div className="cma-comps-section">
                        <h3>Comparables Vendidos</h3>
                        <span className="cma-comps-subtitle">Últimos 6 meses · Radio 1.5 mi</span>

                        {comps.map((comp, idx) => {
                            const priceDiff = comp.price - suggestedPrice
                            const isAbove = priceDiff > 0
                            return (
                                <div key={comp.id} className="cma-comp-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div className="cma-comp-top">
                                        <div>
                                            <strong>{comp.address}</strong>
                                            <span className="cma-comp-city">{comp.city}</span>
                                        </div>
                                        <div className="cma-comp-price">
                                            <strong>${comp.price.toLocaleString()}</strong>
                                            <span className={`cma-price-diff ${isAbove ? 'above' : 'below'}`}>
                                                {isAbove ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {isAbove ? '+' : ''}${(priceDiff / 1000).toFixed(0)}K
                                            </span>
                                        </div>
                                    </div>
                                    <div className="cma-comp-specs">
                                        <span>{comp.sqft} sqft</span>
                                        <span>{comp.beds}BR/{comp.baths}BA</span>
                                        <span>${comp.pricePerSqft}/sqft</span>
                                        <span>{comp.daysOnMarket}d mercado</span>
                                    </div>
                                    <div className="cma-comp-footer">
                                        <span><MapPin size={12} /> {comp.distanceMi} mi</span>
                                        <span><Calendar size={12} /> Vendido: {comp.soldDate}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Generate PDF */}
                    <button className="cma-generate-btn" onClick={() => alert('📄 La generación de PDF estará disponible cuando se conecte la API de Spark con datos reales de comparables.')}>
                        <Download size={18} /> Generar Reporte PDF
                    </button>
                </>
            )}

            <div style={{ height: '100px' }} />
        </div>
    )
}
