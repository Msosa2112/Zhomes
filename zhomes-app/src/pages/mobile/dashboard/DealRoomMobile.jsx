import { useState } from 'react'
import { MapPin, FileText, CheckCircle2, Clock, Upload, ArrowLeft, MoreHorizontal, Send, Brain, Sparkles, AlertTriangle, ArrowRight, Loader2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import './DealRoomMobile.css'

// Mock deals — in production these come from the bookings/esign_documents tables
const DEALS = [
    {
        id: 1,
        address: '2215 Tremont Dr', city: 'Louisville, KY', price: 567000,
        statusLabel: 'Bajo Contrato', statusColor: '#8B5CF6',
        realtor: 'Miriam Castaño', closing: 'Apr 15, 2026',
        documents: [
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'uploaded' },
            { name: 'Tasación', status: 'pending' },
        ],
        messages: [
            { sender: 'Miriam', text: 'Subí la inspección, todo en orden.' },
            { sender: 'Cliente', text: '¿Ya hay fecha de tasación?' },
            { sender: 'Miriam', text: 'La tasación está agendada para el jueves.' },
        ]
    },
    {
        id: 2,
        address: '8708 Denise Dr', city: 'Louisville, KY', price: 389000,
        statusLabel: 'Docs Pendientes', statusColor: '#EF4444',
        realtor: 'Jessica Hernandez', closing: 'May 2, 2026',
        documents: [
            { name: 'Pre-Aprobación', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'pending' },
            { name: 'HOA Docs', status: 'pending' },
        ],
        messages: [
            { sender: 'Jessica', text: 'Necesitamos el contrato firmado esta semana.' },
            { sender: 'Cliente', text: 'Lo envío mañana.' },
        ]
    },
    {
        id: 3,
        address: '4512 Maple Ave', city: 'Louisville, KY', price: 1250000,
        statusLabel: 'En Revisión', statusColor: '#F59E0B',
        realtor: 'Miriam Castaño', closing: 'Jun 1, 2026',
        documents: [
            { name: 'Oferta Inicial', status: 'approved' },
            { name: 'Counter-Offer', status: 'uploaded' },
            { name: 'Inspección', status: 'pending' },
            { name: 'Título', status: 'pending' },
        ],
        messages: [
            { sender: 'Miriam', text: 'La contra-oferta viene con $35K de rebaja.' },
            { sender: 'Cliente', text: 'Queremos aceptar si bajan otros $10K.' },
            { sender: 'Miriam', text: 'Negociando con el vendedor ahora.' },
        ]
    },
]

const TABS = ['Docs', 'Chat', 'Detalles', 'AI']

const statusOrder = { 'Docs Pendientes': 0, 'En Revisión': 1, 'Bajo Contrato': 2 }

