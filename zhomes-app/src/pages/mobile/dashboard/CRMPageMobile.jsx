import { useState, useRef } from 'react'
import { Users, Plus, Phone, Mail, ChevronRight, X, Search, Filter, User, MapPin, DollarSign, Clock, MessageSquare, FileText, Calendar, Edit3, Trash2, CheckCircle2, AlertCircle, Star, Home } from 'lucide-react'
import './CRMPageMobile.css'

const PIPELINE_STAGES = [
    { id: 'new', label: 'Nuevo Lead', color: '#8B5CF6', icon: Star },
    { id: 'contacted', label: 'Contactado', color: '#3B82F6', icon: Phone },
    { id: 'preapproved', label: 'Pre-Aprobado', color: '#06B6D4', icon: CheckCircle2 },
    { id: 'searching', label: 'Buscando', color: '#F59E0B', icon: Search },
    { id: 'offer', label: 'Oferta', color: '#F97316', icon: FileText },
    { id: 'closing', label: 'Cierre', color: '#10B981', icon: Home },
]

const INITIAL_LEADS = [
    { id: 1, name: 'María López', phone: '(502) 555-0201', email: 'maria.lopez@gmail.com', stage: 'new', source: 'Facebook', agent: 'Jessica Hernandez', language: 'Español', budget: '$150K-$200K', area: 'Shively', notes: 'Busca casa 3BR, tiene 2 hijos', created: '2026-03-24', lastContact: null, priority: 'high' },
    { id: 2, name: 'Carlos Rodríguez', phone: '(502) 555-0202', email: 'carlos.r@gmail.com', stage: 'contacted', source: 'Referido', agent: 'Miriam C Castaño', language: 'Español', budget: '$200K-$300K', area: 'St. Matthews', notes: 'Primera vez comprando, necesita pre-aprobación', created: '2026-03-20', lastContact: '2026-03-22', priority: 'medium' },
    { id: 3, name: 'Ana Martínez', phone: '(502) 555-0203', email: 'ana.m@hotmail.com', stage: 'preapproved', source: 'Website', agent: 'Judith N Gonzalez', language: 'Español', budget: '$180K-$250K', area: 'South End', notes: 'Pre-aprobada por $225K con FHA', created: '2026-03-15', lastContact: '2026-03-24', priority: 'high' },
    { id: 4, name: 'John Smith', phone: '(502) 555-0204', email: 'john.s@email.com', stage: 'searching', source: 'Zillow', agent: 'Rocio Martinez', language: 'English', budget: '$300K-$400K', area: 'Prospect', notes: 'Quiere casa con piscina, mínimo 4BR', created: '2026-03-10', lastContact: '2026-03-23', priority: 'medium' },
    { id: 5, name: 'Rosa Gutiérrez', phone: '(502) 555-0205', email: 'rosa.g@gmail.com', stage: 'offer', source: 'Instagram', agent: 'Jessica Hernandez', language: 'Español', budget: '$160K-$190K', area: 'Valley Station', notes: 'Oferta en 4132 Craig Ave, esperando respuesta del vendedor', created: '2026-03-01', lastContact: '2026-03-25', priority: 'high' },
    { id: 6, name: 'Pedro Sánchez', phone: '(502) 555-0206', email: 'pedro.s@yahoo.com', stage: 'closing', source: 'Referido', agent: 'Miriam C Castaño', language: 'Español', budget: '$220K', area: 'Jeffersontown', notes: 'Cierre programado para 03/28. Documentos completos.', created: '2026-02-15', lastContact: '2026-03-25', priority: 'high' },
    { id: 7, name: 'Laura Díaz', phone: '(502) 555-0207', email: 'laura.d@gmail.com', stage: 'new', source: 'Walk-in', agent: null, language: 'Español', budget: '$100K-$150K', area: 'South Louisville', notes: 'Visitó la oficina, primer hogar', created: '2026-03-25', lastContact: null, priority: 'medium' },
    { id: 8, name: 'James Wilson', phone: '(502) 555-0208', email: 'j.wilson@email.com', stage: 'contacted', source: 'Google Ads', agent: 'Ernesto Cougil', language: 'English', budget: '$250K-$350K', area: 'Middletown', notes: 'Reubicación desde Ohio, busca en buenos distritos escolares', created: '2026-03-22', lastContact: '2026-03-24', priority: 'low' },
]

const SOURCES = ['Todos', 'Facebook', 'Instagram', 'Google Ads', 'Website', 'Referido', 'Zillow', 'Walk-in']

