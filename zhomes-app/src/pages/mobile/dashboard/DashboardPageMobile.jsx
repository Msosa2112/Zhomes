import { useState, useEffect, useCallback } from 'react'
import {
  Brain, TrendingUp, Users, Target, Activity, AlertCircle,
  CheckCircle2, ChevronRight, X, Plus, Trash2, Save, PenTool,
  LineChart, MessageSquare, Briefcase, Loader2, RefreshCw,
  AlertTriangle, Calendar, FileText, Bell
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { TRANSACTION_STATUSES } from '../../../data/tcDocumentTemplates'
import './DashboardPageMobile.css'

// ── Pipeline statuses ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { status: 'under_contract', label: 'Bajo Contrato' },
  { status: 'inspection',     label: 'Inspección' },
  { status: 'appraisal',      label: 'Tasación' },
  { status: 'pre_close',      label: 'Pre-Cierre' },
]

export default function DashboardPageMobile() {
  // ── AI Knowledge Base ───────────────────────────────────────────────────────
  const [showRules, setShowRules]     = useState(false)
  const [newRule, setNewRule]         = useState('')
  const [rules, setRules]             = useState([
    'El documento DEBE incluir firma del comprador en página 3.',
    'El SSN debe estar visible.',
  ])
  const [testingRule, setTestingRule] = useState(false)
  const [testResult, setTestResult]   = useState(null)

  // ── TC Pipeline (datos reales) ──────────────────────────────────────────────
  const [pipeline, setPipeline]           = useState([])
  const [pipelineLoading, setPipelineLoading] = useState(true)
  const [kpis, setKpis]                   = useState({ closings: 0, active: 0, volume: 0 })

  // ── Alertas reales de tc_events ─────────────────────────────────────────────
  const [alerts, setAlerts]           = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  // ── Reporte IA de compliance ─────────────────────────────────────────────────
  const [aiReport, setAiReport]       = useState([])
  const [aiReportLoading, setAiReportLoading] = useState(true)

  // ── Cargar datos del pipeline ───────────────────────────────────────────────
  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true)
    try {
      const { data: txs } = await supabase
        .from('tc_transactions')
        .select('id, status, price, closing_date')
        .not('status', 'in', '("cancelled")')

      if (!txs) return

      // KPIs
      const closed = txs.filter((t) => t.status === 'closed')
      const active = txs.filter((t) => t.status !== 'closed')
      const volume = closed.reduce((sum, t) => sum + (Number(t.price) || 0), 0)

      setKpis({
        closings: closed.length,
        active:   active.length,
        volume:   volume >= 1000000
          ? `$${(volume / 1000000).toFixed(1)}M`
          : volume >= 1000
            ? `$${(volume / 1000).toFixed(0)}K`
            : `$${volume.toLocaleString()}`,
      })

      // Pipeline por stage
      const maxCount = Math.max(...PIPELINE_STAGES.map((s) =>
        txs.filter((t) => t.status === s.status).length
      ), 1)

      const enriched = PIPELINE_STAGES.map((stage) => {
        const count = txs.filter((t) => t.status === stage.status).length
        return {
          ...stage,
          count,
          width: `${Math.round((count / maxCount) * 100)}%`,
        }
      })
      setPipeline(enriched)
    } catch (err) {
      console.error('[Dashboard] Error cargando pipeline:', err)
    } finally {
      setPipelineLoading(false)
    }
  }, [])

  // ── Cargar alertas activas de tc_events ─────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true)
    try {
      const { data } = await supabase
        .from('tc_events')
        .select(`
          id, description, event_type, due_date, is_resolved, created_at,
          tc_transactions(address)
        `)
        .eq('is_alert', true)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5)

      setAlerts(data || [])
    } catch (err) {
      console.error('[Dashboard] Error cargando alertas:', err)
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  // ── Cargar reporte de AI Compliance ─────────────────────────────────────────
  const loadAiReport = useCallback(async () => {
    setAiReportLoading(true)
    try {
      // Obtener los últimos eventos de compliance del día anterior
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('tc_events')
        .select(`
          id, description, event_type, is_alert, created_at,
          tc_transactions(address)
        `)
        .eq('event_type', 'ai_compliance_check')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      setAiReport(data || [])
    } catch (err) {
      console.error('[Dashboard] Error cargando reporte IA:', err)
    } finally {
      setAiReportLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPipeline()
    loadAlerts()
    loadAiReport()
  }, [loadPipeline, loadAlerts, loadAiReport])

  // Marcar alerta como resuelta
  const handleResolveAlert = async (alertId) => {
    await supabase
      .from('tc_events')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  // ── AI Knowledge Base handlers ───────────────────────────────────────────────
  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()])
      setNewRule('')
    }
  }

  const handleDeleteRule = (index) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleTestRule = async () => {
    setTestingRule(true)
    setTestResult(null)
    try {
      const mockDoc = 'Página 1: Contrato de compra-venta.\nPágina 2: Condiciones.\nPágina 3: [Firma pendiente].\nSSN comprador: 000-XX-0000'
      const response = await fetch('/api/zhomes-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broker_compliance',
          data: {
            documentText: mockDoc,
            rules: rules.map((r) => ({ text: r })),
          },
        }),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      alert('Error IA: ' + err.message)
    } finally {
      setTestingRule(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mobile-dash-page">
        <div className="mobile-dash-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2>Hola, Gilbert </h2>
              <p>Aquí tienes el estado de tu agencia.</p>
            </div>
            <button
              onClick={() => { loadPipeline(); loadAlerts(); loadAiReport() }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions — icono como protagonista */}
        <div className="rdb-quick-grid">
          <Link to="/equipo" className="rdb-quick-btn">
            <div className="rdb-quick-icon"><Users size={22} /></div>
            <span>Equipo</span>
          </Link>
          <Link to="/crm" className="rdb-quick-btn">
            <div className="rdb-quick-icon"><Briefcase size={22} /></div>
            <span>CRM</span>
          </Link>
          <Link to="/dashboard/transactions" className="rdb-quick-btn">
            <div className="rdb-quick-icon"><FileText size={22} /></div>
            <span>TC Deals</span>
          </Link>
          <Link to="/dashboard/deal" className="rdb-quick-btn">
            <div className="rdb-quick-icon"><Briefcase size={22} /></div>
            <span>Deal Room</span>
          </Link>
        </div>

        {/* AI Compliance Widget */}
        <div className="m-ai-widget" onClick={() => setShowRules(true)} style={{ cursor: 'pointer' }}>
          <div className="mai-head" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={18} /> Reglas de Compliance IA
            </span>
            <ChevronRight size={18} />
          </div>
          <p>{rules.length} reglas activas para auditar contratos. Toca para administrar.</p>
        </div>

        {/* KPIs Reales */}
        <div className="m-kpi-scroller">
          <div className="mk-card">
            <TrendingUp size={20} />
            <span>Volumen</span>
            <strong>{pipelineLoading ? '...' : kpis.volume || '$0'}</strong>
          </div>
          <div className="mk-card">
            <Target size={20} />
            <span>Cierres</span>
            <strong>{pipelineLoading ? '...' : kpis.closings}</strong>
          </div>
          <div className="mk-card">
            <Activity size={20} />
            <span>Activos</span>
            <strong>{pipelineLoading ? '...' : kpis.active}</strong>
          </div>
        </div>

        {/* Pipeline TC (datos reales) */}
        <div className="m-dash-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Pipeline TC</h3>
            <Link to="/dashboard/transactions" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>

          {pipelineLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 size={24} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div className="m-pipeline-list">
              {pipeline.map((stage) => (
                <div key={stage.status} className="m-pipe-row">
                  <span className="pname">{stage.label}</span>
                  <div className="pbar">
                    <div style={{ width: stage.width, background: 'var(--zhomes-red)', transition: 'width 0.6s ease' }} />
                  </div>
                  <span className="pcount">{stage.count} deals</span>
                </div>
              ))}
              {pipeline.every((s) => s.count === 0) && (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '16px 0' }}>
                  No hay deals activos aún. <Link to="/dashboard/transactions" style={{ color: 'var(--accent-primary)' }}>Crear uno →</Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reporte IA (datos reales) */}
        <div className="m-dash-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={18} color="var(--zhomes-red)" /> Reporte IA
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Últimas 24h</span>
          </div>

          <div className="m-pipeline-list">
            {aiReportLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <Loader2 size={20} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : aiReport.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No hay análisis de AI en las últimas 24h.
                Cuando un Realtor suba un documento, ZhomesAI lo revisará automáticamente.
              </div>
            ) : (
              aiReport.map((event) => {
                const passed = !event.is_alert
                return (
                  <div
                    key={event.id}
                    className="m-pipe-row"
                    style={{
                      background: passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                      borderLeft: `3px solid ${passed ? '#10B981' : '#EF4444'}`
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span className="pname" style={{ color: passed ? '#10B981' : '#EF4444' }}>
                        {event.tc_transactions?.address ?? 'Transacción'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        {passed
                          ? <><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />Compliance OK</>
                          : <><AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />{event.description}</>
                        }
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Alertas TC (datos reales) */}
        <div className="m-dash-section">
          <h3>
            Alertas Activas{' '}
            {alerts.length > 0 && (
              <span className="m-badge-red">{alerts.length}</span>
            )}
          </h3>

          <div className="m-alerts-list">
            {alertsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <Loader2 size={20} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <CheckCircle2 size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 }}>
                  Sin alertas pendientes. Todo en orden.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isDeadline = alert.event_type === 'deadline_approaching'
                return (
                  <div key={alert.id} className="m-alert" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                      {isDeadline
                        ? <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                        : <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      }
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {alert.description}
                        </p>
                        {alert.tc_transactions?.address && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {alert.tc_transactions.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0 0 0 8px', flexShrink: 0 }}
                      title="Marcar como resuelto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: AI Knowledge Base */}
      {showRules && (
        <div className="mai-rules-overlay" onClick={() => setShowRules(false)}>
          <div className="mai-rules-content" onClick={(e) => e.stopPropagation()}>
            <div className="mai-rules-header">
              <h2><Brain size={24} color="var(--zhomes-red)" /> Entrenar ZhomesAI</h2>
              <button className="mai-rules-close" onClick={() => setShowRules(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="mai-rules-body">
              <p>Escribe aquí las reglas que quieres que la IA revise en cada documento que suban tus Realtors, antes de pasártelo a ti.</p>

              <div className="mai-rules-list">
                {rules.map((rule, idx) => (
                  <div key={idx} className="mai-rule-card">
                    <span>{rule}</span>
                    <button className="mai-rule-delete" onClick={() => handleDeleteRule(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mai-rule-add">
                <textarea
                  className="mai-rule-input"
                  placeholder="Ej: Rechaza el documento si no anexan los impuestos de 2024..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                />
                <button className="mai-btn-save" disabled={!newRule.trim()} onClick={handleAddRule}>
                  <Plus size={18} /> Añadir Regla
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Probar Simulación</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  Simula subir un documento que no tiene firma en la página 3.
                </p>
                <button
                  className="up-btn outline"
                  style={{ width: '100%', borderColor: 'var(--zhomes-red)', color: 'var(--zhomes-red)' }}
                  onClick={handleTestRule}
                  disabled={testingRule}
                >
                  {testingRule ? 'Analizando...' : 'Ejecutar Auditoría IA'}
                </button>
              </div>

              {testResult && (
                <div style={{
                  background: testResult.allPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '16px', borderRadius: '12px', marginBottom: '16px',
                  borderLeft: `3px solid ${testResult.allPassed ? '#10B981' : '#EF4444'}`
                }}>
                  <h4 style={{ color: testResult.allPassed ? '#10B981' : '#EF4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {testResult.allPassed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {testResult.allPassed ? 'Contrato Aprobado' : 'Contrato Rechazado'}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {testResult.report}
                  </p>
                </div>
              )}

              <button
                className="mai-btn-save"
                style={{ marginTop: '24px', background: 'var(--text-primary)' }}
                onClick={() => { setShowRules(false); setTestResult(null) }}
              >
                <Save size={18} /> Guardar Conocimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
