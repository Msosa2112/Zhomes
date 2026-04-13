import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, Filter, MapPin, Loader2, AlertCircle,
         RefreshCw, Calendar, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { TRANSACTION_STATUSES } from '../../../data/tcDocumentTemplates'
import './TransactionsPageMobile.css'

const ALL_STATUSES = [
  { value: '',               label: 'Todas' },
  { value: 'under_contract', label: 'Bajo Contrato' },
  { value: 'inspection',     label: 'Inspección' },
  { value: 'appraisal',      label: 'Tasación' },
  { value: 'pre_close',      label: 'Pre-Cierre' },
  { value: 'closed',         label: 'Cerradas' },
]

const formatPrice = (p) => {
  if (!p) return 'N/A'
  return `$${Number(p).toLocaleString()}`
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const daysUntil = (d) => {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}

export default function RealtorTransactionsMobile() {
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters]   = useState(false)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('No autenticado')

      const params = new URLSearchParams({ limit: 100 })
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`/api/tc-transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      setTransactions(json.transactions || [])
    } catch (err) {
      console.error('[RealtorTransactions] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const filtered = transactions.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.address?.toLowerCase().includes(q) ||
      t.client_name?.toLowerCase().includes(q)
    )
  })

  const urgentDeals = filtered.filter((t) => {
    const days = daysUntil(t.closing_date)
    return days !== null && days <= 7 && days >= 0 && t.status !== 'closed'
  })

  return (
    <div className="mobile-tx-page">
      <div className="mobile-tx-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Mis Transacciones</h1>
            <p>
              {loading ? 'Cargando...' : `${filtered.length} transacción${filtered.length !== 1 ? 'es' : ''} · ${transactions.filter(t => t.status !== 'closed' && t.status !== 'cancelled').length} activas`}
            </p>
          </div>
          <button
            onClick={loadTransactions}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mobile-tx-actions">
          <div className="mobile-search-mock">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar propiedad o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="mobile-filter-btn"
            onClick={() => setShowFilters((v) => !v)}
            style={{ background: filterStatus ? 'var(--accent-primary)' : undefined, color: filterStatus ? '#fff' : undefined }}
          >
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            {ALL_STATUSES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setFilterStatus(value); setShowFilters(false) }}
                style={{
                  fontSize: '12px', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                  border: `1px solid ${filterStatus === value ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: filterStatus === value ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: filterStatus === value ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
          <Loader2 size={32} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>Cargando...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>
          <button onClick={loadTransactions} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mobile-tx-list">
          {urgentDeals.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px 8px', color: '#f59e0b' }}>
                <AlertTriangle size={14} />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cierres próximos — 7 días
                </span>
              </div>
              {urgentDeals.map((t, i) => (
                <RealtorTxCard key={t.id} tx={t} index={i} urgent onClick={() => navigate('/realtor/deal')} />
              ))}
              <div style={{ height: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }} />
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                {search ? 'Sin resultados.' : 'No tienes transacciones activas aún.'}
              </p>
            </div>
          )}

          {filtered
            .filter((t) => !urgentDeals.includes(t))
            .map((t, i) => (
              <RealtorTxCard key={t.id} tx={t} index={i} onClick={() => navigate('/realtor/deal')} />
            ))}
        </div>
      )}

      <div style={{ height: '90px' }} />
    </div>
  )
}

function RealtorTxCard({ tx, index, onClick, urgent = false }) {
  const txStatus    = TRANSACTION_STATUSES[tx.status]
  const statusColor = txStatus?.color || '#6b7280'
  const metrics     = tx._metrics || {}
  const daysLeft    = daysUntil(tx.closing_date)

  return (
    <button
      className="mobile-tx-card animate-fadeInUp"
      style={{
        animationDelay: `${0.04 * index}s`,
        border: `1px solid ${urgent ? '#f59e0b40' : 'var(--border-subtle)'}`,
        background: urgent ? 'rgba(245,158,11,0.04)' : 'var(--bg-card)',
        width: '100%', textAlign: 'left', cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div className="tx-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tx.address}
          </h3>
          <span className="tx-city"><MapPin size={12} /> {tx.city}</span>
        </div>
        <span className="tx-price">{formatPrice(tx.price)}</span>
      </div>

      <div className="tx-card-mid">
        <span className="tx-status" style={{ background: `${statusColor}20`, color: statusColor }}>
          {txStatus?.label || tx.status}
        </span>
        <div className="tx-docs">
          Docs: <strong>{metrics.docs_completed || 0}/{metrics.docs_total || 0}</strong>
        </div>
      </div>

      <div className="tx-card-bottom">
        <div className="tx-realtor">
          <span>Cliente: <strong>{tx.client_name || '—'}</strong></span>
        </div>
        <span className="tx-date" style={{ color: daysLeft !== null && daysLeft <= 7 ? '#f59e0b' : undefined }}>
          {tx.closing_date ? (
            <>
              <Calendar size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
              {daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d` : formatDate(tx.closing_date)}
            </>
          ) : '—'}
        </span>
      </div>

      {metrics.docs_total > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ height: '3px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              width: `${metrics.docs_progress || 0}%`,
              background: (metrics.docs_progress || 0) >= 100 ? '#10b981' : statusColor,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
    </button>
  )
}
