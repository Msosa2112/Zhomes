import { useState } from 'react'
import { MapPin, Home, TrendingUp, Clock, DollarSign, Users, Search, Filter, Eye, ChevronRight, Target, Zap, Calendar, Mail, BarChart3, Building } from 'lucide-react'
import './ProspectingMobile.css'

const ZONES = [
    { id: 1, name: 'Shively', zipCode: '40216', avgPrice: '$168K', inventory: 42, daysOnMarket: 18, priceChange: '+4.2%', hotScore: 92, properties: 156, forecastSale: 12 },
    { id: 2, name: 'Valley Station', zipCode: '40272', avgPrice: '$145K', inventory: 38, daysOnMarket: 22, priceChange: '+3.8%', hotScore: 87, properties: 134, forecastSale: 8 },
    { id: 3, name: 'South End', zipCode: '40208', avgPrice: '$125K', inventory: 55, daysOnMarket: 28, priceChange: '+2.1%', hotScore: 74, properties: 210, forecastSale: 15 },
    { id: 4, name: 'Jeffersontown', zipCode: '40299', avgPrice: '$265K', inventory: 29, daysOnMarket: 14, priceChange: '+5.1%', hotScore: 95, properties: 98, forecastSale: 6 },
    { id: 5, name: 'St. Matthews', zipCode: '40207', avgPrice: '$310K', inventory: 22, daysOnMarket: 11, priceChange: '+6.3%', hotScore: 98, properties: 75, forecastSale: 4 },
    { id: 6, name: 'Middletown', zipCode: '40243', avgPrice: '$285K', inventory: 31, daysOnMarket: 16, priceChange: '+4.8%', hotScore: 90, properties: 112, forecastSale: 7 },
    { id: 7, name: 'Prospect', zipCode: '40059', avgPrice: '$425K', inventory: 18, daysOnMarket: 21, priceChange: '+3.2%', hotScore: 82, properties: 64, forecastSale: 3 },
]

const OPPORTUNITIES = [
    { id: 1, address: '3215 Dixdale Ave', zone: 'Shively', type: 'long_hold', yearsOwned: 18, estimatedValue: '$165,000', ownerAge: 'Senior', lastSale: '2008', confidence: 85 },
    { id: 2, address: '4501 Vermont Ave', zone: 'Valley Station', type: 'vacant', yearsOwned: null, estimatedValue: '$142,000', ownerAge: null, lastSale: '2015', confidence: 72 },
    { id: 3, address: '2890 Garland Ave', zone: 'Shively', type: 'pre_foreclosure', yearsOwned: 6, estimatedValue: '$128,000', ownerAge: null, lastSale: '2020', confidence: 90 },
    { id: 4, address: '1045 Maple Ln', zone: 'South End', type: 'long_hold', yearsOwned: 22, estimatedValue: '$110,000', ownerAge: 'Senior', lastSale: '2004', confidence: 78 },
    { id: 5, address: '5620 Terry Rd', zone: 'Valley Station', type: 'absentee', yearsOwned: 8, estimatedValue: '$155,000', ownerAge: null, lastSale: '2018', confidence: 68 },
]

const OPPORTUNITY_TYPES = {
    long_hold: { label: 'Propietario 10+ años', color: '#3B82F6', icon: Clock },
    vacant: { label: 'Vacante', color: '#F59E0B', icon: Building },
    pre_foreclosure: { label: 'Pre-Foreclosure', color: '#EF4444', icon: Target },
    absentee: { label: 'Dueño Ausente', color: '#8B5CF6', icon: Users },
}

