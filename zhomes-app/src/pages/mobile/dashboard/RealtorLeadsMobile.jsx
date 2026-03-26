import { useState } from 'react'
import { Search, Plus, User, Phone, Mail, Clock, Filter, ChevronRight, MessageSquare, Briefcase, Calendar } from 'lucide-react'
import './RealtorLeadsMobile.css'

const INITIAL_LEADS = [
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', phone: '(502) 555-0101', status: 'new', type: 'buyer', source: 'Zillow', lastContact: 'Hoy', notes: 'Busca 3BR en St Matthews' },
    { id: 2, name: 'María Gómez', email: 'maria@email.com', phone: '(502) 555-0102', status: 'contacted', type: 'seller', source: 'Referral', lastContact: 'Ayer', notes: 'Quiere vender su casa en Highlands' },
    { id: 3, name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '(502) 555-0103', status: 'showing', type: 'buyer', source: 'Open House', lastContact: 'Hace 3 días', notes: 'Visita programada para 4132 Craig Ave' },
    { id: 4, name: 'Ana Silva', email: 'ana@email.com', phone: '(502) 555-0104', status: 'offer', type: 'buyer', source: 'Website', lastContact: 'Hoy', notes: 'Preparando oferta para 8708 Denise Dr' },
    { id: 5, name: 'Roberto Díaz', email: 'roberto@email.com', phone: '(502) 555-0105', status: 'closed', type: 'both', source: 'Referral', lastContact: 'Hace 1 mes', notes: 'Cierre completado, enviar regalo' },
]

export default function RealtorLeadsMobile() {
    const [leads, setLeads] = useState(INITIAL_LEADS)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all') // all, new, contacted, showing, offer
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', type: 'buyer', source: 'Manual', notes: '' })

    const statusConfig = {
        new: { label: 'Nuevo', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        contacted: { label: 'Contactado', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        showing: { label: 'Viendo Casas', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
        offer: { label: 'En Oferta', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
        closed: { label: 'Cerrado', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    }

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || lead.phone.includes(searchQuery)
        const matchesStatus = activeFilter === 'all' || lead.status === activeFilter
        return matchesSearch && matchesStatus
    })

    const handleAddLead = () => {
        if (!newLead.name || !newLead.phone) return
        const lead = {
            id: Date.now(),
            ...newLead,
            status: 'new',
            lastContact: 'Justo ahora'
        }
        setLeads([lead, ...leads])
        setNewLead({ name: '', phone: '', email: '', type: 'buyer', source: 'Manual', notes: '' })
        setShowAddModal(false)
    }

    const updateLeadStatus = (id, status) => {
        setLeads(leads.map(l => l.id === id ? { ...l, status, lastContact: 'Justo ahora' } : l))
        if (selectedLead?.id === id) setSelectedLead({ ...selectedLead, status })
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
                    placeholder="Buscar por nombre o teléfono..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rt-leads-filters">
                <button className={`rt-filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                    Todos
                </button>
                <button className={`rt-filter-chip new ${activeFilter === 'new' ? 'active' : ''}`} onClick={() => setActiveFilter('new')}>
                    Nuevos
                </button>
                <button className={`rt-filter-chip contacted ${activeFilter === 'contacted' ? 'active' : ''}`} onClick={() => setActiveFilter('contacted')}>
                    Contactados
                </button>
                <button className={`rt-filter-chip showing ${activeFilter === 'showing' ? 'active' : ''}`} onClick={() => setActiveFilter('showing')}>
                    Viendo
                </button>
            </div>

            <div className="rt-leads-list">
                {filteredLeads.map(lead => (
                    <div key={lead.id} className="rt-lead-card" onClick={() => setSelectedLead(lead)}>
                        <div className="rt-lead-info">
                            <div className="rt-lead-avatar">
                                {lead.name.charAt(0)}
                            </div>
                            <div className="rt-lead-details">
                                <h3>{lead.name}</h3>
                                <p>{lead.type === 'buyer' ? 'Comprador' : lead.type === 'seller' ? 'Vendedor' : 'Comprador & Vendedor'} · {lead.source}</p>
                            </div>
                        </div>
                        <div className="rt-lead-meta">
                            <span className="rt-lead-status" style={{ background: statusConfig[lead.status].bg, color: statusConfig[lead.status].color }}>
                                {statusConfig[lead.status].label}
                            </span>
                            <ChevronRight size={18} color="#999" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="rt-modal-overlay" onClick={() => setSelectedLead(null)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <div>
                                <h2>{selectedLead.name}</h2>
                                <span className="rt-lead-status" style={{ display: 'inline-block', marginTop: '8px', background: statusConfig[selectedLead.status].bg, color: statusConfig[selectedLead.status].color }}>
                                    {statusConfig[selectedLead.status].label}
                                </span>
                            </div>
                            <button onClick={() => setSelectedLead(null)}>Cerrar</button>
                        </div>
                        
                        <div className="rt-modal-actions">
                            <a href={`tel:${selectedLead.phone}`} className="rt-quick-action"><Phone size={18} /> Llamar</a>
                            <a href={`sms:${selectedLead.phone}`} className="rt-quick-action"><MessageSquare size={18} /> SMS</a>
                            <a href={`mailto:${selectedLead.email}`} className="rt-quick-action"><Mail size={18} /> Email</a>
                        </div>

                        <div className="rt-modal-body">
                            <div className="rt-detail-section">
                                <h3>Detalles</h3>
                                <div className="rt-detail-item">
                                    <Phone size={16} /> <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
                                </div>
                                <div className="rt-detail-item">
                                    <Mail size={16} /> <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
                                </div>
                                <div className="rt-detail-item">
                                    <Briefcase size={16} /> {selectedLead.type === 'buyer' ? 'Comprador' : selectedLead.type === 'seller' ? 'Vendedor' : 'Doble Punta'}
                                </div>
                                <div className="rt-detail-item">
                                    <Filter size={16} /> Origen: {selectedLead.source}
                                </div>
                                <div className="rt-detail-item">
                                    <Clock size={16} /> Último contacto: {selectedLead.lastContact}
                                </div>
                            </div>

                            <div className="rt-detail-section">
                                <h3>Notas</h3>
                                <p className="rt-notes-text">{selectedLead.notes}</p>
                            </div>

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
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                            <button onClick={() => setShowAddModal(false)}>Cerrar</button>
                        </div>
                        <div className="rt-modal-body form">
                            <input type="text" placeholder="Nombre completo *" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
                            <input type="tel" placeholder="Teléfono *" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                            <input type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                            
                            <select value={newLead.type} onChange={e => setNewLead({...newLead, type: e.target.value})}>
                                <option value="buyer">Comprador</option>
                                <option value="seller">Vendedor</option>
                                <option value="both">Ambos</option>
                            </select>

                            <select value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                                <option value="Manual">Carga Manual</option>
                                <option value="Open House">Open House</option>
                                <option value="Referral">Referido</option>
                                <option value="Zillow">Zillow / Realtor.com</option>
                                <option value="Social Media">Redes Sociales</option>
                            </select>

                            <textarea placeholder="Notas, presupuesto, zonas de interés..." rows={3} value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} />

                            <button className="rt-btn-primary" onClick={handleAddLead} disabled={!newLead.name || !newLead.phone}>
                                Guardar Lead
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
