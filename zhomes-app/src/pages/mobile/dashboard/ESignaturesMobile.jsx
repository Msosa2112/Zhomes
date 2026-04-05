import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    FileText, Send, CheckCircle2, Clock, AlertCircle, Plus, X,
    User, Download, Edit3, PenTool, ChevronRight, Shield, Filter
} from 'lucide-react'
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
    {
        id: 999,
        title: 'Acuerdo de Renta - 1300 Brickell Ave',
        template: 'Contrato Residencial',
        client: 'Marcos de la Torre',
        clientEmail: 'marcos@demo.com',
        agent: 'Jessica Hernandez',
        agentAvatar: '/assets/agents/Jessica Hernandez.png',
        status: 'pending',
        sentDate: new Date().toISOString().split('T')[0],
        signedDate: null,
        signers: [{ name: 'Marcos de la Torre', signed: false }, { name: 'Gilbert Zaldivar', signed: true }]
    },
    {
        id: 101,
        title: 'Oferta - 4132 Craig Ave',
        template: 'Oferta de Compra',
        client: 'Rosa Gutiérrez',
        clientEmail: 'rosa@demo.com',
        agent: 'Jessica Hernandez',
        agentAvatar: '/assets/agents/Jessica Hernandez.png',
        status: 'signed',
        sentDate: '2026-03-22',
        signedDate: '2026-03-23',
        signers: [{ name: 'Rosa Gutiérrez', signed: true }, { name: 'Gilbert Zaldivar', signed: true }]
    },
    {
        id: 102,
        title: 'Listado - 220 River Rd',
        template: 'Acuerdo de Listado',
        client: 'Pedro Sánchez',
        clientEmail: 'pedro@demo.com',
        agent: 'Miriam C Castaño',
        agentAvatar: '/assets/agents/Miriam Castano.png',
        status: 'pending',
        sentDate: '2026-03-25',
        signedDate: null,
        signers: [{ name: 'Pedro Sánchez', signed: false }, { name: 'Gilbert Zaldivar', signed: true }]
    },
    {
        id: 103,
        title: 'Representación - Ana Martínez',
        template: 'Acuerdo de Representación',
        client: 'Ana Martínez',
        clientEmail: 'ana@demo.com',
        agent: 'Judith N Gonzalez',
        agentAvatar: '/assets/agents/Judith Gonzalez.png',
        status: 'draft',
        sentDate: null,
        signedDate: null,
        signers: []
    },
    {
        id: 104,
        title: 'Inspección - 2215 Tremont Dr',
        template: 'Addendum de Inspección',
        client: 'Carlos Rodríguez',
        clientEmail: 'carlos@demo.com',
        agent: 'Rocio Martinez',
        agentAvatar: '/assets/agents/Rocio Martinez.png',
        status: 'expired',
        sentDate: '2026-03-18',
        signedDate: null,
        signers: [{ name: 'Carlos Rodríguez', signed: false }]
    },
]

const STATUS_MAP = {
    draft:   { label: 'Borrador',        color: '#6B7280', icon: Edit3 },
    pending: { label: 'Pendiente Firma', color: '#F59E0B', icon: Clock },
    signed:  { label: 'Firmado',         color: '#10B981', icon: CheckCircle2 },
    expired: { label: 'Expirado',        color: '#EF4444', icon: AlertCircle },
}