export default function ProspectingMobile() {
    const [view, setView] = useState('zones') // 'zones' | 'opportunities'
    const [selectedZone, setSelectedZone] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredZones = ZONES.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase()) || z.zipCode.includes(searchTerm))

    return (
        <div className="prospect-page">
            <div className="prospect-header">
                <h1>Prospecting</h1>
                <p>Encuentra oportunidades de listing</p>
            </div>

            {/* KPIs */}
            <div className="prospect-kpis">
                <div className="prospect-kpi">
                    <Target size={14} className="kpi-target" />
                    <strong>{OPPORTUNITIES.length}</strong>
                    <span>Oportunidades</span>
                </div>
                <div className="prospect-kpi">
                    <MapPin size={14} />
                    <strong>{ZONES.length}</strong>
                    <span>Zonas</span>
                </div>
                <div className="prospect-kpi hot">
                    <Zap size={14} />
                    <strong>{ZONES.filter(z => z.hotScore >= 90).length}</strong>
                    <span>Zonas Hot</span>
                </div>
            </div>

            {/* View Toggle */}
            <div className="crm-view-toggle">
                <button className={view === 'zones' ? 'active' : ''} onClick={() => setView('zones')}>Zonas</button>
                <button className={view === 'opportunities' ? 'active' : ''} onClick={() => setView('opportunities')}>Oportunidades</button>
            </div>

            {/* Search */}
            <div className="crm-search-bar">
                <Search size={16} />
                <input type="text" placeholder="Buscar zona o ZIP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {view === 'zones' && (
                <div className="prospect-zones">
                    {filteredZones.sort((a, b) => b.hotScore - a.hotScore).map((zone, idx) => (
                        <div key={zone.id} className="prospect-zone-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => setSelectedZone(zone)}>
                            <div className="zone-card-top">
                                <div className="zone-name-row">
                                    <strong>{zone.name}</strong>
                                    <span className="zone-zip">{zone.zipCode}</span>
                                </div>
                                <div className={`zone-hot-score ${zone.hotScore >= 90 ? 'hot' : zone.hotScore >= 75 ? 'warm' : 'cool'}`}>
                                    <Zap size={12} />
                                    {zone.hotScore}
                                </div>
                            </div>
                            <div className="zone-stats-row">
                                <div className="zone-mini-stat"><DollarSign size={12} /><span>{zone.avgPrice}</span></div>
                                <div className="zone-mini-stat"><Home size={12} /><span>{zone.inventory} activos</span></div>
                                <div className="zone-mini-stat"><Clock size={12} /><span>{zone.daysOnMarket}d DOM</span></div>
                            </div>
                            <div className="zone-card-footer">
                                <span className="zone-price-trend">
                                    <TrendingUp size={12} /> {zone.priceChange}
                                </span>
                                <span className="zone-forecast">
                                    <Target size={12} /> {zone.forecastSale} posibles ventas
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'opportunities' && (
                <div className="prospect-opps">
                    {OPPORTUNITIES.sort((a, b) => b.confidence - a.confidence).map((opp, idx) => {
                        const type = OPPORTUNITY_TYPES[opp.type]
                        const TypeIcon = type.icon
                        return (
                            <div key={opp.id} className="prospect-opp-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="opp-card-left">
                                    <div className="opp-icon" style={{ background: `${type.color}15`, color: type.color }}>
                                        <TypeIcon size={18} />
                                    </div>
                                </div>
                                <div className="opp-card-info">
                                    <strong>{opp.address}</strong>
                                    <span className="opp-zone">{opp.zone}</span>
                                    <div className="opp-details">
                                        <span className="opp-type-pill" style={{ color: type.color, background: `${type.color}15` }}>
                                            {type.label}
                                        </span>
                                        <span className="opp-value">{opp.estimatedValue}</span>
                                    </div>
                                    <div className="opp-confidence">
                                        <div className="opp-conf-bar">
                                            <div className="opp-conf-fill" style={{ width: `${opp.confidence}%`, background: opp.confidence >= 80 ? '#10B981' : opp.confidence >= 60 ? '#F59E0B' : '#EF4444' }} />
                                        </div>
                                        <span>{opp.confidence}% probabilidad</span>
                                    </div>
                                </div>
                                <div className="opp-actions">
                                    <button className="opp-action-btn" title="Enviar postcard"><Mail size={14} /></button>
                                </div>
                            </div>
                        )
                    })}

                    {/* AI Prediction Notice */}
                    <div className="prospect-ai-notice">
                        <Zap size={20} color="#8B5CF6" />
                        <div>
                            <strong>Predicción IA</strong>
                            <p>Estas oportunidades se generan analizando tiempo de tenencia, datos públicos y patrones del mercado. Conecta el Broker's Own Data para mejores predicciones.</p>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: '100px' }} />
        </div>
    )
}
