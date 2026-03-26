import { useState } from 'react'
import { FileText, Send, CheckCircle2, Clock, AlertCircle, Plus, X, User, Calendar, Download, Eye, Edit3, PenTool, ChevronRight, Shield } from 'lucide-react'
import './ESignaturesMobile.css'

const TEMPLATES = [
    { id: 1, name: 'Oferta de Compra', description: 'Contrato estándar de oferta para compra residencial', fields: 12, icon: '📝' },
    { id: 2, name: 'Acuerdo de Listado', description: 'Contrato de representación para vendedor', fields: 8, icon: '🏠' },
    { id: 3, name: 'Acuerdo de Representación', description: 'Contrato buyer agent para comprador', fields: 6, icon: '🤝' },
    { id: 4, name: 'Addendum de Inspección', description: 'Aditivo post-inspección con reparaciones', fields: 5, icon: '🔍' },
    { id: 5, name: 'Contraoferta', description: 'Respuesta formal a una oferta recibida', fields: 7, icon: '💰' },
    { id: 6, name: 'Disclosure de Propiedad', description: 'Declaración de condición del vendedor', fields: 15, icon: '📋' },
]

const DOCUMENTS = [
    { id: 101, title: 'Oferta - 4132 Craig Ave', template: 'Oferta de Compra', client: 'Rosa Gutiérrez', agent: 'Jessica Hernandez', agentAvatar: '/assets/agents/Jessica Hernandez.png', status: 'signed', sentDate: '2026-03-22', signedDate: '2026-03-23', signers: [{ name: 'Rosa Gutiérrez', signed: true }, { name: 'Gilbert Zaldivar', signed: true }] },
    { id: 102, title: 'Listado - 220 River Rd', template: 'Acuerdo de Listado', client: 'Pedro Sánchez', agent: 'Miriam C Castaño', agentAvatar: '/assets/agents/Miriam Castano.png', status: 'pending', sentDate: '2026-03-25', signedDate: null, signers: [{ name: 'Pedro Sánchez', signed: false }, { name: 'Gilbert Zaldivar', signed: true }] },
    { id: 103, title: 'Representación - Ana Martínez', template: 'Acuerdo de Representación', client: 'Ana Martínez', agent: 'Judith N Gonzalez', agentAvatar: '/assets/agents/Judith Gonzalez.png', status: 'draft', sentDate: null, signedDate: null, signers: [] },
    { id: 104, title: 'Inspección - 2215 Tremont Dr', template: 'Addendum de Inspección', client: 'Carlos Rodríguez', agent: 'Rocio Martinez', agentAvatar: '/assets/agents/Rocio Martinez.png', status: 'expired', sentDate: '2026-03-18', signedDate: null, signers: [{ name: 'Carlos Rodríguez', signed: false }] },
]

const STATUS_MAP = {
    draft: { label: 'Borrador', color: '#6B7280', icon: Edit3 },
    pending: { label: 'Pendiente Firma', color: '#F59E0B', icon: Clock },
    signed: { label: 'Firmado', color: '#10B981', icon: CheckCircle2 },
    expired: { label: 'Expirado', color: '#EF4444', icon: AlertCircle },
}