export default function ESignaturesMobile() {
    const [docs, setDocs] = useState(DOCUMENTS)
    const [view, setView] = useState('docs')
    const [filter, setFilter] = useState('all')
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [signingDoc, setSigningDoc] = useState(null)

    const filteredDocs = filter === 'all' ? docs : docs.filter(d => d.status === filter)

    const confirmCompletion = (docId) => {
        setDocs(prev => prev.map(d => d.id === docId ? {
            ...d,
            status: 'signed',
            signedDate: new Date().toISOString().split('T')[0],
            signers: d.signers.map(s => ({ ...s, signed: true }))
        } : d))
        setSigningDoc(null)
        setSelectedDoc(null)
    }

    const sendForSignature = (docId) => {
        setDocs(prev => prev.map(d => d.id === docId ? {
            ...d,
            status: 'pending',
            sentDate: new Date().toISOString().split('T')[0],
            signers: [{ name: d.client, signed: false }, { name: 'Gilbert Zaldivar', signed: true }]
        } : d))
        setSelectedDoc(null)
    }

    useEffect(() => {
        const handleMsg = (e) => {
            if (e.data?.type === 'docuseal:completed' || e.data === 'docuseal:completed') {
                if (signingDoc) confirmCompletion(signingDoc.id)
            }
        }
        window.addEventListener('message', handleMsg)
        return () => window.removeEventListener('message', handleMsg)
    }, [signingDoc])

    return (
        <div className="esign-root">
            {/* ── MAIN PAGE ── */}
            <div className="esign-page">
                {/* Header */}
                <div className="esign-header">
                    <div className="esign-title-row">
                        <h1>Firmas</h1>
                        <button className="esign-create-btn" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Crear
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

                {/* View Tabs */}
                <div className="esign-tabs">
                    <button className={view === 'docs' ? 'active' : ''} onClick={() => setView('docs')}>Documentos</button>
                    <button className={view === 'templates' ? 'active' : ''} onClick={() => setView('templates')}>Plantillas</button>
                </div>

                {/* Docs View */}
                {view === 'docs' && (
                    <>
                        {/* Filter Pills */}
                        <div className="esign-filters">
                            {['all', 'draft', 'pending', 'signed', 'expired'].map(f => (
                                <button
                                    key={f}
                                    className={`esign-filter-pill ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                    style={filter === f && f !== 'all' ? {
                                        background: `${STATUS_MAP[f].color}20`,
                                        color: STATUS_MAP[f].color,
                                        borderColor: `${STATUS_MAP[f].color}40`
                                    } : {}}
                                >
                                    {f === 'all' ? 'Todos' : STATUS_MAP[f].label}
                                </button>
                            ))}
                        </div>

                        {/* Doc List */}
                        <div className="esign-list">
                            {filteredDocs.length === 0 ? (
                                <div className="esign-empty">
                                    <FileText size={40} />
                                    <p>No hay documentos en este estado</p>
                                </div>
                            ) : (
                                filteredDocs.map((doc, idx) => {
                                    const status = STATUS_MAP[doc.status]
                                    const StatusIcon = status.icon
                                    return (
                                        <div
                                            key={doc.id}
                                            className="esign-card animate-fadeInUp"
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div className="esign-icon-wrap" style={{ background: `${status.color}15`, color: status.color }}>
                                                <StatusIcon size={18} />
                                            </div>
                                            <div className="esign-card-info">
                                                <strong>{doc.title}</strong>
                                                <span className="esign-meta">{doc.template}</span>
                                                <div className="esign-card-row">
                                                    <span className="esign-agent-mini">
                                                        <img src={doc.agentAvatar} alt="" />
                                                        {doc.agent.split(' ')[0]}
                                                    </span>
                                                    <span className="esign-pill" style={{ color: status.color, background: `${status.color}15` }}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="esign-chevron" />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </>
                )}

                {/* Templates View */}
                {view === 'templates' && (
                    <div className="esign-templates">
                        {TEMPLATES.map((t, idx) => (
                            <div key={t.id} className="esign-template-card animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <span className="esign-tpl-icon">{t.icon}</span>
                                <div className="esign-tpl-info">
                                    <strong>{t.name}</strong>
                                    <span>{t.description}</span>
                                    <span className="esign-tpl-fields">{t.fields} campos</span>
                                </div>
                                <button className="esign-use-btn" onClick={() => setShowCreate(true)}>Usar</button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ height: '110px' }} />
            </div>

            {/* ── DOC DETAIL MODAL ── */}
            {selectedDoc && createPortal(
                <div className="esign-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="esign-modal" onClick={e => e.stopPropagation()}>
                        <div className="esign-modal-header">
                            <h2>{selectedDoc.title}</h2>
                            <button className="esign-close-btn" onClick={() => setSelectedDoc(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="esign-modal-body">
                            {/* Status Banner */}
                            <div className="esign-status-banner" style={{ background: `${STATUS_MAP[selectedDoc.status].color}15`, borderColor: `${STATUS_MAP[selectedDoc.status].color}30` }}>
                                <span style={{ color: STATUS_MAP[selectedDoc.status].color, fontWeight: 700 }}>
                                    {STATUS_MAP[selectedDoc.status].label}
                                </span>
                                {selectedDoc.sentDate && <span>Enviado: {selectedDoc.sentDate}</span>}
                            </div>

                            {/* Info Grid */}
                            <div className="esign-info-section">
                                <h4>Información del Documento</h4>
                                <div className="esign-info-grid">
                                    <div><span>Plantilla</span><strong>{selectedDoc.template}</strong></div>
                                    <div><span>Cliente</span><strong>{selectedDoc.client}</strong></div>
                                    <div><span>Agente</span><strong>{selectedDoc.agent}</strong></div>
                                    <div><span>Firmado</span><strong>{selectedDoc.signedDate || '—'}</strong></div>
                                </div>
                            </div>

                            {/* Signers */}
                            {selectedDoc.signers.length > 0 && (
                                <div className="esign-info-section">
                                    <h4>Firmantes</h4>
                                    {selectedDoc.signers.map((s, i) => (
                                        <div key={i} className="esign-signer-row">
                                            <User size={15} />
                                            <span>{s.name}</span>
                                            {s.signed
                                                ? <CheckCircle2 size={16} color="#10B981" />
                                                : <Clock size={16} color="#F59E0B" />
                                            }
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="esign-actions">
                                {selectedDoc.status === 'draft' && (
                                    <button className="esign-action-btn primary" onClick={() => sendForSignature(selectedDoc.id)}>
                                        <Send size={16} /> Enviar para Firma
                                    </button>
                                )}
                                {selectedDoc.status === 'pending' && (
                                    <>
                                        <button className="esign-action-btn amber" onClick={() => { setSigningDoc(selectedDoc); setSelectedDoc(null) }}>
                                            <PenTool size={16} /> Firmar Ahora
                                        </button>
                                        <div className="esign-notice">
                                            <Shield size={14} />
                                            <span>Esperando firma de {selectedDoc.signers.find(s => !s.signed)?.name || 'firmantes'}</span>
                                        </div>
                                    </>
                                )}
                                {selectedDoc.status === 'signed' && (
                                    <button className="esign-action-btn blue" onClick={() => alert('El PDF firmado está disponible en el proveedor E-Sign.')}>
                                        <Download size={16} /> Descargar PDF
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── CREATE MODAL ── */}
            {showCreate && createPortal(
                <div className="esign-overlay" onClick={() => setShowCreate(false)}>
                    <div className="esign-modal" onClick={e => e.stopPropagation()}>
                        <div className="esign-modal-header">
                            <h2>Nuevo Documento</h2>
                            <button className="esign-close-btn" onClick={() => setShowCreate(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="esign-modal-body">
                            <div className="esign-api-notice">
                                <Shield size={24} color="#3B82F6" />
                                <h3>Integración E-Sign</h3>
                                <p>Conecta DocuSign, DotLoop o HelloSign para gestionar contratos con validez legal nativa.</p>
                            </div>
                            <div className="esign-form-group">
                                <label>Plantilla</label>
                                <select className="esign-select">
                                    {TEMPLATES.map(t => <option key={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="esign-form-group">
                                <label>Nombre del Cliente</label>
                                <input type="text" placeholder="Nombre completo" className="esign-select" />
                            </div>
                            <div className="esign-form-group">
                                <label>Email del Cliente</label>
                                <input type="email" placeholder="email@ejemplo.com" className="esign-select" />
                            </div>
                            <button className="esign-action-btn primary" style={{ marginTop: '8px' }} onClick={() => setShowCreate(false)}>
                                <FileText size={16} /> Crear Borrador
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── SIGNING MODAL ── */}
            {signingDoc && createPortal(
                <div className="esign-sign-overlay">
                    <div className="esign-sign-header">
                        <h3>{signingDoc.title}</h3>
                        <button onClick={() => setSigningDoc(null)}>
                            <X size={18} /> Cancelar
                        </button>
                    </div>
                    <div className="esign-sign-body">
                        <div className="esign-sign-card">
                            <div className="esign-sign-icon">✍️</div>
                            <h3>Firma Electrónica Segura</h3>
                            <p>Serás redirigido al portal seguro de DocuSeal para completar la firma. Una vez que termines, regresa aquí.</p>
                            <button
                                className="esign-action-btn primary"
                                onClick={() => {
                                    const url = `https://docuseal-railway-production-97d8.up.railway.app/d/nzWzy3TSqNZgQr?email=${encodeURIComponent(signingDoc.clientEmail || '')}&name=${encodeURIComponent(signingDoc.client || '')}`
                                    window.open(url, '_blank')
                                }}
                            >
                                Abrir Documento y Firmar →
                            </button>
                            <button
                                className="esign-action-btn outline"
                                onClick={() => confirmCompletion(signingDoc.id)}
                            >
                                Ya firmé el documento ✓
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
