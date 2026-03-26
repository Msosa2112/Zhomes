import { useState } from 'react'
import { BarChart3, Home, MapPin, DollarSign, TrendingUp, TrendingDown, Calendar, Download, ChevronRight, Search, Ruler, BedDouble, Bath, Car, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import './CMAPageMobile.css'

const SAMPLE_COMPS = [
    { id: 1, address: '4020 Craig Ave', city: 'Louisville, KY 40216', price: 172000, sqft: 1450, beds: 3, baths: 2, garage: 1, soldDate: '2026-02-15', daysOnMarket: 12, pricePerSqft: 119, distanceMi: 0.2, status: 'sold', photo: null },
    { id: 2, address: '4300 Hillview Ave', city: 'Louisville, KY 40216', price: 185000, sqft: 1600, beds: 3, baths: 2, garage: 2, soldDate: '2026-01-28', daysOnMarket: 18, pricePerSqft: 116, distanceMi: 0.4, status: 'sold', photo: null },
    { id: 3, address: '3918 River Park Dr', city: 'Louisville, KY 40216', price: 165000, sqft: 1380, beds: 3, baths: 1, garage: 1, soldDate: '2026-03-05', daysOnMarket: 8, pricePerSqft: 120, distanceMi: 0.3, status: 'sold', photo: null },
    { id: 4, address: '4215 Vermont Ave', city: 'Louisville, KY 40216', price: 179000, sqft: 1520, beds: 4, baths: 2, garage: 1, soldDate: '2026-02-20', daysOnMarket: 21, pricePerSqft: 118, distanceMi: 0.5, status: 'sold', photo: null },
    { id: 5, address: '4100 Lees Ln', city: 'Louisville, KY 40216', price: 158000, sqft: 1280, beds: 3, baths: 1, garage: 0, soldDate: '2026-01-10', daysOnMarket: 35, pricePerSqft: 123, distanceMi: 0.6, status: 'sold', photo: null },
]

const SUBJECT_PROPERTY = {
    address: '4132 Craig Ave',
    city: 'Louisville, KY 40216',
    sqft: 1480,
    beds: 3,
    baths: 2,
    garage: 1,
    yearBuilt: 1965,
    lotSize: '0.25 acres',
}

export default function CMAPageMobile() {
    const [searchAddress, setSearchAddress] = useState('')
    const [showReport, setShowReport] = useState(true)
    const [selectedComp, setSelectedComp] = useState(null)

    const avgPrice = SAMPLE_COMPS.reduce((a, c) => a + c.price, 0) / SAMPLE_COMPS.length
    const avgPriceSqft = SAMPLE_COMPS.reduce((a, c) => a + c.pricePerSqft, 0) / SAMPLE_COMPS.length
    const avgDOM = SAMPLE_COMPS.reduce((a, c) => a + c.daysOnMarket, 0) / SAMPLE_COMPS.length
    const suggestedPrice = Math.round(SUBJECT_PROPERTY.sqft * avgPriceSqft / 1000) * 1000
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
                <button className="cma-search-btn" onClick={() => setShowReport(true)}>Analizar</button>
            </div>

            {showReport && (
                <>
                    {/* Subject Property */}
                    <div className="cma-subject">
                        <div className="cma-subject-header">
                            <Home size={18} />
                            <h3>Propiedad en Análisis</h3>
                        </div>
                        <div className="cma-subject-info">
                            <strong>{SUBJECT_PROPERTY.address}</strong>
                            <span>{SUBJECT_PROPERTY.city}</span>
                        </div>
                        <div className="cma-subject-specs">
                            <div className="cma-spec"><Ruler size={14} /><span>{SUBJECT_PROPERTY.sqft} sqft</span></div>
                            <div className="cma-spec"><BedDouble size={14} /><span>{SUBJECT_PROPERTY.beds} BR</span></div>
                            <div className="cma-spec"><Bath size={14} /><span>{SUBJECT_PROPERTY.baths} BA</span></div>
                            <div className="cma-spec"><Car size={14} /><span>{SUBJECT_PROPERTY.garage} Gar</span></div>
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
                            <strong>{SAMPLE_COMPS.length}</strong>
                        </div>
                    </div>

                    {/* Comps List */}
                    <div className="cma-comps-section">
                        <h3>Comparables Vendidos</h3>
                        <span className="cma-comps-subtitle">Últimos 6 meses · Radio 0.6 mi</span>

                        {SAMPLE_COMPS.map((comp, idx) => {
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