export default function ESignaturesMobile() {
    const [docs, setDocs] = useState(DOCUMENTS)
    const [view, setView] = useState('docs') // 'docs' | 'templates'
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [filter, setFilter] = useState('all')

    const filteredDocs = filter === 'all' ? docs : docs.filter(d => d.status === filter)

    const sendForSignature = (docId) => {
        setDocs(docs.map(d => d.id === docId ? {
            ...d,
            status: 'pending',
            sentDate: new Date().toISOString().split('T')[0],
            signers: [{ name: d.client, signed: false }, { name: 'Gilbert Zaldivar', signed: true }]
        } : d))
        if (selectedDoc?.id === docId) setSelectedDoc(null)
    }

    return (
        <>
            <div className="esign-page">
                <div className="esign-header">
                    <div className="esign-title-row">
                        <h1>Firmas</h1>
                        <button className="crm-add-btn" onClick={() => setShowCreate(true)}>
                            <Plus size={18} /> Crear
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="esign-stats">
                        <div className="esign-stat">
                            <PenTool size={14} />
                            <strong>{docs.length}</strong>
                            <span>Total</span>
                        </div>
                        <div className="esign-stat warn">
                            <Clock size={14} />
                            <strong>{docs.filter(d => d.status === 'pending').length}</strong>
                            <span>Pendientes</span>
                        </div>
                        <div className="esign-stat success">
                            <CheckCircle2 size={14} />
                            <strong>{docs.filter(d => d.status === 'signed').length}</strong>
                            <span>Firmados</span>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="crm-view-toggle">
                    <button className={view === 'docs' ? 'active' : ''} onClick={() => setView('docs')}>Documentos</button>
                    <button className={view === 'templates' ? 'active' : ''} onClick={() => setView('templates')}>Plantillas</button>
                </div>

                {view === 'docs' && (
                    <>
                        {/* Filters */}
                        <div className="crm-source-filters">
                            {['all', 'draft', 'pending', 'signed', 'expired'].map(f => (
                                <button key={f} className={`crm-source-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                    {f === 'all' ? 'Todos' : STATUS_MAP[f].label}
                                </button>
                            ))}
                        </div>

                        {/* Document List */}
                        <div className="esign-list">
                            {filteredDocs.map((doc, idx) => {
                                const status = STATUS_MAP[doc.status]
                                const StatusIcon = status.icon
                                return (
                                    <div
                                        key={doc.id}
                                        className="esign-card animate-fadeInUp"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="esign-card-left">
                                            <div className="esign-icon-wrap" style={{ background: `${status.color}15`, color: status.color }}>
                                                <StatusIcon size={18} />
                                            </div>
                                        </div>
                                        <div className="esign-card-info">
                                            <strong>{doc.title}</strong>
                                            <span className="esign-meta">{doc.template}</span>
                                            <div className="esign-card-row">
                                                <span className="esign-agent-mini">
                                                    <img src={doc.agentAvatar} alt="" />
                                                    {doc.agent.split(' ')[0]}
                                                </span>
                                                <span className="esign-status-pill" style={{ color: status.color, background: `${status.color}15` }}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="esign-chevron" />
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {view === 'templates' && (
                    <div className="esign-templates">
                        {TEMPLATES.map((t, idx) => (
                            <div key={t.id} className="esign-template-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <span className="esign-template-icon">{t.icon}</span>
                                <div className="esign-template-info">
                                    <strong>{t.name}</strong>
                                    <span>{t.description}</span>
                                    <span className="esign-template-fields">{t.fields} campos</span>
                                </div>
                                <button className="esign-use-btn" onClick={() => { setShowCreate(true) }}>
                                    Usar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ height: '100px' }} />
            </div>

            {/* Doc Detail */}
            {selectedDoc && (
                <div className="crm-modal-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>{selectedDoc.title}</h2>
                            <button onClick={() => setSelectedDoc(null)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="showing-detail-banner" style={{ background: `${STATUS_MAP[selectedDoc.status].color}15` }}>
                                <span style={{ color: STATUS_MAP[selectedDoc.status].color, fontWeight: 700 }}>
                                    {STATUS_MAP[selectedDoc.status].label}
                                </span>
                                {selectedDoc.sentDate && <span>Enviado: {selectedDoc.sentDate}</span>}
                            </div>

                            <div className="crm-detail-section">
                                <h4>Información</h4>
                                <div className="crm-detail-grid">
                                    <div className="crm-detail-item"><span>Plantilla</span><strong>{selectedDoc.template}</strong></div>
                                    <div className="crm-detail-item"><span>Cliente</span><strong>{selectedDoc.client}</strong></div>
                                    <div className="crm-detail-item"><span>Agente</span><strong>{selectedDoc.agent}</strong></div>
                                    <div className="crm-detail-item"><span>Firmado</span><strong>{selectedDoc.signedDate || '—'}</strong></div>
                                </div>
                            </div>

                            {selectedDoc.signers.length > 0 && (
                                <div className="crm-detail-section">
                                    <h4>Firmantes</h4>
                                    {selectedDoc.signers.map((s, i) => (
                                        <div key={i} className="esign-signer-row">
                                            <User size={16} />
                                            <span>{s.name}</span>
                                            {s.signed ?
                                                <CheckCircle2 size={16} color="#10B981" /> :
                                                <Clock size={16} color="#F59E0B" />
                                            }
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="esign-doc-actions">
                                {selectedDoc.status === 'draft' && (
                                    <button className="crm-submit-btn" onClick={() => sendForSignature(selectedDoc.id)}>
                                        <Send size={16} /> Enviar para Firma
                                    </button>
                                )}
                                {selectedDoc.status === 'signed' && (
                                    <button className="crm-submit-btn" style={{ background: '#3B82F6' }}>
                                        <Download size={16} /> Descargar PDF
                                    </button>
                                )}
                                {selectedDoc.status === 'pending' && (
                                    <div className="esign-pending-notice">
                                        <Shield size={16} />
                                        <span>Esperando firma de {selectedDoc.signers.find(s => !s.signed)?.name || 'firmantes'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Doc (simple prompt) */}
            {showCreate && (
                <div className="crm-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>Nuevo Documento</h2>
                            <button onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="esign-api-notice">
                                <Shield size={24} color="#3B82F6" />
                                <h3>Listo para Integrar</h3>
                                <p>Este módulo está preparado para conectar con DocuSign, HelloSign, o SignNow. Solo necesitamos configurar el API key del servicio de firmas electrónicas elegido.</p>
                                <div className="esign-providers">
                                    <div className="esign-provider">
                                        <strong>DocuSign</strong>
                                        <span>Enterprise — $25/mes</span>
                                    </div>
                                    <div className="esign-provider">
                                        <strong>HelloSign</strong>
                                        <span>Standard — $15/mes</span>
                                    </div>
                                    <div className="esign-provider">
                                        <strong>SignNow</strong>
                                        <span>Business — $8/mes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="crm-form-group">
                                <label>Seleccionar Plantilla</label>
                                <select className="crm-select">
                                    {TEMPLATES.map(t => <option key={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="crm-form-group">
                                <label>Cliente</label>
                                <input type="text" placeholder="Nombre del cliente" className="crm-select" />
                            </div>
                            <div className="crm-form-group">
                                <label>Email del cliente</label>
                                <input type="email" placeholder="email@ejemplo.com" className="crm-select" />
                            </div>
                            <button className="crm-submit-btn" onClick={() => setShowCreate(false)}>
                                <FileText size={16} /> Crear Borrador
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
