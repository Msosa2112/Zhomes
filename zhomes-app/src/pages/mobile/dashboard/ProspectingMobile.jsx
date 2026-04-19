import { useState, useEffect } from 'react'
import { MapPin, Home, TrendingUp, Clock, DollarSign, Users, Search, Target, Zap, Mail, Building, RefreshCw } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './ProspectingMobile.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n) return 'N/A'
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1_000)}K`
}

// Hot score calculado a partir de días en mercado, inventario, y cambio de precio
function calcHotScore(dom, inventory) {
  // DOM bajo + inventario bajo = mercado caliente
  const domScore = Math.max(0, 100 - (dom || 30) * 2)
  const invScore = Math.max(0, 100 - Math.min(inventory || 50, 50))
  return Math.round(domScore * 0.6 + invScore * 0.4)
}

const OPPORTUNITY_TYPES = {
  long_hold:      { label: 'Propietario 10+ años', color: 'var(--text-secondary)', icon: Clock },
  vacant:         { label: 'Vacante',               color: 'var(--text-secondary)', icon: Building },
  pre_foreclosure:{ label: 'Pre-Foreclosure',       color: 'var(--zhomes-red)',     icon: Target },
  absentee:       { label: 'Dueño Ausente',         color: 'var(--text-secondary)', icon: Users },
}

export default function ProspectingMobile() {
  const [view, setView]               = useState('zones')
  const [searchTerm, setSearchTerm]   = useState('')
  const [zones, setZones]             = useState([])
  const [opportunities, setOpps]      = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [activeRes, offerRes] = await Promise.allSettled([
      // Propiedades activas para calcular zonas
      supabase
        .from('mls_properties')
        .select('city, zip, price, days_on_market, status')
        .eq('status', 'Active')
        .not('city', 'is', null)
        .limit(2000),

      // Propiedades que llevan más tiempo activas = candidatas a outreach
      supabase
        .from('mls_properties')
        .select('id, address, city, price, days_on_market, zip, list_agent_name, property_subtype')
        .eq('status', 'Active')
        .gte('days_on_market', 45)
        .order('days_on_market', { ascending: false })
        .limit(20),
    ])

    const activeProps = activeRes.status === 'fulfilled' ? (activeRes.value.data || []) : []
    const staleProps  = offerRes.status  === 'fulfilled' ? (offerRes.value.data  || []) : []

    // ── Construir zonas agrupando por ciudad ─────────────────────
    const byCity = {}
    activeProps.forEach(p => {
      const city = p.city?.trim() || 'Other'
      if (!byCity[city]) {
        byCity[city] = { name: city, zip: p.zip || '', count: 0, totalPrice: 0, totalDom: 0, domCount: 0 }
      }
      byCity[city].count      += 1
      byCity[city].totalPrice += Number(p.price) || 0
      if (p.days_on_market) {
        byCity[city].totalDom += p.days_on_market
        byCity[city].domCount += 1
      }
    })

    const zoneList = Object.values(byCity)
      .filter(z => z.count >= 3) // al menos 3 propiedades para ser zona válida
      .map(z => ({
        id:           z.name,
        name:         z.name,
        zipCode:      z.zip,
        avgPrice:     z.count > 0 ? fmt(z.totalPrice / z.count) : 'N/A',
        avgPriceRaw:  z.count > 0 ? Math.round(z.totalPrice / z.count) : 0,
        inventory:    z.count,
        daysOnMarket: z.domCount > 0 ? Math.round(z.totalDom / z.domCount) : null,
        hotScore:     calcHotScore(
          z.domCount > 0 ? z.totalDom / z.domCount : 30,
          z.count
        ),
        properties:   z.count,
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 20)

    setZones(zoneList)

    // ── Oportunidades: propiedades con 45+ DOM = señal de motivación ──
    const opps = staleProps.map(p => ({
      id:             p.id,
      address:        p.address || 'Dirección no disponible',
      zone:           p.city || 'N/A',
      type:           p.days_on_market >= 120 ? 'long_hold' : p.days_on_market >= 60 ? 'pre_foreclosure' : 'absentee',
      estimatedValue: fmt(p.price),
      lastSale:       p.list_agent_name || 'N/A',
      confidence:     Math.min(95, Math.round(50 + (p.days_on_market / 200) * 45)),
      dom:            p.days_on_market,
      type_label:     p.property_subtype || 'Residential',
    }))
    setOpps(opps)
    setLoading(false)
  }

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (z.zipCode && z.zipCode.includes(searchTerm))
  )

  return (
    <div className="prospect-page">
      <div className="prospect-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Prospecting</h1>
            <p>Encuentra oportunidades de listing</p>
          </div>
          {loading && <RefreshCw size={18} style={{ color: 'var(--zhomes-red)', animation: 'spin 1s linear infinite', marginTop: 6 }} />}
        </div>
      </div>

      {/* KPIs en tiempo real */}
      <div className="prospect-kpis">
        <div className="prospect-kpi">
          <Target size={14} className="kpi-target" />
          <strong>{loading ? '—' : opportunities.length}</strong>
          <span>Oportunidades</span>
        </div>
        <div className="prospect-kpi">
          <MapPin size={14} />
          <strong>{loading ? '—' : zones.length}</strong>
          <span>Zonas</span>
        </div>
        <div className="prospect-kpi hot">
          <Zap size={14} />
          <strong>{loading ? '—' : zones.filter(z => z.hotScore >= 70).length}</strong>
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
        <input
          type="text"
          placeholder="Buscar zona o ZIP..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Estado vacío / loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: 13 }}>
          Analizando mercado de Louisville...
        </div>
      )}

      {/* ── ZONAS ── */}
      {!loading && view === 'zones' && (
        <div className="prospect-zones">
          {filteredZones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No se encontraron zonas con datos suficientes.
            </div>
          ) : filteredZones.map((zone, idx) => (
            <div
              key={zone.id}
              className="prospect-zone-card animate-fadeInUp"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="zone-card-top">
                <div className="zone-name-row">
                  <strong>{zone.name}</strong>
                  {zone.zipCode && <span className="zone-zip">{zone.zipCode}</span>}
                </div>
                <div className={`zone-hot-score ${zone.hotScore >= 70 ? 'hot' : zone.hotScore >= 50 ? 'warm' : 'cool'}`}>
                  <Zap size={12} />
                  {zone.hotScore}
                </div>
              </div>
              <div className="zone-stats-row">
                <div className="zone-mini-stat"><DollarSign size={12} /><span>{zone.avgPrice}</span></div>
                <div className="zone-mini-stat"><Home size={12} /><span>{zone.inventory} activos</span></div>
                {zone.daysOnMarket && (
                  <div className="zone-mini-stat"><Clock size={12} /><span>{zone.daysOnMarket}d DOM</span></div>
                )}
              </div>
              <div className="zone-card-footer">
                <span className="zone-price-trend">
                  <TrendingUp size={12} /> {zone.properties} propiedades
                </span>
                <span className="zone-forecast">
                  <Target size={12} /> {Math.max(1, Math.round(zone.inventory * 0.08))} posibles ventas/mes
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── OPORTUNIDADES ── */}
      {!loading && view === 'opportunities' && (
        <div className="prospect-opps">
          {opportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No hay propiedades con 45+ días en mercado actualmente.
            </div>
          ) : opportunities.map((opp, idx) => {
            const type     = OPPORTUNITY_TYPES[opp.type]
            const TypeIcon = type.icon
            return (
              <div key={opp.id} className="prospect-opp-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="opp-card-left">
                  <div className="opp-icon" style={{ background: `${type.color}18`, color: type.color }}>
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--zhomes-red)', fontWeight: 600 }}>
                      {opp.dom} días en mercado
                    </span>
                  </div>
                  <div className="opp-confidence">
                    <div className="opp-conf-bar">
                      <div
                        className="opp-conf-fill"
                        style={{
                          width: `${opp.confidence}%`,
                          background: opp.confidence >= 80 ? '#10B981' : opp.confidence >= 60 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                    <span>{opp.confidence}% probabilidad de outreach</span>
                  </div>
                </div>
                <div className="opp-actions">
                  <button
                    className="opp-action-btn"
                    title="Llamar agente listado"
                    onClick={() => {/* futuro: abrir modal de contacto */}}
                  >
                    <Mail size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Notice */}
          <div className="prospect-ai-notice">
            <Zap size={20} color="var(--text-secondary)" />
            <div>
              <strong>Datos en tiempo real</strong>
              <p>Estas oportunidades son propiedades con 45+ días en mercado activo del MLS — señal de motivación del vendedor. Filtradas de {zones.reduce((s, z) => s + z.inventory, 0).toLocaleString()} propiedades activas.</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '100px' }} />
    </div>
  )
}