export default function CRMPageMobile() {
    const [leads, setLeads] = useState(INITIAL_LEADS)
    const [selectedLead, setSelectedLead] = useState(null)
    const [showAddLead, setShowAddLead] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterSource, setFilterSource] = useState('Todos')
    const [activeStage, setActiveStage] = useState(null)
    const scrollRef = useRef(null)

    // New lead form
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'Website', language: 'Español', budget: '', area: '', notes: '' })

    const filteredLeads = leads.filter(l => {
        const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.agent && l.agent.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchSource = filterSource === 'Todos' || l.source === filterSource
        return matchSearch && matchSource
    })

    const getStageLeads = (stageId) => filteredLeads.filter(l => l.stage === stageId)

    const moveLead = (leadId, newStage) => {
        setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage, lastContact: new Date().toISOString().split('T')[0] } : l))
    }

    const addLead = () => {
        if (!newLead.name.trim()) return
        const lead = {
            id: Date.now(),
            ...newLead,
            stage: 'new',
            agent: null,
            created: new Date().toISOString().split('T')[0],
            lastContact: null,
            priority: 'medium'
        }
        setLeads([lead, ...leads])
        setNewLead({ name: '', phone: '', email: '', source: 'Website', language: 'Español', budget: '', area: '', notes: '' })
        setShowAddLead(false)
    }

    const deleteLead = (id) => {
        setLeads(leads.filter(l => l.id !== id))
        setSelectedLead(null)
    }

    const assignAgent = (leadId, agentName) => {
        setLeads(leads.map(l => l.id === leadId ? { ...l, agent: agentName } : l))
    }

    const daysSince = (dateStr) => {
        if (!dateStr) return null
        const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
        return diff
    }

    const stageStats = PIPELINE_STAGES.map(s => ({ ...s, count: getStageLeads(s.id).length }))
    const totalValue = leads.reduce((sum, l) => {
        const match = l.budget.match(/\$(\d+)K/i)
        return sum + (match ? parseInt(match[1]) * 1000 : 0)
    }, 0)

    return (
        <>
            <div className="crm-page">
                {/* Header */}
                <div className="crm-header">
                    <div className="crm-title-row">
                        <h1>CRM</h1>
                        <button className="crm-add-btn" onClick={() => setShowAddLead(true)}>
                            <Plus size={18} /> Nuevo Lead
                        </button>
                    </div>

                    {/* KPI Pills */}
                    <div className="crm-kpi-row">
                        <div className="crm-kpi">
                            <Users size={14} />
                            <strong>{leads.length}</strong>
                            <span>Leads</span>
                        </div>
                        <div className="crm-kpi">
                            <DollarSign size={14} />
                            <strong>${(totalValue / 1000).toFixed(0)}K</strong>
                            <span>Pipeline</span>
                        </div>
                        <div className="crm-kpi hot">
                            <Star size={14} />
                            <strong>{leads.filter(l => l.priority === 'high').length}</strong>
                            <span>Calientes</span>
                        </div>
                        <div className="crm-kpi">
                            <AlertCircle size={14} />
                            <strong>{leads.filter(l => !l.agent).length}</strong>
                            <span>Sin Asignar</span>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="crm-controls">
                    <div className="crm-search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar lead, email, agente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="crm-source-filters">
                        {SOURCES.map(s => (
                            <button key={s} className={`crm-source-pill ${filterSource === s ? 'active' : ''}`} onClick={() => setFilterSource(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List View */}
                <div className="crm-list-view">
                        {filteredLeads.map((lead, idx) => {
                            const stage = PIPELINE_STAGES.find(s => s.id === lead.stage)
                            return (
                                <div
                                    key={lead.id}
                                    className="crm-list-row animate-fadeInUp"
                                    style={{ animationDelay: `${idx * 0.03}s` }}
                                    onClick={() => setSelectedLead(lead)}
                                >
                                    <div className="crm-list-avatar">
                                        <User size={18} />
                                    </div>
                                    <div className="crm-list-info">
                                        <strong>{lead.name}</strong>
                                        <span>{lead.agent || 'Sin asignar'} · {lead.area}</span>
                                    </div>
                                    <div className="crm-list-stage" style={{ background: `${stage.color}15`, color: stage.color }}>
                                        {stage.label}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                <div style={{ height: '100px' }} />
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="crm-modal-overlay" onClick={() => setSelectedLead(null)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>{selectedLead.name}</h2>
                            <button onClick={() => setSelectedLead(null)}><X size={20} /></button>
                        </div>

                        <div className="crm-modal-body">
                            {/* Contact Info */}
                            <div className="crm-detail-section">
                                <h4>Contacto</h4>
                                <a href={`tel:${selectedLead.phone}`} className="crm-detail-row clickable">
                                    <Phone size={16} /> {selectedLead.phone}
                                </a>
                                <a href={`mailto:${selectedLead.email}`} className="crm-detail-row clickable">
                                    <Mail size={16} /> {selectedLead.email}
                                </a>
                            </div>

                            {/* Lead Info */}
                            <div className="crm-detail-section">
                                <h4>Información</h4>
                                <div className="crm-detail-grid">
                                    <div className="crm-detail-item">
                                        <span>Idioma</span>
                                        <strong>{selectedLead.language}</strong>
                                    </div>
                                    <div className="crm-detail-item">
                                        <span>Presupuesto</span>
                                        <strong>{selectedLead.budget}</strong>
                                    </div>
                                    <div className="crm-detail-item">
                                        <span>Zona</span>
                                        <strong>{selectedLead.area}</strong>
                                    </div>
                                    <div className="crm-detail-item">
                                        <span>Fuente</span>
                                        <strong>{selectedLead.source}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Agent */}
                            <div className="crm-detail-section">
                                <h4>Agente Asignado</h4>
                                <select
                                    className="crm-select"
                                    value={selectedLead.agent || ''}
                                    onChange={e => {
                                        assignAgent(selectedLead.id, e.target.value || null)
                                        setSelectedLead({ ...selectedLead, agent: e.target.value || null })
                                    }}
                                >
                                    <option value="">Sin asignar</option>
                                    <option>Miriam C Castaño</option>
                                    <option>Jessica Hernandez</option>
                                    <option>Judith N Gonzalez</option>
                                    <option>Rocio Martinez</option>
                                    <option>Ernesto Cougil</option>
                                    <option>Leidys Herrera</option>
                                    <option>Pavel V Reyes</option>
                                    <option>Teresa Verdecia</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="crm-detail-section">
                                <h4>Notas</h4>
                                <p className="crm-notes-text">{selectedLead.notes}</p>
                            </div>

                            {/* Stage Move */}
                            <div className="crm-detail-section">
                                <h4>Mover a Etapa</h4>
                                <div className="crm-stage-buttons">
                                    {PIPELINE_STAGES.map(s => (
                                        <button
                                            key={s.id}
                                            className={`crm-move-btn ${selectedLead.stage === s.id ? 'current' : ''}`}
                                            style={{ '--stage-color': s.color }}
                                            onClick={() => {
                                                moveLead(selectedLead.id, s.id)
                                                setSelectedLead({ ...selectedLead, stage: s.id })
                                            }}
                                        >
                                            <s.icon size={14} />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="crm-detail-actions">
                                <button className="crm-action-btn danger" onClick={() => deleteLead(selectedLead.id)}>
                                    <Trash2 size={16} /> Eliminar Lead
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Modal */}
            {showAddLead && (
                <div className="crm-modal-overlay" onClick={() => setShowAddLead(false)}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <h2>Nuevo Lead</h2>
                            <button onClick={() => setShowAddLead(false)}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">
                            <div className="crm-form-group">
                                <label>Nombre completo *</label>
                                <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} placeholder="María García" />
                            </div>
                            <div className="crm-form-row">
                                <div className="crm-form-group">
                                    <label>Teléfono</label>
                                    <input type="tel" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} placeholder="(502) 555-0000" />
                                </div>
                                <div className="crm-form-group">
                                    <label>Email</label>
                                    <input type="email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} placeholder="email@gmail.com" />
                                </div>
                            </div>
                            <div className="crm-form-row">
                                <div className="crm-form-group">
                                    <label>Fuente</label>
                                    <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}>
                                        {SOURCES.filter(s => s !== 'Todos').map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="crm-form-group">
                                    <label>Idioma</label>
                                    <select value={newLead.language} onChange={e => setNewLead({ ...newLead, language: e.target.value })}>
                                        <option>Español</option>
                                        <option>English</option>
                                        <option>Ambos</option>
                                    </select>
                                </div>
                            </div>
                            <div className="crm-form-row">
                                <div className="crm-form-group">
                                    <label>Presupuesto</label>
                                    <input type="text" value={newLead.budget} onChange={e => setNewLead({ ...newLead, budget: e.target.value })} placeholder="$150K-$200K" />
                                </div>
                                <div className="crm-form-group">
                                    <label>Zona</label>
                                    <input type="text" value={newLead.area} onChange={e => setNewLead({ ...newLead, area: e.target.value })} placeholder="Shively" />
                                </div>
                            </div>
                            <div className="crm-form-group">
                                <label>Notas</label>
                                <textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} placeholder="Detalles sobre lo que busca..." rows={3} />
                            </div>
                            <button className="crm-submit-btn" onClick={addLead} disabled={!newLead.name.trim()}>
                                <Plus size={18} /> Crear Lead
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
