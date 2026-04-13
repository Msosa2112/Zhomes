import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, FileText, CheckCircle2, Clock, Upload, ArrowLeft,
  MoreHorizontal, Send, Brain, Sparkles, AlertTriangle, ArrowRight,
  Loader2, ChevronRight, XCircle, RefreshCw, Plus, Calendar,
  AlertCircle, ChevronDown
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, TRANSACTION_STATUSES } from '../../../data/tcDocumentTemplates'
import './DealRoomMobile.css'

const TABS = ['Docs', 'Chat', 'Detalles', 'AI']

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (p) => {
  if (!p) return 'N/A'
  return p >= 1000000 ? `$${(p / 1000000).toFixed(2)}M` : `$${(p / 1000).toFixed(0)}K`
}

const formatDate = (d) => {
  if (!d) return 'Sin fecha'
  return new Date(d).toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const daysUntil = (d) => {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function DealRoomMobile() {
  const navigate = useNavigate()

  // Estado de lista
  const [deals, setDeals]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  // Estado de deal seleccionado
  const [selectedDeal, setSelectedDeal]   = useState(null)
  const [dealDocs, setDealDocs]           = useState([])
  const [dealMessages, setDealMessages]   = useState([])
  const [tab, setTab]                     = useState('Docs')

  // Chat
  const [newMessage, setNewMessage]   = useState('')
  const [sendingMsg, setSendingMsg]   = useState(false)
  const chatBottomRef                 = useRef(null)

  // Upload de docs
  const [uploadingDoc, setUploadingDoc]   = useState(null) // id del doc que se está subiendo
  const fileInputRef                      = useRef(null)
  const [pendingDocId, setPendingDocId]   = useState(null)

  // AI
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false)
  const [briefData, setBriefData]                 = useState(null)

  const { id: urlDealId } = useParams()

  // ── Cargar lista de deals ───────────────────────────────────────────────────
  const loadDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('No autenticado')

      const res = await fetch('/api/tc-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      setDeals(json.transactions || [])
    } catch (err) {
      console.error('[DealRoom] Error cargando deals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (urlDealId) {
      loadDealDetail(urlDealId)
    } else {
      loadDeals()
    }
  }, [loadDeals, urlDealId])

  // ── Cargar deal seleccionado ────────────────────────────────────────────────
  const loadDealDetail = useCallback(async (dealId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`/api/tc-transactions?id=${dealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()

      const tx = json.transaction
      setSelectedDeal(tx)
      setDealDocs(tx.tc_documents || [])
      setDealMessages(tx.tc_messages || [])
    } catch (err) {
      console.error('[DealRoom] Error cargando detalle:', err)
    }
  }, [])

  // Suscripción realtime al chat
  useEffect(() => {
    if (!selectedDeal) return

    const channel = supabase
      .channel(`tc_messages_${selectedDeal.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tc_messages',
        filter: `transaction_id=eq.${selectedDeal.id}`,
      }, (payload) => {
        setDealMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedDeal])

  // Auto-scroll al final del chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dealMessages])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectDeal = (deal) => {
    setTab('Docs')
    setBriefData(null)
    loadDealDetail(deal.id)
  }

  const handleBack = () => {
    if (selectedDeal) {
      setSelectedDeal(null)
      setDealDocs([])
      setDealMessages([])
    } else {
      navigate(-1)
    }
  }

  // Enviar mensaje al chat
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDeal) return
    setSendingMsg(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const senderName = user?.user_metadata?.full_name || user?.email || 'Usuario'
      const senderRole = user?.user_metadata?.role || 'realtor'

      await supabase.from('tc_messages').insert({
        transaction_id: selectedDeal.id,
        sender_id:      user?.id,
        sender_name:    senderName,
        sender_role:    senderRole,
        content:        newMessage.trim(),
        message_type:   'text',
      })
      setNewMessage('')
    } catch (err) {
      console.error('[DealRoom] Error enviando mensaje:', err)
    } finally {
      setSendingMsg(false)
    }
  }

  // Trigger upload para un documento específico
  const handleTriggerUpload = (docId) => {
    setPendingDocId(docId)
    fileInputRef.current?.click()
  }

  // Subir archivo a Supabase Storage
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !pendingDocId || !selectedDeal) return

    setUploadingDoc(pendingDocId)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Sanitizar nombre del archivo
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${selectedDeal.id}/${pendingDocId}/${safeName}`

      // 1. Subir a Storage
      const { error: storageError } = await supabase.storage
        .from('tc_documents')
        .upload(path, file, { upsert: true })

      if (storageError) throw storageError

      // 2. Actualizar registro en tc_documents
      const { error: dbError } = await supabase
        .from('tc_documents')
        .update({
          status:          'uploaded',
          file_url:        path,
          file_name:       file.name,
          file_size_bytes: file.size,
          uploaded_by:     user?.id,
          uploaded_at:     new Date().toISOString(),
        })
        .eq('id', pendingDocId)

      if (dbError) throw dbError

      // 3. Registrar evento en el log
      const docName = dealDocs.find((d) => d.id === pendingDocId)?.name || 'Documento'
      await supabase.from('tc_events').insert({
        transaction_id: selectedDeal.id,
        event_type:     'document_uploaded',
        description:    `"${docName}" subido por ${user?.user_metadata?.full_name || 'Realtor'}`,
        is_alert:       false,
      })

      // 4. Mensaje de sistema en el chat
      await supabase.from('tc_messages').insert({
        transaction_id: selectedDeal.id,
        sender_name:    'ZHomes TC',
        sender_role:    'system',
        content:        ` Documento subido: "${docName}". En revisión.`,
        message_type:   'document_update',
      })

      // 5. Refrescar lista de docs
      setDealDocs((prev) =>
        prev.map((d) =>
          d.id === pendingDocId
            ? { ...d, status: 'uploaded', file_url: path, file_name: file.name }
            : d
        )
      )
    } catch (err) {
      console.error('[DealRoom] Error subiendo documento:', err)
    } finally {
      setUploadingDoc(null)
      setPendingDocId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Generar AI Briefing
  const handleGenerateBriefing = async () => {
    if (!selectedDeal) return
    setIsGeneratingBrief(true)
    setBriefData(null)

    try {
      const pendingDocs  = dealDocs.filter((d) => d.status === 'pending' && d.required)
      const approvedDocs = dealDocs.filter((d) => d.status === 'approved')

      const { data, error } = await supabase.functions.invoke('zhomes-ai', {
        body: {
          action: 'deal_briefing',
          data: {
            dealAddress:  selectedDeal.address,
            dealPrice:    selectedDeal.price,
            dealStatus:   selectedDeal.status,
            closingDate:  selectedDeal.closing_date,
            messages:     dealMessages.slice(-10).map((m) => ({ sender: m.sender_name, text: m.content })),
            documents:    dealDocs.map((d) => ({ name: d.name, status: d.status, required: d.required })),
            matchPrefs:   { priceVsLocation: 50, moveInReady: 80, schools: 'B', lifestyle: 'family' }
          }
        }
      })
      if (error) throw error
      setBriefData(data)
    } catch (err) {
      // Fallback inteligente
      console.warn('[DealRoom] AI Edge Function con fallback:', err)
      await new Promise((r) => setTimeout(r, 1500))

      const pendingCount  = dealDocs.filter((d) => d.status === 'pending' && d.required).length
      const approvedCount = dealDocs.filter((d) => d.status === 'approved').length
      const daysLeft      = daysUntil(selectedDeal.closing_date)

      setBriefData({
        sentimentText: pendingCount > 3 ? 'Atención requerida' : 'En buen camino',
        summary: [
          `${selectedDeal.address}: ${approvedCount} documentos aprobados, ${pendingCount} pendientes requeridos.`,
          `Esta transacción está en estado "${TRANSACTION_STATUSES[selectedDeal.status]?.label || selectedDeal.status}".`,
          daysLeft !== null
            ? `Cierre estimado en ${daysLeft > 0 ? `${daysLeft} días` : 'fecha vencida — contactar al title company'}.`
            : 'Fecha de cierre no definida aún.',
        ],
        nextAction: pendingCount > 0
          ? `Solicitar los ${pendingCount} documentos pendientes al realtor asignado antes de continuar.`
          : `Verificar aprobación "Clear to Close" del lender para proceder al cierre.`
      })
    } finally {
      setIsGeneratingBrief(false)
    }
  }

  // ── Vista: Lista de Deals ──────────────────────────────────────────────────
  if (!selectedDeal) {
    return (
      <div className="mobile-deal-room">
        {/* Input oculto para uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

        <div className="mdr-nav">
          <button className="mdr-back" onClick={handleBack}><ArrowLeft size={20} /></button>
          <span>Deals en Proceso</span>
          <button className="mdr-back" onClick={loadDeals}><RefreshCw size={18} /></button>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
            <Loader2 size={32} className="ai-loading-icon" style={{ color: 'var(--accent-primary)' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>Cargando transacciones...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <AlertCircle size={32} color="#ef4444" />
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>
            <button onClick={loadDeals} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ padding: '12px 20px 8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                {deals.length} transacciones activas — selecciona una para ver el Deal Room
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 20px 100px' }}>
              {deals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No hay transacciones activas</p>
                </div>
              )}

              {deals.map((deal) => {
                const metrics   = deal._metrics || {}
                const txStatus  = TRANSACTION_STATUSES[deal.status]
                const statusColor = txStatus?.color || '#6b7280'
                const daysLeft  = daysUntil(deal.closing_date)
                const isUrgent  = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0

                return (
                  <button
                    key={deal.id}
                    onClick={() => handleSelectDeal(deal)}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${metrics.urgent_deadlines > 0 ? '#ef444440' : 'var(--border-subtle)'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      width: '100%',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', marginTop: '4px',
                      background: statusColor, flexShrink: 0,
                      boxShadow: `0 0 8px ${statusColor}60`
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '14px', display: 'block', marginBottom: '2px', color: 'var(--text-primary)' }}>
                        {deal.address}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {deal.city} · {formatPrice(deal.price)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '600',
                          background: `${statusColor}20`, color: statusColor,
                          padding: '2px 8px', borderRadius: '20px'
                        }}>
                          {txStatus?.label || deal.status}
                        </span>

                        {metrics.docs_pending > 0 && (
                          <span style={{
                            fontSize: '11px', background: 'rgba(239,68,68,0.1)',
                            color: '#EF4444', padding: '2px 8px', borderRadius: '20px'
                          }}>
                            {metrics.docs_pending} docs pendientes
                          </span>
                        )}

                        {isUrgent && (
                          <span style={{
                            fontSize: '11px', background: 'rgba(245,158,11,0.1)',
                            color: '#f59e0b', padding: '2px 8px', borderRadius: '20px'
                          }}>
                             Cierra en {daysLeft}d
                          </span>
                        )}
                      </div>

                      {/* Barra de progreso de docs */}
                      {metrics.docs_total > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              Documentos
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              {metrics.docs_completed}/{metrics.docs_total}
                            </span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px',
                              width: `${metrics.docs_progress}%`,
                              background: metrics.docs_progress >= 100 ? '#10b981' : 'var(--accent-primary)',
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <ChevronRight size={18} color="var(--text-tertiary)" style={{ marginTop: '4px', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Vista: Detalle de Deal ─────────────────────────────────────────────────
  const txStatus    = TRANSACTION_STATUSES[selectedDeal.status]
  const statusColor = txStatus?.color || '#6b7280'
  const daysLeft    = daysUntil(selectedDeal.closing_date)

  // Agrupar docs por categoría
  const docsByCategory = DOCUMENT_CATEGORIES
    ? Object.entries(DOCUMENT_CATEGORIES).map(([cat, info]) => ({
        ...info,
        cat,
        docs: dealDocs.filter((d) => d.category === cat).sort((a, b) => a.sort_order - b.sort_order)
      })).filter((g) => g.docs.length > 0)
    : [{ cat: 'all', label: 'Documentos', docs: dealDocs }]

  return (
    <div className="mobile-deal-room">
      {/* Input oculto para uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      <div className="mdr-nav">
        <button className="mdr-back" onClick={handleBack}><ArrowLeft size={20} /></button>
        <span>Sala de Negocio</span>
        <button className="mdr-back" onClick={() => loadDealDetail(selectedDeal.id)}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="mdr-hero">
        <h1>{selectedDeal.address}</h1>
        <div className="mdr-meta">
          <MapPin size={12} /> {selectedDeal.city} · {formatPrice(selectedDeal.price)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <div className="mdr-status" style={{ background: `${statusColor}20`, color: statusColor }}>
            {txStatus?.label || selectedDeal.status}
          </div>
          {daysLeft !== null && (
            <div style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
              background: daysLeft <= 7 ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
              color: daysLeft <= 7 ? '#f59e0b' : 'var(--text-tertiary)',
            }}>
              <Calendar size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Cierra {formatDate(selectedDeal.closing_date)}
            </div>
          )}
        </div>
      </div>

      <div className="mdr-tabs-wrapper">
        <div className="mdr-tabs">
          {TABS.map((t) => (
            <button key={t} className={`mdr-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mdr-content">

        {/* ── TAB: DOCS ─────────────────────────────────────────────── */}
        {tab === 'Docs' && (
          <div className="mdr-docs-view animate-fadeInUp">
            {/* Resumen de progreso */}
            {dealDocs.length > 0 && (() => {
              const req       = dealDocs.filter((d) => d.required)
              const approved  = req.filter((d) => d.status === 'approved').length
              const pct       = req.length > 0 ? Math.round((approved / req.length) * 100) : 0
              return (
                <div style={{ padding: '0 16px 12px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      Progreso del checklist
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {approved}/{req.length} aprobados
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: pct >= 100 ? '#10b981' : 'var(--accent-primary)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })()}

            {/* Docs agrupados por categoría */}
            <div className="mdr-docs-list">
              {docsByCategory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  Cargando documentos...
                </div>
              )}

              {docsByCategory.map(({ cat, label, icon, color, docs }) => (
                <div key={cat} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                    <span>{icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>

                  {docs.map((d) => {
                    const statusInfo = DOCUMENT_STATUSES[d.status] || DOCUMENT_STATUSES.pending
                    const isUploading = uploadingDoc === d.id

                    return (
                      <div key={d.id} className="mdr-doc-card">
                        <div className="mdr-doc-icon"><FileText size={18} /></div>
                        <div className="mdr-doc-info">
                          <div className="mdr-doc-name">
                            {d.name}
                            {!d.required && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '400' }}>
                                (opcional)
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '11px', fontWeight: '600', marginTop: '2px',
                            color: statusInfo.color,
                          }}>
                            {d.status === 'approved' && <><CheckCircle2 size={11} style={{ marginRight: '3px' }} />Aprobado</>}
                            {d.status === 'uploaded' && <><Clock size={11} style={{ marginRight: '3px' }} />En Revisión</>}
                            {d.status === 'reviewing' && <><Clock size={11} style={{ marginRight: '3px' }} />Revisando con IA</>}
                            {d.status === 'pending' && 'Pendiente — falta subir'}
                            {d.status === 'rejected' && (
                              <><XCircle size={11} style={{ marginRight: '3px' }} />Rechazado{d.rejection_reason ? ` — ${d.rejection_reason}` : ''}</>
                            )}
                          </div>
                        </div>
                        {(d.status === 'pending' || d.status === 'rejected') && (
                          <button
                            className="mdr-doc-action"
                            onClick={() => handleTriggerUpload(d.id)}
                            disabled={isUploading}
                            style={{ opacity: isUploading ? 0.6 : 1 }}
                          >
                            {isUploading ? <Loader2 size={14} className="ai-loading-icon" /> : <Upload size={14} />}
                            {isUploading ? ' Subiendo...' : ' Subir'}
                          </button>
                        )}
                        {d.status === 'uploaded' && d.file_name && (
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                            {d.file_name.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: CHAT ─────────────────────────────────────────────── */}
        {tab === 'Chat' && (
          <div className="mdr-chat-view animate-fadeInUp">
            <div className="mdr-msgs">
              {dealMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  No hay mensajes aún. Inicia la conversación.
                </div>
              )}
              {dealMessages.map((m) => {
                const isSystem = m.message_type !== 'text'
                const isMine   = m.sender_role === 'broker' // ajustar según rol actual

                if (isSystem) {
                  return (
                    <div key={m.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span style={{
                        fontSize: '11px', color: 'var(--text-tertiary)',
                        background: 'var(--bg-card)', padding: '4px 12px',
                        borderRadius: '20px', border: '1px solid var(--border-subtle)'
                      }}>
                        {m.content}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={m.id} className={`mdr-msg ${isMine ? 'mine' : ''}`}>
                    {!isMine && (
                      <span className="mdr-sender">{m.sender_name}</span>
                    )}
                    <div className="mdr-bubble">{m.content}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {new Date(m.created_at).toLocaleTimeString('es-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>

            <div className="mdr-chat-input-area">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={sendingMsg}
              />
              <button onClick={handleSendMessage} disabled={sendingMsg || !newMessage.trim()}>
                {sendingMsg ? <Loader2 size={18} className="ai-loading-icon" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: DETALLES ─────────────────────────────────────────── */}
        {tab === 'Detalles' && (
          <div className="animate-fadeInUp" style={{ padding: '16px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Dirección',      value: selectedDeal.address },
                { label: 'Ciudad',         value: selectedDeal.city },
                { label: 'Precio',         value: selectedDeal.price ? `$${Number(selectedDeal.price).toLocaleString()}` : 'N/A' },
                { label: 'Tipo',           value: selectedDeal.transaction_type === 'purchase' ? 'Compra' : selectedDeal.transaction_type === 'sale' ? 'Venta' : 'Arrendamiento' },
                { label: 'Estado',         value: txStatus?.label || selectedDeal.status },
                { label: 'Cliente',        value: selectedDeal.client_name || 'N/A' },
                { label: 'Tel. Cliente',   value: selectedDeal.client_phone || 'N/A' },
                { label: 'Inicio Contrato', value: formatDate(selectedDeal.contract_date) },
                { label: 'D. Inspección',  value: formatDate(selectedDeal.inspection_deadline) },
                { label: 'D. Financing',   value: formatDate(selectedDeal.financing_deadline) },
                { label: 'D. Appraisal',   value: formatDate(selectedDeal.appraisal_deadline) },
                { label: 'Cierre Est.',    value: formatDate(selectedDeal.closing_date) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>

            {selectedDeal.notes && (
              <div style={{ marginTop: '12px', background: 'var(--bg-card)', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>Notas</p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{selectedDeal.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AI ───────────────────────────────────────────────── */}
        {tab === 'AI' && (
          <div className="mdr-ai-view animate-fadeInUp">
            {!briefData && !isGeneratingBrief && (
              <div className="ai-empty-state">
                <div className="ai-icon-pulse"><Brain size={32} /></div>
                <h3>ZHomes AI Deal Intelligence</h3>
                <p>Obtén un briefing ejecutivo sobre el estado de esta transacción basado en chats, documentos y actividad reciente.</p>
                <button className="ai-btn-generate" onClick={handleGenerateBriefing}>
                  <Sparkles size={18} /> Generar Briefing de IA
                </button>
              </div>
            )}

            {isGeneratingBrief && (
              <div className="ai-loading-state">
                <Loader2 size={32} className="ai-loading-icon" />
                <p>Analizando documentos, chats y deadlines de esta transacción...</p>
                <div className="ai-shimmer-lines">
                  <div className="shimmer-line" />
                  <div className="shimmer-line delay-1" />
                  <div className="shimmer-line short delay-2" />
                </div>
              </div>
            )}

            {briefData && !isGeneratingBrief && (
              <div className="mdr-ai-card">
                <div className="ai-header">
                  <div className="ai-header-title"><Sparkles size={18} /> <span>Deal Briefing Generado</span></div>
                  <span className="ai-time">Ahora</span>
                </div>
                <div className="ai-section">
                  <h4>Estado General</h4>
                  <div className="ai-sentiment positive">
                    <div className="sentiment-dot" />
                    {briefData.sentimentText}
                  </div>
                </div>
                <div className="ai-section">
                  <h4>Resumen Ejecutivo</h4>
                  <ul className="ai-summary-list">
                    {briefData.summary.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
                <div className="ai-next-action">
                  <div className="action-header">
                    <AlertTriangle size={16} />
                    <h4>Next Best Action</h4>
                  </div>
                  <p>{briefData.nextAction}</p>
                  <button className="action-btn">Ejecutar Acción <ArrowRight size={16} /></button>
                </div>
                <button className="ai-btn-refresh" onClick={handleGenerateBriefing}>
                  Actualizar Briefing
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
