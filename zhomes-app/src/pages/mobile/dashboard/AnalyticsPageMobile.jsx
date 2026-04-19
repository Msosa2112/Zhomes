import { useState, useEffect } from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Target, Activity, Clock, Home, Users, RefreshCw, BarChart3 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './AnalyticsPageMobile.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`

// Rango de fechas según el período seleccionado
function getDateRange(period) {
  const now = new Date()
  const map = {
    mes:       new Date(now.getFullYear(), now.getMonth(), 1),
    trimestre: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
    año:       new Date(now.getFullYear(), 0, 1),
  }
  return map[period] || map['mes']
}

export default function AnalyticsPageMobile() {
  const [period, setPeriod]     = useState('mes')
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState(null)
  const [agents, setAgents]     = useState([])
  const [zones, setZones]       = useState([])

  useEffect(() => {
    loadData(period)
  }, [period])

  async function loadData(selectedPeriod) {
    setLoading(true)
    const since = getDateRange(selectedPeriod).toISOString()

    const [txRes, agentRes, propRes] = await Promise.allSettled([
      // Transacciones cerradas en el período
      supabase
        .from('tc_transactions')
        .select('id, price, closing_date, realtor_name, city, status, contract_date, client_name')
        .eq('status', 'closed')
        .gte('closing_date', since),

      // Agentes con stats
      supabase
        .from('zhomes_agents')
        .select('id, full_name, total_closed, total_volume, avg_price')
        .order('total_volume', { ascending: false })
        .limit(5),

      // Propiedades activas para zonas calientes
      supabase
        .from('mls_properties')
        .select('city, price, days_on_market')
        .eq('status', 'Active')
        .not('city', 'is', null)
        .not('price', 'is', null),
    ])

    const txList    = txRes.status    === 'fulfilled' ? (txRes.value.data    || []) : []
    const agentList = agentRes.status === 'fulfilled' ? (agentRes.value.data || []) : []
    const propList  = propRes.status  === 'fulfilled' ? (propRes.value.data  || []) : []

    // ── KPIs desde transacciones ──────────────────────────────
    const totalVolume    = txList.reduce((s, t) => s + (Number(t.price) || 0), 0)
    const totalDeals     = txList.length
    const avgClose       = totalDeals > 0
      ? Math.round(txList.reduce((s, t) => {
          if (!t.contract_date || !t.closing_date) return s
          return s + Math.ceil((new Date(t.closing_date) - new Date(t.contract_date)) / 86400000)
        }, 0) / Math.max(txList.filter(t => t.contract_date && t.closing_date).length, 1))
      : 0

    // Win rate: closed / (closed + active) — aproximación
    const { count: activeCount } = await supabase
      .from('tc_transactions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'under_contract', 'pending'])
    const winRate = totalDeals + (activeCount || 0) > 0
      ? Math.round((totalDeals / (totalDeals + (activeCount || 0))) * 100)
      : 0

    setStats({ totalVolume, totalDeals, avgClose, winRate })

    // ── Agentes ───────────────────────────────────────────────
    // Fallback: si la tabla no tiene datos, usar los de txList
    if (agentList.length > 0) {
      setAgents(agentList)
    } else {
      const byAgent = {}
      txList.forEach(t => {
        if (!t.realtor_name) return
        if (!byAgent[t.realtor_name]) byAgent[t.realtor_name] = { name: t.realtor_name, volume: 0, deals: 0 }
        byAgent[t.realtor_name].volume += Number(t.price) || 0
        byAgent[t.realtor_name].deals  += 1
      })
      setAgents(Object.values(byAgent).sort((a, b) => b.volume - a.volume).slice(0, 5))
    }

    // ── Zonas calientes desde propiedades activas ──────────────
    const byCity = {}
    propList.forEach(p => {
      const city = p.city?.trim() || 'Other'
      if (!byCity[city]) byCity[city] = { name: city, volume: 0, count: 0 }
      byCity[city].volume += Number(p.price) || 0
      byCity[city].count  += 1
    })
    const sortedZones = Object.values(byCity)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
    setZones(sortedZones)

    setLoading(false)
  }

  const periodLabel = { mes: 'Este mes', trimestre: 'Este trimestre', año: 'Este año' }[period]

  return (
    <div className="mobile-analytics-page">
      <div className="mobile-analytics-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Analytics</h1>
            <p>Inteligencia de negocio en tiempo real</p>
          </div>
          {loading && <RefreshCw size={18} style={{ color: 'var(--zhomes-red)', animation: 'spin 1s linear infinite', marginTop: 6 }} />}
        </div>
        <div className="mobile-analytics-tabs">
          {['mes', 'trimestre', 'año'].map(p => (
            <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="mobile-analytics-grid">
        <div className="mobile-card-kpi span-full highlight">
          <span className="kpi-label">Volumen Total — {periodLabel}</span>
          <span className="kpi-value">{loading ? '—' : fmt(stats?.totalVolume || 0)}</span>
          {stats?.totalDeals > 0 && (
            <span className="kpi-trend pos">
              <ArrowUpRight size={14} /> {stats.totalDeals} cierre{stats.totalDeals !== 1 ? 's' : ''} cerrado{stats.totalDeals !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mobile-card-kpi">
          <Activity size={20} className="kpi-icon blue" />
          <span className="kpi-label">Velocidad Cierre</span>
          <span className="kpi-value">{loading ? '—' : stats?.avgClose ? `${stats.avgClose} días` : 'N/A'}</span>
        </div>

        <div className="mobile-card-kpi">
          <Target size={20} className="kpi-icon green" />
          <span className="kpi-label">Win Rate</span>
          <span className="kpi-value">{loading ? '—' : `${stats?.winRate ?? '—'}%`}</span>
        </div>

        <div className="mobile-card-kpi">
          <Home size={20} className="kpi-icon" style={{ color: '#F59E0B' }} />
          <span className="kpi-label">Deals Cerrados</span>
          <span className="kpi-value">{loading ? '—' : stats?.totalDeals ?? 0}</span>
        </div>
      </div>

      {/* ── Agentes ── */}
      <div className="mobile-analytics-section">
        <h2>Rendimiento Agentes</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 13 }}>Cargando...</div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Sin datos de agentes para este período.
          </div>
        ) : (
          <div className="mobile-agent-perf-list">
            {agents.map((ag, i) => {
              const vol    = ag.total_volume || ag.volume || 0
              const deals  = ag.total_closed || ag.deals  || 0
              const maxVol = agents[0]?.total_volume || agents[0]?.volume || 1
              const pct    = Math.round((vol / maxVol) * 100)
              return (
                <div key={ag.id || ag.name} className="mobile-agent-perf-row">
                  <div className="map-agent">
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `hsl(${(i * 67) % 360}, 60%, 50%)22`,
                      border: `2px solid hsl(${(i * 67) % 360}, 60%, 50%)44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: `hsl(${(i * 67) % 360}, 60%, 45%)`
                    }}>
                      {(ag.full_name || ag.name || '?').charAt(0)}
                    </div>
                    <div>
                      <strong>{ag.full_name || ag.name}</strong>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {deals} deal{deals !== 1 ? 's' : ''} · {fmt(vol)}
                      </span>
                    </div>
                  </div>
                  <div className="map-score">
                    <div style={{ width: 48, height: 6, background: 'var(--border-subtle)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--zhomes-red)', borderRadius: 3 }} />
                    </div>
                    <span className={`score ${pct >= 90 ? 'max' : 'high'}`} style={{ minWidth: 28, textAlign: 'center' }}>
                      {pct}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Zonas Calientes ── */}
      <div className="mobile-analytics-section" style={{ marginBottom: '90px' }}>
        <h2>Zonas Calientes <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(propiedades activas)</span></h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 13 }}>Cargando...</div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Sin datos de propiedades activas.
          </div>
        ) : (
          <div className="mobile-zones-list">
            {zones.map((z, i) => (
              <div key={z.name} className="m-zone-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="zone-name">{z.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{z.count} propiedades activas</span>
                </div>
                <span className="zone-vol">{fmt(z.volume)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
