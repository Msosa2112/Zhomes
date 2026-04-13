import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    Search, X, ChevronDown, MapPin, Home, Bed, Bath, Maximize,
    TrendingUp, TrendingDown, Minus, BarChart2, AlertCircle,
    CheckCircle2, Clock, Loader2, Info, Download, Target
} from 'lucide-react'
import { useProperties } from '../../../context/PropertyContext'
import { runCMA } from '../../../services/cmaService'
import './CMAPageMobile.css'

const fmt = (n) => n ? `$${n.toLocaleString('en-US')}` : '—'
const fmtK = (n) => n ? (n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`) : '—'
const fmtPct = (n) => n !== null && n !== undefined ? `${n > 0 ? '+' : ''}${n.toFixed(1)}%` : '—'

const MARKET_POSITION = {
    underpriced: { label: 'Bajo el Mercado', color: '#10B981', Icon: TrendingDown, bg: 'rgba(16,185,129,0.1)', desc: 'El precio de listado está por debajo del valor de mercado' },
    overpriced:  { label: 'Sobre el Mercado', color: '#EF4444', Icon: TrendingUp,   bg: 'rgba(239,68,68,0.1)',   desc: 'El precio de listado está por encima del valor de mercado' },
    at_market:   { label: 'En el Mercado',    color: '#F59E0B', Icon: Minus,         bg: 'rgba(245,158,11,0.1)',  desc: 'El precio de listado está dentro del rango de mercado' },
    unknown:     { label: 'Sin comparar',     color: '#6B7280', Icon: Info,          bg: 'rgba(107,114,128,0.1)', desc: 'No hay precio de listado disponible' },
}

export default function CMAPageMobile() {
    const { properties } = useProperties()

    // ─── Search state ───────────────────────────────────────
    const [searchText, setSearchText] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [selectedProperty, setSelectedProperty] = useState(null)

    // ─── CMA state ──────────────────────────────────────────
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    // ─── Comp detail modal ──────────────────────────────────
    const [detailComp, setDetailComp] = useState(null)

    // ─── Search filter ──────────────────────────────────────
    useEffect(() => {
        if (!searchText.trim() || searchText.length < 3) {
            setSearchResults([])
            return
        }
        const q = searchText.toLowerCase()
        const filtered = properties
            .filter(p => (p.address || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q))
            .slice(0, 8)
        setSearchResults(filtered)
    }, [searchText, properties])

    const selectProperty = (p) => {
        setSelectedProperty(p)
        setSearchText(p.address || '')
        setSearchResults([])
        setSearchFocused(false)
        setResult(null)
        setError(null)
    }

    const handleAnalyze = async () => {
        if (!selectedProperty) return
        setRunning(true)
        setResult(null)
        setError(null)
        try {
            const cmaResult = await runCMA(selectedProperty)
            setResult(cmaResult)
        } catch (e) {
            setError(e.message)
        } finally {
            setRunning(false)
        }
    }

    const clearSelection = () => {
        setSelectedProperty(null)
        setSearchText('')
        setResult(null)
        setError(null)
    }

    return (
        <div className="cma-root">
            {/* ── HEADER ── */}
            <div className="cma-header">
                <div className="cma-header-top">
                    <div>
                        <h1>Análisis CMA</h1>
                        <p>Valuación profesional con ventas reales del MLS</p>
                    </div>
                    <div className="cma-badge-pro">PRO</div>
                </div>

                {/* Metodología mini-info */}
                <div className="cma-method-pills">
                    <span> Radio 1.5mi</span>
                    <span> 180 días</span>
                    <span> Ajustes industria</span>
                    <span> Ponderado</span>
                </div>
            </div>

            {/* ── SEARCH ── */}
            <div className="cma-search-wrap">
                <div className={`cma-search-box ${searchFocused ? 'focused' : ''}`}>
                    <Search size={18} className="cma-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar propiedad por dirección..."
                        value={searchText}
                        onChange={e => { setSearchText(e.target.value); setSearchFocused(true) }}
                        onFocus={() => setSearchFocused(true)}
                        className="cma-search-input"
                    />
                    {searchText && (
                        <button className="cma-search-clear" onClick={clearSelection}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Dropdown result list */}
                {searchFocused && searchResults.length > 0 && (
                    <div className="cma-search-dropdown">
                        {searchResults.map(p => (
                            <button key={p.id} className="cma-search-result" onClick={() => selectProperty(p)}>
                                <MapPin size={14} />
                                <div>
                                    <span className="cma-res-addr">{p.address}</span>
                                    <span className="cma-res-meta">{p.city} · {p.beds}bd/{p.baths}ba · {p.sqft?.toLocaleString()} sqft · {fmt(p.price)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── SELECTED PROPERTY CARD ── */}
            {selectedProperty && (
                <div className="cma-subject-card animate-fadeInUp">
                    {selectedProperty.image && (
                        <img src={selectedProperty.image} alt="" className="cma-subject-img" />
                    )}
                    <div className="cma-subject-info">
                        <strong>{selectedProperty.address}</strong>
                        <span>{selectedProperty.city}</span>
                        <div className="cma-subject-specs">
                            <span><Bed size={12} /> {selectedProperty.beds || '—'}</span>
                            <span><Bath size={12} /> {selectedProperty.baths || '—'}</span>
                            <span><Maximize size={12} /> {selectedProperty.sqft?.toLocaleString() || '—'} sqft</span>
                            {selectedProperty.yearBuilt && <span><Home size={12} /> {selectedProperty.yearBuilt}</span>}
                        </div>
                        {selectedProperty.lat && selectedProperty.lng
                            ? <span className="cma-gps-ok"> GPS disponible — análisis real</span>
                            : <span className="cma-gps-warn"> Sin coordenadas GPS — análisis limitado</span>
                        }
                    </div>
                    <div className="cma-subject-price">{fmtK(selectedProperty.price)}</div>
                </div>
            )}

            {/* ── ANALYZE BUTTON ── */}
            {selectedProperty && !result && (
                <button
                    className={`cma-analyze-btn ${running ? 'loading' : ''}`}
                    onClick={handleAnalyze}
                    disabled={running}
                >
                    {running ? (
                        <><Loader2 size={18} className="spin" /> Analizando ventas reales...</>
                    ) : (
                        <><BarChart2 size={18} /> Ejecutar Análisis CMA</>
                    )}
                </button>
            )}

            {/* ── ERROR ── */}
            {error && (
                <div className="cma-error animate-fadeInUp">
                    <AlertCircle size={20} />
                    <div>
                        <strong>No se pudo completar el CMA</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                RESULTADOS CMA
            ══════════════════════════════════════════════════ */}
            {result && (
                <div className="cma-results animate-fadeInUp">

                    {/* ── HERO: Precio Sugerido ── */}
                    <div className="cma-hero-card">
                        <div className="cma-hero-label">Valor de Mercado Estimado</div>
                        <div className="cma-hero-price">{fmtK(result.suggestedPrice)}</div>
                        <div className="cma-hero-range">
                            Rango: {fmtK(result.rangeLow)} — {fmtK(result.rangeHigh)}
                        </div>

                        {/* Comparación con listado */}
                        {result.listPrice > 0 && (() => {
                            const pos = MARKET_POSITION[result.marketPosition]
                            const PosIcon = pos.Icon
                            return (
                                <div className="cma-position-badge" style={{ background: pos.bg, color: pos.color }}>
                                    <PosIcon size={14} />
                                    <span>{pos.label} ({fmtPct(result.priceDiff)})</span>
                                </div>
                            )
                        })()}
                    </div>

                    {/* ── MARKET STATS ── */}
                    <div className="cma-stats-grid">
                        <div className="cma-stat-box">
                            <span>Precio/sqft</span>
                            <strong>${result.marketStats.avgPricePerSqft}/ft²</strong>
                        </div>
                        <div className="cma-stat-box">
                            <span>Comps usados</span>
                            <strong>{result.marketStats.compsUsed}</strong>
                        </div>
                        <div className="cma-stat-box">
                            <span>Promedio antigüedad</span>
                            <strong>{result.marketStats.avgDaysAgo} días</strong>
                        </div>
                        <div className="cma-stat-box">
                            <span>Distancia prom.</span>
                            <strong>{result.marketStats.avgDistMiles} mi</strong>
                        </div>
                    </div>

                    {/* ── COMPARABLES ── */}
                    <div className="cma-section">
                        <div className="cma-section-header">
                            <h3>Comparables Vendidos</h3>
                            <span className="cma-section-sub">Ventas reales del MLS · últimos 180 días</span>
                        </div>

                        {result.comps.map((comp, idx) => (
                            <div
                                key={comp.id}
                                className="cma-comp-card animate-fadeInUp"
                                style={{ animationDelay: `${idx * 0.06}s` }}
                                onClick={() => setDetailComp(comp)}
                            >
                                {/* Score badge */}
                                <div className="cma-score-badge" style={{
                                    background: comp.similarityScore >= 70 ? 'rgba(16,185,129,0.15)' : comp.similarityScore >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: comp.similarityScore >= 70 ? '#10B981' : comp.similarityScore >= 50 ? '#F59E0B' : '#EF4444',
                                }}>
                                    {comp.similarityScore}%
                                </div>

                                {/* Photo */}
                                <div className="cma-comp-img-wrap">
                                    <img src={comp.photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200'} alt="" />
                                </div>

                                {/* Info */}
                                <div className="cma-comp-info">
                                    <strong>{comp.address}</strong>
                                    <div className="cma-comp-specs">
                                        <span>{comp.beds}bd</span>
                                        <span>{comp.baths}ba</span>
                                        <span>{comp.sqft?.toLocaleString()} ft²</span>
                                        <span className="cma-comp-dist"><MapPin size={10} /> {comp.distMiles} mi</span>
                                    </div>
                                    <div className="cma-comp-prices">
                                        <div className="cma-price-col">
                                            <span>Vendido</span>
                                            <strong>{fmt(comp.closePrice)}</strong>
                                            <em>{comp.daysAgo}d atrás</em>
                                        </div>
                                        <div className="cma-price-arrow">→</div>
                                        <div className="cma-price-col adjusted">
                                            <span>Ajustado</span>
                                            <strong>{fmt(comp.adjustedPrice)}</strong>
                                            <em style={{
                                                color: comp.adjustmentTotal >= 0 ? '#10B981' : '#EF4444'
                                            }}>
                                                {comp.adjustmentTotal >= 0 ? '+' : ''}{fmt(Math.round(comp.adjustmentTotal / 1000) * 1000)}
                                            </em>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── METODOLOGÍA ── */}
                    <div className="cma-method-box">
                        <h4>¿Cómo se calculó?</h4>
                        <ul>
                            <li><CheckCircle2 size={12} /> Propiedades vendidas (Closed) del MLS en radio de {result.marketStats.avgDistMiles} mi promedio</li>
                            <li><CheckCircle2 size={12} /> Ajustes por sqft (${result.adjustmentConstants.SQFT_PER_UNIT}/ft²), habitaciones, baños, garage y año de construcción</li>
                            <li><CheckCircle2 size={12} /> Precio final = promedio ponderado por Score de Similaridad</li>
                            <li><CheckCircle2 size={12} /> Ajuste de tiempo: +4% anual si el comp se vendió hace +60 días</li>
                        </ul>
                        <p className="cma-disclaimer">Este análisis es informativo. No reemplaza una tasación formal (appraisal) de un tasador licenciado.</p>
                    </div>

                    {/* Nuevo análisis */}
                    <button className="cma-reset-btn" onClick={() => { setResult(null); setSelectedProperty(null); setSearchText('') }}>
                        Nuevo Análisis
                    </button>
                </div>
            )}

            {/* Default state */}
            {!selectedProperty && !result && (
                <div className="cma-empty">
                    <div className="cma-empty-icon"></div>
                    <h3>Valuación Profesional CMA</h3>
                    <p>Busca cualquier propiedad del MLS de Louisville para obtener un análisis comparativo basado en ventas reales cercanas.</p>
                    <div className="cma-feature-list">
                        <div><Target size={14} /> Comparables reales vendidos</div>
                        <div><BarChart2 size={14} /> Ajustes estándar de REALTORS</div>
                        <div><CheckCircle2 size={14} /> Ponderación por distancia y recencia</div>
                    </div>
                </div>
            )}

            <div style={{ height: '110px' }} />

            {/* ══ COMP DETAIL MODAL ══ */}
            {detailComp && createPortal(
                <div className="cma-overlay" onClick={() => setDetailComp(null)}>
                    <div className="cma-modal" onClick={e => e.stopPropagation()}>
                        <div className="cma-modal-header">
                            <div>
                                <h3>{detailComp.address}</h3>
                                <span>{detailComp.city} · {detailComp.distMiles} mi del sujeto</span>
                            </div>
                            <button onClick={() => setDetailComp(null)}><X size={20} /></button>
                        </div>

                        <div className="cma-modal-body">
                            {/* Score */}
                            <div className="cma-modal-score-row">
                                <span>Similaridad</span>
                                <div className="cma-score-bar">
                                    <div style={{
                                        width: `${detailComp.similarityScore}%`,
                                        background: detailComp.similarityScore >= 70 ? '#10B981' : detailComp.similarityScore >= 50 ? '#F59E0B' : '#EF4444'
                                    }} />
                                </div>
                                <strong style={{ color: detailComp.similarityScore >= 70 ? '#10B981' : detailComp.similarityScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                                    {detailComp.similarityScore}%
                                </strong>
                            </div>

                            {/* Specs */}
                            <div className="cma-modal-specs">
                                <div><span>Vendido</span><strong>{fmt(detailComp.closePrice)}</strong></div>
                                <div><span>Fecha</span><strong>{detailComp.closeDate} ({detailComp.daysAgo}d)</strong></div>
                                <div><span>Sqft</span><strong>{detailComp.sqft?.toLocaleString()}</strong></div>
                                <div><span>Beds</span><strong>{detailComp.beds}</strong></div>
                                <div><span>Baths</span><strong>{detailComp.baths}</strong></div>
                                <div><span>Año</span><strong>{detailComp.yearBuilt || '—'}</strong></div>
                                <div><span>Garage</span><strong>{detailComp.garage ? 'Sí' : 'No'}</strong></div>
                                <div><span>Piscina</span><strong>{detailComp.pool ? 'Sí' : 'No'}</strong></div>
                                <div><span>$/sqft</span><strong>${detailComp.pricePerSqft}</strong></div>
                                <div><span>Distancia</span><strong>{detailComp.distMiles} mi</strong></div>
                            </div>

                            {/* Tabla de ajustes */}
                            <div className="cma-adj-section">
                                <h4>Ajustes Aplicados</h4>
                                <div className="cma-adj-row header">
                                    <span>Característica</span>
                                    <span>Ajuste</span>
                                </div>
                                {detailComp.timeAdj > 0 && (
                                    <div className="cma-adj-row">
                                        <span><Clock size={12} /> Mercado ({detailComp.daysAgo}d)</span>
                                        <strong style={{ color: '#10B981' }}>+{fmt(detailComp.timeAdj)}</strong>
                                    </div>
                                )}
                                {detailComp.adjustments.map((adj, i) => (
                                    <div key={i} className="cma-adj-row">
                                        <span>{adj.label}</span>
                                        <strong style={{ color: adj.amount >= 0 ? '#10B981' : '#EF4444' }}>
                                            {adj.amount >= 0 ? '+' : ''}{fmt(Math.round(adj.amount))}
                                        </strong>
                                    </div>
                                ))}
                                {detailComp.adjustments.length === 0 && !detailComp.timeAdj && (
                                    <div className="cma-adj-row">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Sin diferencias significativas</span>
                                        <strong>$0</strong>
                                    </div>
                                )}
                                <div className="cma-adj-row total">
                                    <span>Precio Ajustado</span>
                                    <strong>{fmt(detailComp.adjustedPrice)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
