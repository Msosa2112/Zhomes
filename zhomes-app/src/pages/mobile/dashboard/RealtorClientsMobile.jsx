import { useState, useEffect } from 'react'
import { CheckCircle2, ChevronRight, X, User, Phone, Mail, FolderHeart, DollarSign, Home, Shield, UploadCloud, AlertCircle, Search, Compass, MapPin, Key, Heart, Calendar, Sparkles } from 'lucide-react'
import './RealtorClientsMobile.css'

// Simulated Database
const INITIAL_CLIENTS = [
    { 
        id: 1, 
        name: 'Carlos Rivera', 
        email: 'carlosr@email.com', 
        phone: '(305) 555-0192', 
        status: 'pending', // Pending realtors approval
    },
    { 
        id: 2, 
        name: 'Laura Méndez', 
        email: 'laura.m@email.com', 
        phone: '(786) 555-0204', 
        status: 'active', // Approved client
        pipelineStep: 'pre-approved', // 'exploring', 'pre-approved', 'offering', 'contract', 'closed'
        preApproval: {
            amount: 450000,
            documentsComplete: true
        },
        clientVault: [
            { id: 101, name: 'Pre-Aprobación Bancaria.pdf', date: 'Oct 24, 2025' },
            { id: 102, name: 'Identificación Oficial.jpg', date: 'Oct 24, 2025' },
            { id: 103, name: 'Proof_of_Funds.pdf', date: 'Oct 25, 2025' }
        ],
        realtorDocs: [
            { id: 201, name: 'Guía del Comprador.pdf', date: 'Oct 22, 2025' }
        ],
        favoritesCount: 14,
        likedPropertiesCount: 22,
        openHousesCount: 3,
        savedProperties: [
            { id: 1001, address: '123 Ocean Drive, Miami FL', price: '$450,000', beds: 3, baths: 2, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop' },
            { id: 1002, address: '456 Brickell Ave, Miami FL', price: '$550,000', beds: 2, baths: 2, img: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=400&h=300&fit=crop' },
            { id: 1004, address: '888 Collins Ave, Miami FL', price: '$510,000', beds: 2, baths: 1, img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop' }
        ],
        aiMatches: [
            { id: 2001, address: '999 Riverside Dr, Miami FL', price: '$425,000', beds: 3, baths: 2, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop', matchReason: 'Match: Precio bajo su Pre-Aprobación ($450k) y 3 hab.' },
            { id: 2002, address: '777 Bayshore Dr, Miami FL', price: '$440,000', beds: 2, baths: 2, img: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=400&h=300&fit=crop', matchReason: 'Match: Diseño similar a favoritos y buena zona.' }
        ],
        openHouses: [
            { id: 1003, address: '789 Coral Way, Coral Gables FL', date: 'Dom 14 Nov, 10:00 AM', price: '$650,000', img: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop' }
        ]
    },
    { 
        id: 3, 
        name: 'Andrés López', 
        email: 'andresl@email.com', 
        phone: '(305) 555-9988', 
        status: 'active',
        pipelineStep: 'contract',
        preApproval: {
            amount: 650000,
            documentsComplete: true
        },
        clientVault: [
            { id: 104, name: 'Pre-Aprobación Bancaria.pdf', date: 'Sep 10, 2025' },
            { id: 105, name: 'ID_Andres.png', date: 'Sep 10, 2025' }
        ],
        realtorDocs: [
            { id: 202, name: 'Contrato de Compraventa Firmado.pdf', date: 'Oct 15, 2025' },
            { id: 203, name: 'Reporte de Inspección.pdf', date: 'Oct 28, 2025' }
        ],
        favoritesCount: 3,
        likedPropertiesCount: 8,
        openHousesCount: 0,
        savedProperties: [
            { id: 1005, address: '100 Sunset Blvd, Miami FL', price: '$850,000', beds: 4, baths: 3, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop' }
        ],
        aiMatches: [],
        openHouses: []
    }
]

const PIPELINE_STEPS = [
    { id: 'exploring', label: 'Explorando', desc: 'Buscando propiedades y zona ideal.', icon: Search },
    { id: 'pre-approved', label: 'Pre-Aprobado', desc: 'Presupuesto confirmado por banco.', icon: Shield },
    { id: 'offering', label: 'En Oferta', desc: 'Presentando ofertas formales.', icon: MapPin },
    { id: 'contract', label: 'Bajo Contrato', desc: 'Inspecciones, avalúos y papeleo final.', icon: Key },
    { id: 'closed', label: 'Cerrado', desc: '¡Llaves entregadas!', icon: Home }
]

export default function RealtorClientsMobile() {
    const [clients, setClients] = useState(INITIAL_CLIENTS)
    const [viewTab, setViewTab] = useState('active') // 'pending' | 'active'
    
    // Workspace state
    const [selectedClient, setSelectedClient] = useState(null)
    const [workspaceTab, setWorkspaceTab] = useState('overview') // 'overview' | 'pipeline' | 'documents' | 'properties'
    const [propertyFilter, setPropertyFilter] = useState('saved') // 'saved' | 'ai_matches' | 'open_houses'

    // Mock notification toast
    const [toastMsg, setToastMsg] = useState('')

    const showToast = (msg) => {
        setToastMsg(msg)
        setTimeout(() => setToastMsg(''), 3000)
    }

    const pendingClients = clients.filter(c => c.status === 'pending')
    const activeClients = clients.filter(c => c.status === 'active')

    const approveClient = (id) => {
        setClients(prev => prev.map(c => {
            if (c.id === id) {
                return { 
                    ...c, 
                    status: 'active', 
                    pipelineStep: 'exploring',
                    preApproval: { amount: 0, documentsComplete: false },
                    clientVault: [],
                    realtorDocs: [],
                    favoritesCount: 0,
                    likedPropertiesCount: 0,
                    openHousesCount: 0,
                    savedProperties: [],
                    aiMatches: [],
                    openHouses: []
                }
            }
            return c
        }))
        showToast('¡Cliente Aprobado Exitosamente!')
    }

    const advancePipeline = () => {
        if (!selectedClient) return
        const currentIndex = PIPELINE_STEPS.findIndex(s => s.id === selectedClient.pipelineStep)
        if (currentIndex < PIPELINE_STEPS.length - 1) {
            const nextStep = PIPELINE_STEPS[currentIndex + 1].id
            
            // Local state update
            setSelectedClient(prev => ({ ...prev, pipelineStep: nextStep }))
            
            // Global state update
            setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, pipelineStep: nextStep } : c))
            showToast(`El pipeline se actualizó a: ${PIPELINE_STEPS[currentIndex + 1].label}`)
        }
    }

    const uploadRealtorDoc = () => {
        if (!selectedClient) return
        const newDoc = { id: Date.now(), name: 'Nuevo Documento.pdf', date: 'Reciente' }
        
        setSelectedClient(prev => ({ ...prev, realtorDocs: [newDoc, ...(prev.realtorDocs || [])] }))
        setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, realtorDocs: [newDoc, ...(c.realtorDocs || [])] } : c))
        
        showToast('Documento subido. Notificación enviada al cliente.')
    }

    const getStatusBadge = (stepId) => {
        const step = PIPELINE_STEPS.find(s => s.id === stepId)
        if (!step) return null
        const colors = {
            'exploring': '#3B82F6',
            'pre-approved': '#8B5CF6',
            'offering': '#F59E0B',
            'contract': '#EC4899',
            'closed': '#10B981'
        }
        return (
            <span className="rc-status-badge" style={{ background: `${colors[stepId]}1A`, color: colors[stepId] }}>
                {step.label}
            </span>
        )
    }

    return (
        <div className="rc-page">
            <div className="rc-header">
                <h1>Mis Clientes</h1>
                <p>Gestiona aprobaciones, documentos y el progreso de tus clientes.</p>
            </div>

            <div className="rc-tabs">
                <button className={`rc-tab ${viewTab === 'active' ? 'active' : ''}`} onClick={() => setViewTab('active')}>
                    Activos ({activeClients.length})
                </button>
                <button className={`rc-tab ${viewTab === 'pending' ? 'active' : ''}`} onClick={() => setViewTab('pending')}>
                    Solicitudes ({pendingClients.length})
                </button>
            </div>

            {viewTab === 'pending' && (
                <div className="rc-list">
                    {pendingClients.length === 0 ? <p style={{color:'var(--text-secondary)'}}>No hay solicitudes pendientes.</p> : null}
                    {pendingClients.map(client => (
                        <div key={client.id} className="rc-client-card">
                            <div className="rc-client-info">
                                <div className="rc-avatar">{client.name.charAt(0)}</div>
                                <div className="rc-details">
                                    <h3>{client.name}</h3>
                                    <p>{client.phone}</p>
                                </div>
                            </div>
                            <button className="rc-btn-primary" onClick={() => approveClient(client.id)}>
                                <CheckCircle2 size={16} /> Aprobar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {viewTab === 'active' && (
                <div className="rc-list">
                    {activeClients.map(client => (
                        <div key={client.id} className="rc-client-card" style={{cursor: 'pointer'}} onClick={() => {
                            setSelectedClient(client)
                            setWorkspaceTab('overview')
                        }}>
                            <div className="rc-client-info">
                                <div className="rc-avatar">{client.name.charAt(0)}</div>
                                <div className="rc-details">
                                    <h3>{client.name}</h3>
                                    <p>{getStatusBadge(client.pipelineStep)}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--text-tertiary)" />
                        </div>
                    ))}
                </div>
            )}

            {/* Client Detail Modal Workspace */}
            {selectedClient && (
                <div className="rc-modal-overlay">
                    <div className="rc-modal animate-fadeInUp">
                        <div className="rc-modal-header">
                            <button className="rc-modal-close" onClick={() => setSelectedClient(null)}>
                                <X size={20} />
                            </button>
                            <h2>{selectedClient.name}</h2>
                            <p style={{display:'flex', gap:'12px', marginTop:'8px', alignItems:'center'}}>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Phone size={14}/> {selectedClient.phone}</span>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Mail size={14}/> {selectedClient.email}</span>
                            </p>
                        </div>

                        <div className="rc-modal-tabs" style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
                            <button className={`rc-modal-tab ${workspaceTab === 'overview' ? 'active' : ''}`} onClick={() => setWorkspaceTab('overview')}>General</button>
                            <button className={`rc-modal-tab ${workspaceTab === 'properties' ? 'active' : ''}`} onClick={() => setWorkspaceTab('properties')}>Propiedades</button>
                            <button className={`rc-modal-tab ${workspaceTab === 'pipeline' ? 'active' : ''}`} onClick={() => setWorkspaceTab('pipeline')}>Pipeline</button>
                            <button className={`rc-modal-tab ${workspaceTab === 'documents' ? 'active' : ''}`} onClick={() => setWorkspaceTab('documents')}>Documentos</button>
                        </div>

                        <div className="rc-modal-body">
                            {workspaceTab === 'overview' && (
                                <div className="rc-overview-grid">
                                    <div className="rc-info-card">
                                        <div className="rc-info-header"><DollarSign size={18} color="#10b981"/> Pre-Aprobación</div>
                                        <div className="rc-info-val">
                                            {selectedClient.preApproval?.amount > 0 
                                                ? `$${selectedClient.preApproval.amount.toLocaleString()}`
                                                : 'Sin Evaluar'}
                                        </div>
                                    </div>
                                    <div className="rc-info-card">
                                        <div className="rc-info-header"><Shield size={18} color="#8B5CF6"/> Bóveda del Cliente</div>
                                        <div className="rc-info-val" style={{fontSize: '16px'}}>
                                            {selectedClient.preApproval?.documentsComplete ? 'Completa ✓' : 'Faltan documentos'}
                                        </div>
                                    </div>
                                    <div className="rc-info-card clickable" onClick={() => { setWorkspaceTab('properties'); setPropertyFilter('saved'); }}>
                                        <div className="rc-info-header"><FolderHeart size={18} color="var(--zhomes-red)"/> Propiedades Guardadas</div>
                                        <div className="rc-info-val">{selectedClient.savedProperties?.length || 0} Casas</div>
                                    </div>
                                    <div className="rc-info-card clickable" onClick={() => { setWorkspaceTab('properties'); setPropertyFilter('ai_matches'); }}>
                                        <div className="rc-info-header"><Sparkles size={18} color="#F59E0B"/> Sugerencias IA ✨</div>
                                        <div className="rc-info-val" style={{color: '#F59E0B'}}>{selectedClient.aiMatches?.length || 0} Matches</div>
                                    </div>
                                    <div className="rc-info-card clickable" onClick={() => { setWorkspaceTab('properties'); setPropertyFilter('open_houses'); }}>
                                        <div className="rc-info-header"><Calendar size={18} color="#3B82F6"/> Open Houses Agend.</div>
                                        <div className="rc-info-val">{selectedClient.openHouses?.length || 0} Visitas</div>
                                    </div>
                                </div>
                            )}

                            {workspaceTab === 'properties' && (
                                <div className="rc-properties-view">
                                    <div className="rc-filter-tabs">
                                        <button className={`rc-filter-tab ${propertyFilter === 'saved' ? 'active' : ''}`} onClick={() => setPropertyFilter('saved')}>Guardadas</button>
                                        <button className={`rc-filter-tab ${propertyFilter === 'ai_matches' ? 'active' : ''}`} onClick={() => setPropertyFilter('ai_matches')}>Sugerencias IA ✨</button>
                                        <button className={`rc-filter-tab ${propertyFilter === 'open_houses' ? 'active' : ''}`} onClick={() => setPropertyFilter('open_houses')}>Open Houses</button>
                                    </div>

                                    <div className="rc-property-list">
                                        {propertyFilter === 'saved' && (
                                            <>
                                                {(!selectedClient.savedProperties || selectedClient.savedProperties.length === 0) && <p style={{color:'var(--text-secondary)'}}>No hay propiedades guardadas.</p>}
                                                {(selectedClient.savedProperties || []).map(p => (
                                                    <div key={p.id} className="rc-property-card">
                                                        <img src={p.img} alt={p.address} className="rc-property-img" />
                                                        <div className="rc-property-details">
                                                            <h4>{p.address}</h4>
                                                            <p>{p.beds} Beds • {p.baths} Baths</p>
                                                            <div className="rc-property-price">{p.price}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {propertyFilter === 'ai_matches' && (
                                            <>
                                                {(!selectedClient.aiMatches || selectedClient.aiMatches.length === 0) && <p style={{color:'var(--text-secondary)'}}>La IA aún está analizando este perfil...</p>}
                                                {(selectedClient.aiMatches || []).map(p => (
                                                    <div key={p.id} className="rc-property-card" style={{borderColor: '#F59E0B33', background: '#F59E0B05'}}>
                                                        <img src={p.img} alt={p.address} className="rc-property-img" />
                                                        <div className="rc-property-details">
                                                            <h4>{p.address}</h4>
                                                            <p style={{fontSize: '12px', fontWeight: 600, color: '#F59E0B', marginBottom: '4px'}}>✨ {p.matchReason}</p>
                                                            <div className="rc-property-price">{p.price}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {propertyFilter === 'open_houses' && (
                                            <>
                                                {(!selectedClient.openHouses || selectedClient.openHouses.length === 0) && <p style={{color:'var(--text-secondary)'}}>No hay open houses agendados.</p>}
                                                {(selectedClient.openHouses || []).map(p => (
                                                    <div key={p.id} className="rc-property-card">
                                                        <img src={p.img} alt={p.address} className="rc-property-img" />
                                                        <div className="rc-property-details">
                                                            <h4>{p.address}</h4>
                                                            <p style={{color: '#3B82F6', fontWeight: 600}}>🗓 {p.date}</p>
                                                            <div className="rc-property-price">{p.price}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {workspaceTab === 'pipeline' && (
                                <>
                                    <p style={{marginBottom:'24px', color:'var(--text-secondary)'}}>
                                        El avance del pipeline se sincroniza automáticamente con la app del cliente para mantenerlo informado de su progreso inmobiliario.
                                    </p>
                                    <div className="rc-pipeline">
                                        {PIPELINE_STEPS.map((step, index) => {
                                            const isActive = step.id === selectedClient.pipelineStep
                                            const stepIndex = PIPELINE_STEPS.findIndex(s => s.id === step.id)
                                            const currentIndex = PIPELINE_STEPS.findIndex(s => s.id === selectedClient.pipelineStep)
                                            const isDone = stepIndex < currentIndex

                                            return (
                                                <div key={step.id} className={`rc-pipe-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                                    {index !== PIPELINE_STEPS.length - 1 && <div className="rc-pipe-line" />}
                                                    <div className="rc-pipe-dot">
                                                        {isDone ? <CheckCircle2 size={16} /> : <step.icon size={12} color={isActive ? "white" : "currentColor"} />}
                                                    </div>
                                                    <div className="rc-pipe-content">
                                                        <h4>{step.label}</h4>
                                                        <p>{step.desc}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {selectedClient.pipelineStep !== 'closed' && (
                                        <button className="rc-action-btn" onClick={advancePipeline}>
                                            Avanzar Pipeline a siguiente fase
                                        </button>
                                    )}
                                </>
                            )}

                            {workspaceTab === 'documents' && (
                                <div>
                                    <div className="rc-section-title"><Shield size={18} color="#8B5CF6"/> Bóveda del Cliente</div>
                                    <p style={{color:'var(--text-secondary)', fontSize:'13px', marginBottom:'16px'}}>
                                        Documentos privados resguardados por el cliente. Solo lectura.
                                    </p>
                                    <div className="rc-doc-list">
                                        {selectedClient.clientVault.length === 0 ? <p style={{color:'var(--text-tertiary)', fontSize:'14px'}}>La bóveda está vacía.</p> : null}
                                        {selectedClient.clientVault.map(doc => (
                                            <div key={doc.id} className="rc-doc-item">
                                                <div className="rc-doc-icon"><CheckCircle2 size={24} color="#8B5CF6"/></div>
                                                <div>
                                                    <div className="rc-doc-name">{doc.name}</div>
                                                    <div className="rc-doc-meta">Subido: {doc.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rc-separator" />

                                    <div className="rc-section-title"><UploadCloud size={18} color="var(--zhomes-red)"/> Documentos del Realtor</div>
                                    <p style={{color:'var(--text-secondary)', fontSize:'13px', marginBottom:'16px'}}>
                                        Carga contratos, aprobaciones y alertas. Estos se aislarán en la sección "Realtor Docs" del cliente.
                                    </p>
                                    
                                    <div className="rc-doc-list">
                                        {selectedClient.realtorDocs.map(doc => (
                                            <div key={doc.id} className="rc-doc-item">
                                                <div className="rc-doc-icon" style={{color:'var(--zhomes-red)'}}><AlertCircle size={24}/></div>
                                                <div>
                                                    <div className="rc-doc-name">{doc.name}</div>
                                                    <div className="rc-doc-meta">Enviado: {doc.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rc-upload-zone" onClick={uploadRealtorDoc}>
                                        <UploadCloud size={32} color="var(--zhomes-red)" />
                                        <p><strong>Tocar para Subir Documento</strong><br/>Selecciona un archivo PDF o Imagen.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Simulated Notification Toast Area */}
            {toastMsg && (
                <div style={{
                    position:'fixed', bottom:'80px', left:'24px', right:'24px',
                    background:'#333', color:'white', padding:'12px 16px',
                    borderRadius:'8px', zIndex: 99999,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                    display:'flex', alignItems:'center', gap:'12px',
                    fontWeight:500, fontSize:'14px'
                }}>
                    <CheckCircle2 color="#10b981" size={20} />
                    {toastMsg}
                </div>
            )}
        </div>
    )
}
