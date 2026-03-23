import { useState } from 'react'
import {
    MapPin, DollarSign, FileText, CheckCircle2, Clock, Eye,
    Upload, Download, MessageSquare, StickyNote, ArrowLeft,
    User, Calendar, Home, AlertCircle, ChevronRight, Send,
    Brain, Target, TrendingUp, Zap, ShieldCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import StackedAlerts from '../../components/shared/StackedAlerts'
import './DealRoom.css'

const DEAL = {
    id: 3,
    address: '2215 Tremont Dr',
    city: 'Louisville, KY 40205',
    price: 567000,
    status: 'under_contract',
    statusLabel: 'Bajo Contrato',
    statusColor: '#8B5CF6',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    realtor: 'Miriam Castaño',
    realtorAvatar: '/assets/agents/Miriam Castano.png',
    realtorTitle: 'Asesora Residencial',
    listDate: '2024-12-18',
    beds: 5, baths: 4, sqft: 3200,
    commissionTotal: 17010,
    commissionBroker: 8505,
    commissionRealtor: 8505,
    splitPct: 50,
    paymentStatus: 'pending',
    documents: [
        { name: 'Listing Agreement', status: 'approved', date: '2024-12-18' },
        { name: 'Disclosure Statement', status: 'approved', date: '2024-12-20' },
        { name: 'Pre-Approval Letter', status: 'approved', date: '2025-01-02' },
        { name: 'Contrato Compra-Venta', status: 'approved', date: '2025-01-05' },
        { name: 'Inspección', status: 'uploaded', date: '2025-01-12' },
        { name: 'Tasación', status: 'pending', date: null },
        { name: 'HUD / Settlement', status: 'pending', date: null },
    ],
    timeline: [
        { action: 'Miriam subió Inspección', type: 'doc', time: 'Hoy, 10:30 AM' },
        { action: 'Broker aprobó Contrato Compra-Venta', type: 'approval', time: 'Ayer, 3:15 PM' },
        { action: 'Miriam envió mensaje: "Inspección lista"', type: 'message', time: 'Ayer, 2:00 PM' },
        { action: 'Status cambió a Bajo Contrato', type: 'status', time: '5 Ene, 11:00 AM' },
        { action: 'Miriam subió Pre-Approval Letter', type: 'doc', time: '2 Ene, 9:45 AM' },
        { action: 'Broker aprobó Disclosure Statement', type: 'approval', time: '21 Dic, 4:30 PM' },
        { action: 'Miriam subió Disclosure Statement', type: 'doc', time: '20 Dic, 10:00 AM' },
        { action: 'Transacción creada — Listada', type: 'status', time: '18 Dic, 8:00 AM' },
    ],
    messages: [
        { id: 1, sender: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', text: 'La inspección ya está lista, la subí al sistema. Todo bien, sin issues mayores.', time: '10:30 AM', mine: false },
        { id: 2, sender: 'Broker', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', text: 'Perfecto, la reviso hoy. ¿El comprador está satisfecho?', time: '10:45 AM', mine: true },
        { id: 3, sender: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png', text: 'Sí, muy contento. Solo pidió que se arregle un issue menor en el HVAC pero el vendedor ya aceptó.', time: '11:02 AM', mine: false },
        { id: 4, sender: 'Broker', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', text: 'Excelente. Vamos a necesitar la tasación pronto para seguir avanzando.', time: '11:15 AM', mine: true },
    ],
    notes: 'Comprador calificado con pre-approval de $600K. Vendedor motivado, acepta closing costs del 3%. Miriam maneja la relación directa con title company.',
}

const DOC_ICONS = {
    approved: { icon: CheckCircle2, color: '#10B981', label: 'Aprobado' },
    uploaded: { icon: Eye, color: '#3B82F6', label: 'En revisión' },
    pending: { icon: Clock, color: '#9CA3AF', label: 'Pendiente' },
}

const TIMELINE_ICONS = {
    doc: { icon: FileText, color: '#3B82F6' },
    approval: { icon: CheckCircle2, color: '#10B981' },
    message: { icon: MessageSquare, color: '#8B5CF6' },
    status: { icon: Home, color: '#F59E0B' },
}

const TABS = [
    { key: 'docs', label: 'Documentos', icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'commission', label: 'Comisión', icon: DollarSign },
    { key: 'people', label: 'People', icon: Users },
    { key: 'ai', label: 'ZhomesAI', icon: Brain },
]

/* AI Deal Intelligence Data */
const AI_DEAL_SCORE = 78
const AI_RADAR_DATA = [
    { axis: 'Docs', value: 71, label: 'Documentación' },
    { axis: 'Financ.', value: 90, label: 'Financiamiento' },
    { axis: 'Timing', value: 65, label: 'Timing' },
    { axis: 'Comms', value: 85, label: 'Comunicación' },
    { axis: 'Compli.', value: 72, label: 'Compliance' },
]
const AI_ALERTS = [
    { type: 'warning', text: 'Esta transacción lleva 12 días sin nuevos documentos — el promedio del equipo es 5 días.' },
    { type: 'danger', text: 'Falta la tasación — 68% de deals sin tasación a este punto sufren retraso de 2+ semanas.' },
    { type: 'success', text: 'Buen ritmo de comunicación — similar a 220 River Rd que cerró en 28 días.' },
    { type: 'info', text: 'El comprador tiene pre-approval de $600K — esto aumenta +15% la probabilidad de cierre.' },
]

export default function DealRoom() {
    const [activeTab, setActiveTab] = useState('docs')
    const deal = DEAL

    const approvedDocs = deal.documents.filter(d => d.status === 'approved').length
    const docPct = Math.round((approvedDocs / deal.documents.length) * 100)

    return (
        <div className="deal-room">
            {/* Back link */}
            <Link to="/transacciones" className="deal-back">
                <ArrowLeft size={16} />
                Volver a Transacciones
            </Link>

            {/* Hero header */}
            <div className="deal-hero">
                <div className="deal-hero-img">
                    <img src={deal.image} alt={deal.address} />
                    <div className="deal-hero-overlay">
                        <span className="deal-status-badge" style={{ background: deal.statusColor }}>
                            {deal.statusLabel}
                        </span>
                    </div>
                </div>
                <div className="deal-hero-info">
                    <h1 className="deal-address">{deal.address}</h1>
                    <div className="deal-city"><MapPin size={14} />{deal.city}</div>
                    <div className="deal-price">${deal.price.toLocaleString()}</div>
                    <div className="deal-specs">
                        <span>{deal.beds} hab</span>
                        <span>{deal.baths} baños</span>
                        <span>{deal.sqft.toLocaleString()} sqft</span>
                    </div>
                    <div className="deal-realtor-row">
                        <img src={deal.realtorAvatar} alt="" className="deal-realtor-avatar" />
                        <div>
                            <span className="deal-realtor-name">{deal.realtor}</span>
                            <span className="deal-realtor-title">{deal.realtorTitle}</span>
                        </div>
                    </div>
                    <div className="deal-progress-row">
                        <div className="deal-progress-track">
                            <div className="deal-progress-fill" style={{ width: `${docPct}%`, background: docPct === 100 ? '#10B981' : '#3B82F6' }}></div>
                        </div>
                        <span className="deal-progress-label">{approvedDocs}/{deal.documents.length} docs · {docPct}%</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="deal-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`deal-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="deal-tab-content">
                {/* Documents tab */}
                {activeTab === 'docs' && (
                    <div className="deal-docs animate-fadeInUp">
                        <div className="deal-dropzone">
                            <Upload size={18} />
                            <span>Subir documento a <strong>{deal.address}</strong></span>
                        </div>
                        <div className="deal-doc-list">
                            {deal.documents.map((doc, i) => {
                                const st = DOC_ICONS[doc.status]
                                return (
                                    <div key={i} className={`deal-doc-row ${doc.status}`}>
                                        <div className="deal-doc-icon">
                                            <FileText size={16} />
                                        </div>
                                        <div className="deal-doc-info">
                                            <span className="deal-doc-name">{doc.name}</span>
                                            <span className="deal-doc-date">{doc.date || 'Sin subir'}</span>
                                        </div>
                                        <span className="deal-doc-status" style={{ color: st.color, background: `${st.color}12` }}>
                                            <st.icon size={14} />
                                            {st.label}
                                        </span>
                                        <div className="deal-doc-actions">
                                            {doc.status === 'pending' ? (
                                                <button className="deal-action-btn upload"><Upload size={14} /> Subir</button>
                                            ) : doc.status === 'uploaded' ? (
                                                <>
                                                    <button className="deal-action-btn approve"><CheckCircle2 size={14} /> Aprobar</button>
                                                    <button className="deal-action-btn"><Eye size={14} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="deal-action-btn"><Eye size={14} /></button>
                                                    <button className="deal-action-btn"><Download size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Timeline tab */}
                {activeTab === 'timeline' && (
                    <div className="deal-timeline animate-fadeInUp">
                        {deal.timeline.map((event, i) => {
                            const t = TIMELINE_ICONS[event.type]
                            return (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-line"></div>
                                    <div className="timeline-dot" style={{ background: `${t.color}15`, color: t.color }}>
                                        <t.icon size={14} />
                                    </div>
                                    <div className="timeline-content">
                                        <span className="timeline-text">{event.action}</span>
                                        <span className="timeline-time">{event.time}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Chat tab */}
                {activeTab === 'chat' && (
                    <div className="deal-chat animate-fadeInUp">
                        <div className="deal-chat-messages">
                            {deal.messages.map(msg => (
                                <div key={msg.id} className={`deal-msg ${msg.mine ? 'mine' : ''}`}>
                                    {!msg.mine && <img src={msg.avatar} alt="" className="deal-msg-avatar" />}
                                    <div className="deal-msg-bubble">
                                        {!msg.mine && <span className="deal-msg-sender">{msg.sender}</span>}
                                        <p>{msg.text}</p>
                                        <span className="deal-msg-time">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="deal-chat-input">
                            <input type="text" placeholder="Escribe un mensaje..." />
                            <button className="deal-send-btn"><Send size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Commission tab */}
                {activeTab === 'commission' && (
                    <div className="deal-commission animate-fadeInUp">
                        <div className="comm-grid">
                            <div className="comm-card">
                                <span className="comm-label">Precio de Venta</span>
                                <span className="comm-value">${deal.price.toLocaleString()}</span>
                            </div>
                            <div className="comm-card">
                                <span className="comm-label">Comisión Total (3%)</span>
                                <span className="comm-value">${deal.commissionTotal.toLocaleString()}</span>
                            </div>
                            <div className="comm-card accent">
                                <span className="comm-label">Split Broker ({deal.splitPct}%)</span>
                                <span className="comm-value">${deal.commissionBroker.toLocaleString()}</span>
                            </div>
                            <div className="comm-card accent">
                                <span className="comm-label">Split Realtor ({deal.splitPct}%)</span>
                                <span className="comm-value">${deal.commissionRealtor.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="comm-status-row">
                            <span className="comm-status-label">Estado del Pago</span>
                            <span className="comm-status-badge pending">
                                <Clock size={14} /> Pendiente — Faltan documentos
                            </span>
                        </div>
                    </div>
                )}

                {/* Notes tab */}
                {activeTab === 'notes' && (
                    <div className="deal-notes animate-fadeInUp">
                        <textarea
                            className="deal-notes-area"
                            defaultValue={deal.notes}
                            placeholder="Agrega notas privadas sobre esta transacción..."
                        />
                        <button className="deal-notes-save">Guardar Notas</button>
                    </div>
                )}

                {/* ZhomesAI tab */}
                {activeTab === 'ai' && (
                    <div className="ai-intel-panel animate-fadeInUp">
                        {/* Deal Score */}
                        <div className="ai-score-section">
                            <div className="ai-score-ring">
                                <svg viewBox="0 0 120 120">
                                    <circle className="ai-score-track" cx="60" cy="60" r="50" />
                                    <circle
                                        className="ai-score-fill"
                                        cx="60" cy="60" r="50"
                                        stroke={AI_DEAL_SCORE >= 70 ? '#10B981' : AI_DEAL_SCORE >= 40 ? '#F59E0B' : '#EF4444'}
                                        strokeDasharray={`${(AI_DEAL_SCORE / 100) * 314} 314`}
                                    />
                                </svg>
                                <div className="ai-score-number">
                                    {AI_DEAL_SCORE}
                                    <small>de 100</small>
                                </div>
                            </div>
                            <div className="ai-score-details">
                                <span className="ai-score-title">Deal Score: Alto</span>
                                <span className="ai-score-subtitle">
                                    Basado en: docs completados, antigüedad, historial del realtor, precio vs mercado.
                                </span>
                                <div className="ai-score-prediction">
                                    <Calendar size={14} />
                                    Cierre estimado: 18 Febrero 2025
                                </div>
                            </div>
                        </div>

                        {/* Risk Radar */}
                        <div className="ai-radar-section">
                            <div className="ai-section-title">
                                <Target size={16} />
                                Risk Radar
                            </div>
                            <div className="ai-radar-wrap">
                                <svg className="ai-radar-svg" viewBox="0 0 240 240">
                                    {(() => {
                                        const cx = 120, cy = 115, maxR = 80
                                        const n = AI_RADAR_DATA.length
                                        const angleStep = (2 * Math.PI) / n
                                        const getPoint = (i, r) => ({
                                            x: cx + r * Math.sin(i * angleStep),
                                            y: cy - r * Math.cos(i * angleStep),
                                        })
                                        const gridLevels = [0.25, 0.5, 0.75, 1]
                                        return (
                                            <>
                                                {/* Grid pentagons */}
                                                {gridLevels.map((level, gi) => (
                                                    <polygon key={gi} className="radar-grid"
                                                        points={Array.from({ length: n }, (_, i) => {
                                                            const p = getPoint(i, maxR * level)
                                                            return `${p.x},${p.y}`
                                                        }).join(' ')}
                                                    />
                                                ))}
                                                {/* Axes */}
                                                {Array.from({ length: n }, (_, i) => {
                                                    const p = getPoint(i, maxR)
                                                    return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={p.x} y2={p.y} />
                                                })}
                                                {/* Data polygon */}
                                                <polygon className="radar-polygon-data"
                                                    points={AI_RADAR_DATA.map((d, i) => {
                                                        const p = getPoint(i, maxR * (d.value / 100))
                                                        return `${p.x},${p.y}`
                                                    }).join(' ')}
                                                />
                                                {/* Dots + Labels */}
                                                {AI_RADAR_DATA.map((d, i) => {
                                                    const dp = getPoint(i, maxR * (d.value / 100))
                                                    const lp = getPoint(i, maxR + 18)
                                                    return (
                                                        <g key={i}>
                                                            <circle className="radar-dot" cx={dp.x} cy={dp.y} r={4} />
                                                            <text className="radar-label" x={lp.x} y={lp.y + 3}>{d.axis}</text>
                                                            <text className="radar-label" x={lp.x} y={lp.y + 14} style={{ fontSize: 9, opacity: 0.6 }}>{d.value}%</text>
                                                        </g>
                                                    )
                                                })}
                                            </>
                                        )
                                    })()}
                                </svg>
                            </div>
                        </div>

                        {/* Smart Alerts */}
                        <div className="ai-alerts-section">
                            <StackedAlerts
                                alerts={AI_ALERTS}
                                title="Smart Alerts"
                                titleIcon={<Zap size={14} />}
                                variant="compact"
                            />
                        </div>

                        {/* Comparison vs Team */}
                        <div className="ai-comparison">
                            <div className="ai-section-title">
                                <TrendingUp size={16} />
                                vs. Promedio del Equipo
                            </div>
                            <div className="ai-comparison-grid">
                                <div className="ai-comp-item">
                                    <span className="ai-comp-label">Días en Pipeline</span>
                                    <div className="ai-comp-row">
                                        <span className="ai-comp-value">28</span>
                                        <span className="ai-comp-diff negative">+6 días</span>
                                    </div>
                                </div>
                                <div className="ai-comp-item">
                                    <span className="ai-comp-label">Docs Completados</span>
                                    <div className="ai-comp-row">
                                        <span className="ai-comp-value">71%</span>
                                        <span className="ai-comp-diff negative">-8%</span>
                                    </div>
                                </div>
                                <div className="ai-comp-item">
                                    <span className="ai-comp-label">Comunicación</span>
                                    <div className="ai-comp-row">
                                        <span className="ai-comp-value">Alto</span>
                                        <span className="ai-comp-diff positive">+12%</span>
                                    </div>
                                </div>
                                <div className="ai-comp-item">
                                    <span className="ai-comp-label">Deal Score</span>
                                    <div className="ai-comp-row">
                                        <span className="ai-comp-value">78</span>
                                        <span className="ai-comp-diff positive">+5 pts</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
