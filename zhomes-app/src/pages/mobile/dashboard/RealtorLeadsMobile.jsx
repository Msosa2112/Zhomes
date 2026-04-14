import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, User, Phone, Mail, Clock, Filter, ChevronRight, MessageSquare, Briefcase, Calendar, Loader2, X, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './RealtorLeadsMobile.css'

export default function RealtorLeadsMobile() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [newLead, setNewLead] = useState({
        name: '', phone: '', email: '', type: 'buyer', source: 'Manual', notes: ''
    })
    const [agentEmail, setAgentEmail] = useState(null)

    const statusConfig = {
        new:       { label: 'Nuevo',         color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
        contacted: { label: 'Contactado',     color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
        showing:   { label: 'Viendo Casas',   color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
        offer:     { label: 'En Oferta',      color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
        closed:    { label: 'Cerrado',        color: '#10B981', bg: 'var(--bg-secondary)' },
    }

    // ── Obtener email del agente autenticado ─────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email) setAgentEmail(session.user.email)
        })
    }, [])

    // ── Cargar leads del agente ──────────────────────────────
    const fetchLeads = useCallback(async () => {
        if (!agentEmail) return
        setLoading(true)
        const { data, error } = await supabase
            .from('realtor_leads')
            .select('*')
            .eq('agent_email', agentEmail)
            .order('created_at', { ascending: false })
        if (!error) setLeads(data || [])
        setLoading(false)
    }, [agentEmail])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    // ── Filtros ──────────────────────────────────────────────
    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.phone || '').includes(searchQuery) ||
            (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = activeFilter === 'all' || lead.status === activeFilter
        return matchesSearch && matchesStatus
    })

    // ── CRUD ─────────────────────────────────────────────────
    const handleAddLead = async () => {
        if (!newLead.name || !newLead.phone || !agentEmail) return
        setSaving(true)
        const { data, error } = await supabase
            .from('realtor_leads')
            .insert([{
                ...newLead,
                agent_email: agentEmail,
                status: 'new',
                last_contact: 'Justo ahora',
            }])
            .select().single()
        if (!error && data) setLeads(prev => [data, ...prev])
        setNewLead({ name: '', phone: '', email: '', type: 'buyer', source: 'Manual', notes: '' })
        setShowAddModal(false)
        setSaving(false)
    }

    const updateLeadStatus = async (id, status) => {
        const { error } = await supabase
            .from('realtor_leads')
            .update({ status, last_contact: 'Justo ahora' })
            .eq('id', id)
        if (!error) {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status, last_contact: 'Justo ahora' } : l))
            if (selectedLead?.id === id) setSelectedLead(prev => ({ ...prev, status }))
        }
    }

    const deleteLead = async (id) => {
        const { error } = await supabase.from('realtor_leads').delete().eq('id', id)
        if (!error) {
            setLeads(prev => prev.filter(l => l.id !== id))
            setSelectedLead(null)
        }
    }

    if (loading) {
        return (
            <div className="rt-leads-page">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Cargando tus leads...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rt-leads-page">
            <div className="rt-leads-header">
                <div>
                    <h1>Mis Leads</h1>
                    <p>{leads.length} contactos totales</p>
                </div>
                <button className="rt-leads-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Nuevo
                </button>
            </div>

            <div className="rt-leads-search-bar">
                <Search size={18} className="rt-search-icon" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rt-leads-filters">
                {[['all', 'Todos'], ['new', 'Nuevos'], ['contacted', 'Contactados'], ['showing', 'Viendo'], ['offer', 'Oferta'], ['closed', 'Cerrados']].map(([key, label]) => (
                    <button
                        key={key}
                        className={`rt-filter-chip ${key} ${activeFilter === key ? 'active' : ''}`}
                        onClick={() => setActiveFilter(key)}
                    >{label}</button>
                ))}
            </div>

            {filteredLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                    <User size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>{leads.length === 0 ? 'Aún no tienes leads. ¡Agrega el primero!' : 'No hay leads con este filtro.'}</p>
                </div>
            ) : (
                <div className="rt-leads-list">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className="rt-lead-card" onClick={() => setSelectedLead(lead)}>
                            <div className="rt-lead-info">
                                <div className="rt-lead-avatar">{lead.name.charAt(0)}</div>
                                <div className="rt-lead-details">
                                    <h3>{lead.name}</h3>
                                    <p>{lead.type === 'buyer' ? 'Comprador' : lead.type === 'seller' ? 'Vendedor' : 'Comprador & Vendedor'} · {lead.source}</p>
                                </div>
                            </div>
                            <div className="rt-lead-meta">
                                <span className="rt-lead-status" style={{ background: statusConfig[lead.status]?.bg, color: statusConfig[lead.status]?.color }}>
                                    {statusConfig[lead.status]?.label}
                                </span>
                                <ChevronRight size={18} color="#999" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="rt-modal-overlay" onClick={() => setSelectedLead(null)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <div>
                                <h2>{selectedLead.name}</h2>
                                <span className="rt-lead-status" style={{ display: 'inline-block', marginTop: 8, background: statusConfig[selectedLead.status]?.bg, color: statusConfig[selectedLead.status]?.color }}>
                                    {statusConfig[selectedLead.status]?.label}
                                </span>
                            </div>
                            <button onClick={() => setSelectedLead(null)}><X size={20} /></button>
                        </div>
                        <div className="rt-modal-actions">
                            {selectedLead.phone && <a href={`tel:${selectedLead.phone}`} className="rt-quick-action"><Phone size={18} /> Llamar</a>}
                            {selectedLead.phone && <a href={`sms:${selectedLead.phone}`} className="rt-quick-action"><MessageSquare size={18} /> SMS</a>}
                            {selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="rt-quick-action"><Mail size={18} /> Email</a>}
                        </div>
                        <div className="rt-modal-body">
                            <div className="rt-detail-section">
                                <h3>Detalles</h3>
                                {selectedLead.phone && <div className="rt-detail-item"><Phone size={16} /> <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a></div>}
                                {selectedLead.email && <div className="rt-detail-item"><Mail size={16} /> <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a></div>}
                                <div className="rt-detail-item">
                                    <Briefcase size={16} />
                                    {selectedLead.type === 'buyer' ? 'Comprador' : selectedLead.type === 'seller' ? 'Vendedor' : 'Doble Punta'}
                                </div>
                                <div className="rt-detail-item"><Filter size={16} /> Origen: {selectedLead.source}</div>
                                <div className="rt-detail-item"><Clock size={16} /> Último contacto: {selectedLead.last_contact || '—'}</div>
                            </div>

                            {selectedLead.notes && (
                                <div className="rt-detail-section">
                                    <h3>Notas</h3>
                                    <p className="rt-notes-text">{selectedLead.notes}</p>
                                </div>
                            )}

                            <div className="rt-detail-section">
                                <h3>Actualizar Estado</h3>
                                <div className="rt-status-updater">
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            className={`rt-status-btn ${selectedLead.status === key ? 'active' : ''}`}
                                            style={{
                                                borderColor: selectedLead.status === key ? config.color : '#E5E5E5',
                                                background: selectedLead.status === key ? config.bg : 'white',
                                                color: selectedLead.status === key ? config.color : '#666'
                                            }}
                                            onClick={() => updateLeadStatus(selectedLead.id, key)}
                                        >{config.label}</button>
                                    ))}
                                </div>
                            </div>

                            <button
                                style={{ width: '100%', padding: '12px', marginTop: 8, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                onClick={() => { if (window.confirm('¿Eliminar este lead?')) deleteLead(selectedLead.id) }}
                            >
                                <Trash2 size={16} /> Eliminar Lead
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="rt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Nuevo Lead</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="rt-modal-body form">
                            <input type="text" placeholder="Nombre completo *" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
                            <input type="tel" placeholder="Teléfono *" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
                            <input type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                            <select value={newLead.type} onChange={e => setNewLead({ ...newLead, type: e.target.value })}>
                                <option value="buyer">Comprador</option>
                                <option value="seller">Vendedor</option>
                                <option value="both">Ambos</option>
                            </select>
                            <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}>
                                <option value="Manual">Carga Manual</option>
                                <option value="Open House">Open House</option>
                                <option value="Referral">Referido</option>
                                <option value="Zillow">Zillow / Realtor.com</option>
                                <option value="Social Media">Redes Sociales</option>
                                <option value="CRM Transfer">Transferido por Broker</option>
                            </select>
                            <textarea placeholder="Notas, presupuesto, zonas de interés..." rows={3} value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} />
                            <button className="rt-btn-primary" onClick={handleAddLead} disabled={!newLead.name || !newLead.phone || saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {saving ? 'Guardando...' : 'Guardar Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
