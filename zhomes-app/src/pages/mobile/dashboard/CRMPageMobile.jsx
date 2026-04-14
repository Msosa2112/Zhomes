import { useState, useEffect, useCallback } from 'react'
import {
    Users, Plus, Phone, Mail, ChevronRight, X, Search, Filter,
    MapPin, DollarSign, Clock, MessageSquare, FileText, Calendar,
    Trash2, CheckCircle2, Star, Home, Loader2, Send, ArrowRight
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './CRMPageMobile.css'

const PIPELINE_STAGES = [
    { id: 'new',         label: 'Nuevo Lead',   color: 'var(--text-secondary)', icon: Star },
    { id: 'contacted',   label: 'Contactado',   color: 'var(--text-secondary)', icon: Phone },
    { id: 'preapproved', label: 'Pre-Aprobado', color: '#06B6D4', icon: CheckCircle2 },
    { id: 'searching',   label: 'Buscando',     color: 'var(--text-secondary)', icon: Search },
    { id: 'offer',       label: 'Oferta',       color: '#F97316', icon: FileText },
    { id: 'closing',     label: 'Cierre',       color: '#10B981', icon: Home },
]

const SOURCES = ['Todos', 'Facebook', 'Instagram', 'Google Ads', 'Website', 'Referido', 'Zillow', 'Walk-in']

// Mapa de agentes: nombre → email
const AGENTS = [
    { name: 'Jessica Hernandez',  email: 'jessica@zhomesre.com' },
    { name: 'Miriam C Castaño',   email: 'miriam@zhomesre.com' },
    { name: 'Judith N Gonzalez',  email: 'judith@zhomesre.com' },
    { name: 'Rocio Martinez',     email: 'rocio@zhomesre.com' },
    { name: 'Ernesto Cougil',     email: 'ernesto@zhomesre.com' },
]

export default function CRMPageMobile() {
    const [leads, setLeads] = useState([])
    const [agents, setAgents] = useState(AGENTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [showAddLead, setShowAddLead] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [transferAgent, setTransferAgent] = useState('')
    const [transferring, setTransferring] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterSource, setFilterSource] = useState('Todos')
    const [activeStage, setActiveStage] = useState(null)

    const [newLead, setNewLead] = useState({
        name: '', phone: '', email: '', source: 'Website',
        language: 'Español', budget: '', area: '', notes: ''
    })

    // ── Cargar agentes reales de Supabase ────────────────────
    useEffect(() => {
        supabase
            .from('zhomes_agents')
            .select('full_name, email')
            .eq('status', 'Active')
            .then(({ data }) => {
                if (data && data.length > 0) {
                    setAgents(data.map(a => ({ name: a.full_name, email: a.email })))
                }
            })
    }, [])

    // ── Cargar leads desde Supabase ──────────────────────────
    const fetchLeads = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('crm_leads')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error) setLeads(data || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    // ── Filtros ──────────────────────────────────────────────
    const filteredLeads = leads.filter(l => {
        const matchSearch =
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.agent || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchSource = filterSource === 'Todos' || l.source === filterSource
        return matchSearch && matchSource
    })

    const getStageLeads = (stageId) => filteredLeads.filter(l => l.stage === stageId)

    // ── CRUD ─────────────────────────────────────────────────
    const addLead = async () => {
        if (!newLead.name.trim()) return
        setSaving(true)
        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase
            .from('crm_leads')
            .insert([{ ...newLead, stage: 'new', priority: 'medium', created_by: session?.user?.id ?? null }])
            .select().single()
        if (!error && data) setLeads(prev => [data, ...prev])
        setNewLead({ name: '', phone: '', email: '', source: 'Website', language: 'Español', budget: '', area: '', notes: '' })
        setShowAddLead(false)
        setSaving(false)
    }

    const moveLead = async (leadId, newStage) => {
        const today = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('crm_leads').update({ stage: newStage, last_contact: today }).eq('id', leadId)
        if (!error) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage, last_contact: today } : l))
            if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, stage: newStage }))
        }
    }

    const deleteLead = async (id) => {
        const { error } = await supabase.from('crm_leads').delete().eq('id', id)
        if (!error) {
            setLeads(prev => prev.filter(l => l.id !== id))
            setSelectedLead(null)
        }
    }

    const assignAgent = async (leadId, agentName) => {
        const { error } = await supabase.from('crm_leads').update({ agent: agentName }).eq('id', leadId)
        if (!error) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, agent: agentName } : l))
            if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, agent: agentName }))
        }
    }

    // ── TRANSFERIR LEAD A AGENTE ─────────────────────────────
    const transferLead = async () => {
        if (!selectedLead || !transferAgent) return
        const agentRecord = agents.find(a => a.name === transferAgent)
        if (!agentRecord?.email) return alert('No se encontró el email del agente.')

        setTransferring(true)
        try {
            // 1. Insertar en realtor_leads del agente destino
            const { error: insertErr } = await supabase.from('realtor_leads').insert([{
                agent_email: agentRecord.email,
                agent_name: agentRecord.name,
                name: selectedLead.name,
                phone: selectedLead.phone,
                email: selectedLead.email,
                status: 'new',
                type: 'buyer',
                source: selectedLead.source || 'CRM Transfer',
                notes: selectedLead.notes,
                last_contact: 'Transferido hoy',
            }])
            if (insertErr) throw insertErr

            // 2. Marcar en CRM como transferido
            const { error: updateErr } = await supabase.from('crm_leads').update({
                transferred_to: agentRecord.email,
                transferred_at: new Date().toISOString(),
                agent: agentRecord.name,
            }).eq('id', selectedLead.id)
            if (updateErr) throw updateErr

            setLeads(prev => prev.map(l =>
                l.id === selectedLead.id
                    ? { ...l, agent: agentRecord.name, transferred_to: agentRecord.email }
                    : l
            ))
            setShowTransfer(false)
            setTransferAgent('')
            alert(` Lead transferido a ${agentRecord.name}`)
        } catch (err) {
            alert('Error al transferir: ' + err.message)
        } finally {
            setTransferring(false)
        }
    }

    const daysSince = (dateStr) => {
        if (!dateStr) return null
        const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
        return diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : `Hace ${diff} días`
    }

    if (loading) {
        return (
            <div className="crm-page">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Cargando leads...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="crm-page">
            {/* Header */}
            <div className="crm-header">
                <div className="crm-title-row">
                    <div>
                        <h1>CRM</h1>
                        <p>{leads.length} leads en el pipeline</p>
                    </div>
                    <button className="crm-add-btn" onClick={() => setShowAddLead(true)}>
                        <Plus size={18} /> Nuevo Lead
                    </button>
                </div>
                <div className="crm-search">
                    <Search size={16} />
                    <input
                        placeholder="Buscar por nombre, email o agente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} /></button>}
                </div>
                <div className="crm-filters">
                    {SOURCES.map(s => (
                        <button
                            key={s}
                            className={`crm-filter-chip ${filterSource === s ? 'active' : ''}`}
                            onClick={() => setFilterSource(s)}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* Stage Summary Pills */}
            <div className="crm-stats-row">
                {PIPELINE_STAGES.map(stage => (
                    <button
                        key={stage.id}
                        className={`crm-stage-pill ${activeStage === stage.id ? 'active' : ''}`}
                        style={{ '--stage-color': stage.color }}
                        onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                    >
                        <span className="crm-stage-count">{getStageLeads(stage.id).length}</span>
                        <span>{stage.label}</span>
                    </button>
                ))}
            </div>

            {/* Pipeline Columns */}
            <div className="crm-pipeline">
                {PIPELINE_STAGES
                    .filter(s => !activeStage || s.id === activeStage)
                    .map(stage => {
                        const stageLeads = getStageLeads(stage.id)
                        const Icon = stage.icon
                        return (
                            <div key={stage.id} className="crm-column">
                                <div className="crm-column-header" style={{ '--stage-color': stage.color }}>
                                    <Icon size={14} />
                                    <span>{stage.label}</span>
                                    <span className="crm-column-count">{stageLeads.length}</span>
                                </div>
                                <div className="crm-column-body">
                                    {stageLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            className={`crm-lead-card priority-${lead.priority} ${lead.transferred_to ? 'transferred' : ''}`}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <div className="crm-lead-top">
                                                <div className="crm-lead-avatar">
                                                    {lead.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="crm-lead-info">
                                                    <strong>{lead.name}</strong>
                                                    <span>{lead.source} · {lead.language}</span>
                                                </div>
                                            </div>
                                            {lead.budget && (
                                                <div className="crm-lead-budget">
                                                    <DollarSign size={12} /> {lead.budget}
                                                </div>
                                            )}
                                            {lead.area && (
                                                <div className="crm-lead-area">
                                                    <MapPin size={12} /> {lead.area}
                                                </div>
                                            )}
                                            <div className="crm-lead-footer">
                                                {lead.transferred_to ? (
                                                    <span className="crm-transferred-tag">
                                                        <Send size={10} /> {lead.agent?.split(' ')[0]}
                                                    </span>
                                                ) : lead.agent ? (
                                                    <span className="crm-agent-tag">{lead.agent.split(' ')[0]}</span>
                                                ) : (
                                                    <span className="crm-no-agent">Sin asignar</span>
                                                )}
                                                {lead.last_contact && (
                                                    <span className="crm-last-contact">
                                                        <Clock size={10} /> {daysSince(lead.last_contact)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {stageLeads.length === 0 && (
                                        <div className="crm-empty-stage">Sin leads</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="crm-modal-overlay" onClick={() => { setSelectedLead(null); setShowTransfer(false) }}>
                    <div className="crm-modal" onClick={e => e.stopPropagation()}>
                        <div className="crm-modal-header">
                            <div>
                                <h2>{selectedLead.name}</h2>
                                <span className="crm-modal-source">{selectedLead.source} · {selectedLead.language}</span>
                            </div>
                            <button onClick={() => { setSelectedLead(null); setShowTransfer(false) }}><X size={20} /></button>
                        </div>
                        <div className="crm-modal-body">

                            {/* Transferido badge */}
                            {selectedLead.transferred_to && (
                                <div className="crm-transferred-banner">
                                    <Send size={14} />
                                    Transferido a <strong>{selectedLead.agent}</strong>
                                </div>
                            )}

                            {/* Contact */}
                            <div className="crm-detail-section">
                                <h4>Contacto</h4>
                                {selectedLead.phone && (
                                    <a href={`tel:${selectedLead.phone}`} className="crm-detail-row clickable">
                                        <Phone size={16} /> {selectedLead.phone}
                                    </a>
                                )}
                                {selectedLead.email && (
                                    <a href={`mailto:${selectedLead.email}`} className="crm-detail-row clickable">
                                        <Mail size={16} /> {selectedLead.email}
                                    </a>
                                )}
                                {selectedLead.phone && (
                                    <a href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`} className="crm-detail-row clickable" target="_blank" rel="noreferrer">
                                        <MessageSquare size={16} /> WhatsApp
                                    </a>
                                )}
                            </div>

                            {/* Details */}
                            <div className="crm-detail-section">
                                <h4>Detalles</h4>
                                {selectedLead.budget && <div className="crm-detail-row"><DollarSign size={16} /> {selectedLead.budget}</div>}
                                {selectedLead.area && <div className="crm-detail-row"><MapPin size={16} /> {selectedLead.area}</div>}
                                <div className="crm-detail-row"><Calendar size={16} /> Creado: {selectedLead.created_at?.split('T')[0]}</div>
                                {selectedLead.last_contact && (
                                    <div className="crm-detail-row"><Clock size={16} /> Último contacto: {daysSince(selectedLead.last_contact)}</div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedLead.notes && (
                                <div className="crm-detail-section">
                                    <h4>Notas</h4>
                                    <p className="crm-notes-text">{selectedLead.notes}</p>
                                </div>
                            )}

                            {/* Move Stage */}
                            <div className="crm-detail-section">
                                <h4>Mover en Pipeline</h4>
                                <div className="crm-stage-buttons">
                                    {PIPELINE_STAGES.map(s => (
                                        <button
                                            key={s.id}
                                            className={`crm-stage-btn ${selectedLead.stage === s.id ? 'active' : ''}`}
                                            style={{ '--stage-color': s.color }}
                                            onClick={() => moveLead(selectedLead.id, s.id)}
                                        >{s.label}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Assign Agent */}
                            <div className="crm-detail-section">
                                <h4>Agente Asignado</h4>
                                <select
                                    className="crm-select"
                                    value={selectedLead.agent || ''}
                                    onChange={e => assignAgent(selectedLead.id, e.target.value)}
                                >
                                    <option value="">Sin asignar</option>
                                    {agents.map(a => <option key={a.email} value={a.name}>{a.name}</option>)}
                                </select>
                            </div>

                            {/* Transfer Lead */}
                            <div className="crm-detail-section">
                                <h4>Transferir Lead a Agente</h4>
                                {!showTransfer ? (
                                    <button className="crm-transfer-btn" onClick={() => setShowTransfer(true)}>
                                        <ArrowRight size={16} /> Transferir a un Agente
                                    </button>
                                ) : (
                                    <div className="crm-transfer-form">
                                        <select
                                            className="crm-select"
                                            value={transferAgent}
                                            onChange={e => setTransferAgent(e.target.value)}
                                        >
                                            <option value="">Selecciona un agente...</option>
                                            {agents.map(a => <option key={a.email} value={a.name}>{a.name}</option>)}
                                        </select>
                                        <div className="crm-transfer-actions">
                                            <button
                                                className="crm-transfer-confirm"
                                                onClick={transferLead}
                                                disabled={!transferAgent || transferring}
                                            >
                                                {transferring ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                                                {transferring ? 'Transfiriendo...' : 'Confirmar Transferencia'}
                                            </button>
                                            <button className="crm-transfer-cancel" onClick={() => setShowTransfer(false)}>
                                                Cancelar
                                            </button>
                                        </div>
                                        <p className="crm-transfer-note">
                                            El lead aparecerá en el portal del agente y quedará marcado como transferido en el CRM.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Delete */}
                            <button className="crm-delete-btn" onClick={() => { if (window.confirm('¿Eliminar este lead?')) deleteLead(selectedLead.id) }}>
                                <Trash2 size={16} /> Eliminar Lead
                            </button>
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
                        <div className="crm-modal-body form">
                            <input type="text" placeholder="Nombre completo *" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
                            <input type="tel" placeholder="Teléfono" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
                            <input type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                            <input type="text" placeholder="Presupuesto (ej. $150K–$200K)" value={newLead.budget} onChange={e => setNewLead({ ...newLead, budget: e.target.value })} />
                            <input type="text" placeholder="Zona de interés (ej. Shively)" value={newLead.area} onChange={e => setNewLead({ ...newLead, area: e.target.value })} />
                            <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}>
                                <option>Facebook</option><option>Instagram</option><option>Google Ads</option>
                                <option>Website</option><option>Referido</option><option>Zillow</option><option>Walk-in</option>
                            </select>
                            <select value={newLead.language} onChange={e => setNewLead({ ...newLead, language: e.target.value })}>
                                <option>Español</option><option>English</option>
                            </select>
                            <textarea placeholder="Notas..." rows={3} value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} />
                            <button className="crm-save-btn" onClick={addLead} disabled={!newLead.name.trim() || saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                {saving ? 'Guardando...' : 'Guardar Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: 100 }} />
        </div>
    )
}
