import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Home, Calendar, MapPin, ArrowUpRight, ArrowDownRight, Clock, Users, Target, Activity, Download } from 'lucide-react'
import './MarketReportsMobile.css'

const MARKET_DATA = {
    medianPrice: 278500,
    medianPriceChange: 5.2,
    inventory: 3245,
    inventoryChange: -8.1,
    daysOnMarket: 22,
    domChange: -3,
    newListings: 412,
    closedSales: 389,
    avgPriceSqft: 148,
}

const ZONE_STATS = [
    { zone: 'St. Matthews', median: '$315K', change: '+6.3%', dom: 11, inventory: 22, trend: 'up' },
    { zone: 'Jeffersontown', median: '$265K', change: '+5.1%', dom: 14, inventory: 29, trend: 'up' },
    { zone: 'Middletown', median: '$285K', change: '+4.8%', dom: 16, inventory: 31, trend: 'up' },
    { zone: 'Shively', median: '$168K', change: '+4.2%', dom: 18, inventory: 42, trend: 'up' },
    { zone: 'Prospect', median: '$425K', change: '+3.2%', dom: 21, inventory: 18, trend: 'up' },
    { zone: 'Valley Station', median: '$145K', change: '+3.8%', dom: 22, inventory: 38, trend: 'up' },
    { zone: 'South End', median: '$125K', change: '+2.1%', dom: 28, inventory: 55, trend: 'up' },
]

const MONTHLY_TRENDS = [
    { month: 'Oct', price: 262000, sales: 340 },
    { month: 'Nov', price: 265000, sales: 310 },
    { month: 'Dic', price: 270000, sales: 280 },
    { month: 'Ene', price: 271000, sales: 295 },
    { month: 'Feb', price: 275000, sales: 360 },
    { month: 'Mar', price: 278500, sales: 389 },
]

export default function MarketReportsMobile() {
    const [period, setPeriod] = useState('month')

    const maxPrice = Math.max(...MONTHLY_TRENDS.map(m => m.price))
    const minPrice = Math.min(...MONTHLY_TRENDS.map(m => m.price))
    const maxSales = Math.max(...MONTHLY_TRENDS.map(m => m.sales))

    return (
        <div className="market-page">
            <div className="market-header">
                <div>
                    <h1>Mercado</h1>
                    <p>Louisville Metro · Marzo 2026</p>
                </div>
                <div className="accounting-period-tabs">
                    <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mes</button>
                    <button className={period === 'quarter' ? 'active' : ''} onClick={() => setPeriod('quarter')}>Trim</button>
                    <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Año</button>
                </div>
            </div>

            {/* Main KPI */}
            <div className="market-main-kpi">
                <span>Precio Mediano</span>
                <strong>${MARKET_DATA.medianPrice.toLocaleString()}</strong>
                <span className="market-trend positive">
                    <ArrowUpRight size={14} /> +{MARKET_DATA.medianPriceChange}% YoY
                </span>
            </div>

            {/* Stats Grid */}
            <div className="market-stats-grid">
                <div className="market-stat">
                    <Home size={14} className="ms-icon blue" />
                    <strong>{MARKET_DATA.inventory.toLocaleString()}</strong>
                    <span>Inventario</span>
                    <span className={`market-mini-trend ${MARKET_DATA.inventoryChange < 0 ? 'negative' : 'positive'}`}>
                        {MARKET_DATA.inventoryChange > 0 ? '+' : ''}{MARKET_DATA.inventoryChange}%
                    </span>
                </div>
                <div className="market-stat">
                    <Clock size={14} className="ms-icon amber" />
                    <strong>{MARKET_DATA.daysOnMarket}</strong>
                    <span>Días en Mercado</span>
                    <span className="market-mini-trend negative">{MARKET_DATA.domChange}d</span>
                </div>
                <div className="market-stat">
                    <TrendingUp size={14} className="ms-icon green" />
                    <strong>{MARKET_DATA.newListings}</strong>
                    <span>Nuevos Listings</span>
                </div>
                <div className="market-stat">
                    <Target size={14} className="ms-icon violet" />
                    <strong>{MARKET_DATA.closedSales}</strong>
                    <span>Ventas Cerradas</span>
                </div>
            </div>

            {/* Price Trend Chart (CSS bars) */}
            <div className="market-section">
                <h3>Tendencia de Precios</h3>
                <div className="market-chart">
                    {MONTHLY_TRENDS.map(m => {
                        const height = ((m.price - minPrice) / (maxPrice - minPrice)) * 80 + 20
                        return (
                            <div key={m.month} className="market-bar-col">
                                <span className="market-bar-value">${(m.price / 1000).toFixed(0)}K</span>
                                <div className="market-bar" style={{ height: `${height}%` }} />
                                <span className="market-bar-label">{m.month}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Sales Volume Chart */}
            <div className="market-section">
                <h3>Volumen de Ventas</h3>
                <div className="market-chart sales-chart">
                    {MONTHLY_TRENDS.map(m => {
                        const height = (m.sales / maxSales) * 100
                        return (
                            <div key={m.month} className="market-bar-col">
                                <span className="market-bar-value">{m.sales}</span>
                                <div className="market-bar sales" style={{ height: `${height}%` }} />
                                <span className="market-bar-label">{m.month}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Zone Rankings */}
            <div className="market-section">
                <h3>Ranking por Zona</h3>
                <div className="market-zone-list">
                    {ZONE_STATS.map((z, idx) => (
                        <div key={z.zone} className="market-zone-row animate-fadeInUp" style={{ animationDelay: `${idx * 0.04}s` }}>
                            <span className="market-zone-rank">#{idx + 1}</span>
                            <div className="market-zone-info">
                                <strong>{z.zone}</strong>
                                <span>{z.dom}d DOM · {z.inventory} listings</span>
                            </div>
                            <div className="market-zone-price">
                                <strong>{z.median}</strong>
                                <span className="market-mini-trend positive">{z.change}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Share Report */}
            <button className="market-share-btn">
                <Download size={16} /> Generar PDF para Clientes
            </button>

            <div style={{ height: '100px' }} />
        </div>
    )
}
