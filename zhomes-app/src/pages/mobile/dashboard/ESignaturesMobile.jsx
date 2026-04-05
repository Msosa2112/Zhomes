import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Send, CheckCircle2, Clock, AlertCircle, Plus, X, User, Download, Edit3, PenTool, ChevronRight, Shield, ExternalLink } from 'lucide-react'
import { DocusealForm } from '@docuseal/react'
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
        template: 'Contrato Residencial (Miami-Dade)', 
        client: 'Marcos de la Torre', 
        agent: 'Jessica Hernandez', 
        agentAvatar: '/assets/agents/Jessica Hernandez.png', 
        status: 'pending', 
        sentDate: new Date().toISOString().split('T')[0], 
        signedDate: null, 
        signers: [{ name: 'Marcos de la Torre', signed: false }, { name: 'Gilbert Zaldivar', signed: true }] 
    },
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
    const initialDocs = DOCUMENTS;

    const [docs, setDocs] = useState(initialDocs)
    const [view, setView] = useState('docs') // 'docs' | 'templates'
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [filter, setFilter] = useState('all')
    const [signingDoc, setSigningDoc] = useState(null)

    const filteredDocs = filter === 'all' ? docs : docs.filter(d => d.status === filter)

    const confirmCompletion = () => {
        if (!signingDoc) return;
        setDocs(docs.map(d => d.id === signingDoc.id ? {
            ...d,
            status: 'signed',
            signedDate: new Date().toISOString().split('T')[0],
            signers: d.signers.map(s => ({ ...s, signed: true }))
        } : d))
        setSigningDoc(null);
    };

    useEffect(() => {
        const handleMessage = (event) => {
            // Verificar si el mensaje viene de DocuSeal
            if (event.data?.type === 'docuseal:completed' || event.data?.event === 'completed' || event.data === 'docuseal:completed') {
                console.log('Firma completada detectada:', event.data);
                if (signingDoc) confirmCompletion();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [signingDoc, docs]);

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
                            {filteredDocs.length === 0 && (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                    <p style={{ margin: 0, fontWeight: 600 }}>No hay documentos</p>
                                    <p style={{ fontSize: '14px', marginTop: '8px' }}>No tienes contratos o firmas en este estado.</p>
                                </div>
                            )}
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
            {selectedDoc && createPortal(
                <div className="crm-modal-overlay" onClick={() => setSelectedDoc(null)} style={{ zIndex: 999999 }}>
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
                                    <button 
                                        className="crm-submit-btn" 
                                        style={{ background: '#3B82F6' }}
                                        onClick={() => {
                                            if (selectedDoc.pdfUrl) {
                                                const a = document.createElement('a');
                                                a.href = selectedDoc.pdfUrl;
                                                a.download = `${selectedDoc.title.replace(/\s+/g, '_')}_Firmado.pdf`;
                                                a.click();
                                            } else {
                                                alert("El archivo PDF original se encuentra accesible mediante el proveedor E-Sign.");
                                            }
                                        }}
                                    >
                                        <Download size={16} /> Descargar PDF
                                    </button>
                                )}
                                {selectedDoc.status === 'pending' && (
                                    <>
                                        <button className="crm-submit-btn" style={{ background: '#F59E0B' }} onClick={() => setSigningDoc(selectedDoc)}>
                                            <PenTool size={16} /> Firmar Ahora
                                        </button>
                                        <div className="esign-pending-notice">
                                            <Shield size={16} />
                                            <span>Esperando firma de {selectedDoc.signers.find(s => !s.signed)?.name || 'firmantes'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create New Doc (simple prompt) */}
            {showCreate && createPortal(
                <div className="crm-modal-overlay" onClick={() => setShowCreate(false)} style={{ zIndex: 999999 }}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>Nuevo Documento</h2>
                            <button onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="esign-api-notice">
                                <Shield size={24} color="#3B82F6" />
                                <h3>Integración e-Sign</h3>
                                <p>Elije un proveedor certificado (DocuSign, DotLoop, HelloSign) para gestionar estos contratos con validez legal nativa.</p>
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
                </div>,
                document.body
            )}

            {signingDoc && createPortal(
                <div 
                    className="docuseal-overlay" 
                    style={{ 
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: '#000', 
                        zIndex: 999999, // Super high z-index
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div className="docuseal-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: '#fff', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#000' }}>{signingDoc.title}</h3>
                        <button 
                            onClick={() => setSigningDoc(null)} 
                            style={{ background: 'none', border: 'none', color: '#666', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <X size={18} /> Cancelar y Cerrar
                        </button>
                    </div>
                    {/* Contenedor del Iframe */}
                    {/* Modal Alternativo Gratuito (Abre en Nueva Pestaña) */}
                    <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                        
                        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
                            <div style={{ width: '60px', height: '60px', background: '#E3F2FD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#1a73e8' }}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Firma Electrónica Segura</h3>
                            <p style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                                Serás redirigido al portal seguro de DocuSeal para trazar tu firma. Una vez que termines, vuelve a esta pantalla.
                            </p>

                            <button 
                                onClick={() => {
                                    const docusealUrl = `https://docuseal-railway-production-97d8.up.railway.app/d/nzWzy3TSqNZgQr?email=${encodeURIComponent(signingDoc.clientEmail || '')}&name=${encodeURIComponent(signingDoc.client || '')}`;
                                    window.open(docusealUrl, '_blank');
                                }}
                                style={{
                                    width: '100%', padding: '14px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <span>Abrir Documento y Firmar</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </button>

                            <button 
                                onClick={confirmCompletion}
                                style={{
                                    width: '100%', padding: '14px', background: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Ya firmé el documento
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