export default function DealRoomMobile() {
    const navigate = useNavigate()
    const [selectedDeal, setSelectedDeal] = useState(null)
    const [tab, setTab] = useState('Docs')
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false)
    const [briefData, setBriefData] = useState(null)

    const handleSelectDeal = (deal) => {
        setSelectedDeal(deal)
        setTab('Docs')
        setBriefData(null)
    }

    const handleBack = () => {
        if (selectedDeal) {
            setSelectedDeal(null)
        } else {
            navigate(-1)
        }
    }

    const handleGenerateBriefing = async () => {
        if (!selectedDeal) return
        setIsGeneratingBrief(true)
        setBriefData(null)

        try {
            const { data, error } = await supabase.functions.invoke('zhomes-ai', {
                body: {
                    action: 'deal_briefing',
                    data: {
                        dealAddress: selectedDeal.address,
                        dealPrice: selectedDeal.price,
                        messages: selectedDeal.messages,
                        documents: selectedDeal.documents,
                        matchPrefs: { priceVsLocation: 50, moveInReady: 80, schools: 'B', lifestyle: 'family' }
                    }
                }
            })
            if (error) throw error
            setBriefData(data)
        } catch (err) {
            console.warn('AI Edge Function unavailable, using mock:', err)
            await new Promise(r => setTimeout(r, 1800))
            setBriefData({
                sentimentText: 'Motivado pero con dudas',
                summary: [
                    `${selectedDeal.address} tiene ${selectedDeal.documents.filter(d => d.status === 'pending').length} documentos pendientes.`,
                    `El cliente está en comunicación activa con ${selectedDeal.realtor}.`,
                    `Cierre estimado: ${selectedDeal.closing}.`,
                ],
                nextAction: `Priorizar los documentos pendientes y confirmar fecha de cierre con el título.`
            })
        } finally {
            setIsGeneratingBrief(false)
        }
    }

    const sortedDeals = [...DEALS].sort((a, b) => (statusOrder[a.statusLabel] ?? 9) - (statusOrder[b.statusLabel] ?? 9))

    // ── DEAL LIST VIEW ──────────────────────────────────────────
    if (!selectedDeal) {
        return (
            <div className="mobile-deal-room">
                <div className="mdr-nav">
                    <button className="mdr-back" onClick={handleBack}><ArrowLeft size={20} /></button>
                    <span>Deals en Proceso</span>
                    <div style={{ width: 36 }} />
                </div>

                <div style={{ padding: '16px 20px 8px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                        {DEALS.length} transacciones activas — selecciona una para ver el Deal Room
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 20px 100px' }}>
                    {sortedDeals.map(deal => {
                        const pending = deal.documents.filter(d => d.status === 'pending').length
                        const formatPrice = (p) => p >= 1000000 ? `$${(p/1000000).toFixed(2)}M` : `$${(p/1000).toFixed(0)}K`
                        return (
                            <button
                                key={deal.id}
                                onClick={() => handleSelectDeal(deal)}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    width: '100%',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Color dot */}
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: deal.statusColor, flexShrink: 0,
                                    boxShadow: `0 0 8px ${deal.statusColor}60`
                                }} />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong style={{ fontSize: '14px', display: 'block', marginBottom: '2px', color: 'var(--text-primary)' }}>
                                        {deal.address}
                                    </strong>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                        {deal.city} · {formatPrice(deal.price)} · {deal.realtor}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '600',
                                            background: `${deal.statusColor}20`, color: deal.statusColor,
                                            padding: '2px 8px', borderRadius: '20px'
                                        }}>
                                            {deal.statusLabel}
                                        </span>
                                        {pending > 0 && (
                                            <span style={{
                                                fontSize: '11px', background: 'rgba(239,68,68,0.1)',
                                                color: '#EF4444', padding: '2px 8px', borderRadius: '20px'
                                            }}>
                                                {pending} docs pendientes
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight size={18} color="var(--text-tertiary)" />
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ── DEAL DETAIL VIEW ────────────────────────────────────────
    const DEAL = selectedDeal

    return (
        <div className="mobile-deal-room">
            <div className="mdr-nav">
                <button className="mdr-back" onClick={handleBack}><ArrowLeft size={20} /></button>
                <span>Sala de Negocio</span>
                <button className="mdr-back"><MoreHorizontal size={20} /></button>
            </div>

            <div className="mdr-hero">
                <h1>{DEAL.address}</h1>
                <div className="mdr-meta">
                    <MapPin size={12} /> {DEAL.city} · ${DEAL.price.toLocaleString()}
                </div>
                <div className="mdr-status" style={{ background: `${DEAL.statusColor}20`, color: DEAL.statusColor }}>
                    {DEAL.statusLabel}
                </div>
            </div>

            <div className="mdr-tabs-wrapper">
                <div className="mdr-tabs">
                    {TABS.map(t => (
                        <button key={t} className={`mdr-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mdr-content">
                {tab === 'Docs' && (
                    <div className="mdr-docs-view animate-fadeInUp">
                        <button className="mdr-btn-upload">
                            <Upload size={18} /> Subir Documento
                        </button>
                        <div className="mdr-docs-list">
                            {DEAL.documents.map((d, i) => (
                                <div key={i} className="mdr-doc-card">
                                    <div className="mdr-doc-icon"><FileText size={20} /></div>
                                    <div className="mdr-doc-info">
                                        <div className="mdr-doc-name">{d.name}</div>
                                        <div className={`mdr-doc-status ${d.status}`}>
                                            {d.status === 'approved' && <><CheckCircle2 size={12} /> Aprobado</>}
                                            {d.status === 'uploaded' && <><Clock size={12} /> Revisando</>}
                                            {d.status === 'pending' && 'Falta subir'}
                                        </div>
                                    </div>
                                    {d.status === 'pending' && <button className="mdr-doc-action">Subir</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'Chat' && (
                    <div className="mdr-chat-view animate-fadeInUp">
                        <div className="mdr-msgs">
                            {DEAL.messages.map((m, i) => (
                                <div key={i} className={`mdr-msg ${m.sender === 'Cliente' ? 'mine' : ''}`}>
                                    {m.sender !== 'Cliente' && <span className="mdr-sender">{m.sender}</span>}
                                    <div className="mdr-bubble">{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mdr-chat-input-area">
                            <input type="text" placeholder="Escribe un mensaje..." />
                            <button><Send size={18} /></button>
                        </div>
                    </div>
                )}

                {tab === 'Detalles' && (
                    <div className="animate-fadeInUp" style={{ padding: '16px' }}>
                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Dirección', value: DEAL.address },
                                { label: 'Ciudad', value: DEAL.city },
                                { label: 'Precio', value: `$${DEAL.price.toLocaleString()}` },
                                { label: 'Realtor', value: DEAL.realtor },
                                { label: 'Cierre Est.', value: DEAL.closing },
                                { label: 'Estado', value: DEAL.statusLabel },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                <p>Analizando documentos, historial de chat y preferencias del cliente...</p>
                                <div className="ai-shimmer-lines">
                                    <div className="shimmer-line"></div>
                                    <div className="shimmer-line delay-1"></div>
                                    <div className="shimmer-line short delay-2"></div>
                                </div>
                            </div>
                        )}
                        {briefData && !isGeneratingBrief && (
                            <div className="mdr-ai-card">
                                <div className="ai-header">
                                    <div className="ai-header-title"><Sparkles size={18} /> <span>Deal Briefing Generado</span></div>
                                    <span className="ai-time">Justo ahora</span>
                                </div>
                                <div className="ai-section">
                                    <h4>Estado Emocional</h4>
                                    <div className="ai-sentiment positive">
                                        <div className="sentiment-dot"></div>
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
                                <button className="ai-btn-refresh" onClick={handleGenerateBriefing}>Actualizar Briefing</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
