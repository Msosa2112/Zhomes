import { useState } from 'react'
import { Plus, Users, Calendar, MapPin, Clock, ExternalLink, QrCode, Copy, Check, ChevronRight } from 'lucide-react'
import './RealtorOpenHousesMobile.css'

const INITIAL_OPEN_HOUSES = [
    { id: 1, property: '4132 Craig Ave', date: 'Dom, 28 Mar', time: '1:00 PM - 3:00 PM', status: 'upcoming', visitors: 0, leads: 0 },
    { id: 2, property: '8708 Denise Dr', date: 'Sáb, 27 Mar', time: '12:00 PM - 2:00 PM', status: 'upcoming', visitors: 0, leads: 0 },
    { id: 3, property: '4300 Hillview Ave', date: 'Dom, 14 Mar', time: '2:00 PM - 4:00 PM', status: 'completed', visitors: 24, leads: 8 },
]

export default function RealtorOpenHousesMobile() {
    const [openHouses, setOpenHouses] = useState(INITIAL_OPEN_HOUSES)
    const [selectedTab, setSelectedTab] = useState('upcoming')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedOH, setSelectedOH] = useState(null)
    const [showQR, setShowQR] = useState(false)
    const [qrCopied, setQrCopied] = useState(false)
    const [newOH, setNewOH] = useState({ property: '', date: '', startTime: '1:00 PM', endTime: '3:00 PM' })

    const addOpenHouse = () => {
        if (!newOH.property) return
        const oh = {
            id: Date.now(),
            property: newOH.property,
            date: newOH.date || 'Pendiente',
            time: `${newOH.startTime} - ${newOH.endTime}`,
            status: 'upcoming',
            visitors: 0,
            leads: 0
        }
        setOpenHouses([oh, ...openHouses])
        setNewOH({ property: '', date: '', startTime: '1:00 PM', endTime: '3:00 PM' })
        setShowAddModal(false)
    }

    const copySignLink = () => {
        setQrCopied(true)
        setTimeout(() => setQrCopied(false), 2000)
    }

    const upcomingOH = openHouses.filter(oh => oh.status === 'upcoming')
    const completedOH = openHouses.filter(oh => oh.status === 'completed')
    const displayOH = selectedTab === 'upcoming' ? upcomingOH : completedOH

    return (
        <div className="rt-open-house-page">
            <div className="rt-oh-header">
                <div>
                    <h1>Open Houses</h1>
                    <p>Gestiona tus eventos públicos</p>
                </div>
                <button className="rt-oh-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Crear
                </button>
            </div>

            <div className="rt-oh-tabs">
                <button className={`rt-tab ${selectedTab === 'upcoming' ? 'active' : ''}`} onClick={() => setSelectedTab('upcoming')}>
                    Próximos ({upcomingOH.length})
                </button>
                <button className={`rt-tab ${selectedTab === 'completed' ? 'active' : ''}`} onClick={() => setSelectedTab('completed')}>
                    Pasados ({completedOH.length})
                </button>
            </div>

            <div className="rt-oh-list">
                {displayOH.length === 0 && (
                    <div className="rt-oh-empty">
                        <Users size={40} color="#E5E5E5" />
                        <p>No tienes Open Houses {selectedTab === 'upcoming' ? 'programados' : 'pasados'}</p>
                    </div>
                )}
                {displayOH.map(oh => (
                    <div key={oh.id} className="rt-oh-card" onClick={() => setSelectedOH(oh)}>
                        <div className="rt-oh-card-header">
                            <div className="rt-oh-title">
                                <MapPin size={16} color="#3B82F6" />
                                <h3>{oh.property}</h3>
                            </div>
                            <span className={`rt-oh-status-badge ${oh.status}`}>
                                {oh.status === 'upcoming' ? 'Próximo' : 'Completado'}
                            </span>
                        </div>
                        <div className="rt-oh-card-body">
                            <div className="rt-oh-meta-item">
                                <Calendar size={14} /> {oh.date}
                            </div>
                            <div className="rt-oh-meta-item">
                                <Clock size={14} /> {oh.time}
                            </div>
                            <div className="rt-oh-stats">
                                <div className="rt-stat"><strong>{oh.visitors}</strong> Visitas</div>
                                <div className="rt-stat"><strong>{oh.leads}</strong> Leads</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* OH Detail Modal */}
            {selectedOH && (
                <div className="rt-modal-overlay" onClick={() => setSelectedOH(null)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>{selectedOH.property}</h2>
                            <button onClick={() => setSelectedOH(null)}>Cerrar</button>
                        </div>
                        <div className="rt-modal-body">
                            <div className="rt-detail-grid">
                                <div className="rt-detail-cell">
                                    <span>Fecha</span>
                                    <strong>{selectedOH.date}</strong>
                                </div>
                                <div className="rt-detail-cell">
                                    <span>Horario</span>
                                    <strong>{selectedOH.time}</strong>
                                </div>
                                <div className="rt-detail-cell">
                                    <span>Visitantes</span>
                                    <strong>{selectedOH.visitors}</strong>
                                </div>
                                <div className="rt-detail-cell">
                                    <span>Nuevos Leads</span>
                                    <strong>{selectedOH.leads}</strong>
                                </div>
                            </div>

                            {selectedOH.status === 'upcoming' && (
                                <div className="rt-oh-tools">
                                    <h3>Herramientas para el evento</h3>
                                    <div className="rt-tool-item" onClick={() => setShowQR(true)}>
                                        <div className="rt-tool-icon"><QrCode size={20} /></div>
                                        <div className="rt-tool-info">
                                            <h4>Código QR de Registro</h4>
                                            <p>Los visitantes escanean para registrarse</p>
                                        </div>
                                        <ChevronRight size={18} color="#999" />
                                    </div>
                                    <div className="rt-tool-item" onClick={copySignLink}>
                                        <div className="rt-tool-icon"><ExternalLink size={20} /></div>
                                        <div className="rt-tool-info">
                                            <h4>{qrCopied ? '¡Enlace Copiado!' : 'Enlace Sign-in'}</h4>
                                            <p>Abre el formulario en tu iPad o tablet</p>
                                        </div>
                                        {qrCopied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#999" />}
                                    </div>
                                </div>
                            )}

                            {selectedOH.status === 'completed' && (
                                <div className="rt-oh-roster">
                                    <h3>Visitantes Registrados</h3>
                                    {selectedOH.visitors === 0 ? (
                                        <p className="rt-no-data">No hubo registros digitales.</p>
                                    ) : (
                                        <div className="rt-visitor-list">
                                            {/* Simulate visitor list */}
                                            {Array(selectedOH.visitors).fill(null).map((_, i) => (
                                                <div key={i} className="rt-visitor-item">
                                                    <div className="rt-visitor-avatar">V{i+1}</div>
                                                    <div>
                                                        <strong>Visitante #{i+1}</strong>
                                                        <span>Registrado a las {Math.floor(Math.random() * 2) + 1}:{Math.floor(Math.random() * 59).toString().padStart(2,'0')} PM</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {showQR && (
                <div className="rt-modal-overlay" onClick={() => setShowQR(false)}>
                    <div className="rt-modal-center" onClick={e => e.stopPropagation()}>
                        <h2>Escanear para Registrarse</h2>
                        <p>{selectedOH?.property}</p>
                        <div className="rt-qr-placeholder">
                            <QrCode size={120} color="#1A1A1A" />
                        </div>
                        <p className="rt-qr-instruction">Pide a los visitantes que escaneen este código con la cámara de su teléfono para ingresar sus datos.</p>
                        <button className="rt-btn-primary" onClick={() => setShowQR(false)}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="rt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="rt-modal" onClick={e => e.stopPropagation()}>
                        <div className="rt-modal-header">
                            <h2>Nuevo Open House</h2>
                            <button onClick={() => setShowAddModal(false)}>Cerrar</button>
                        </div>
                        <div className="rt-modal-body form">
                            <input 
                                type="text" 
                                placeholder="Dirección de la propiedad *" 
                                value={newOH.property} 
                                onChange={e => setNewOH({...newOH, property: e.target.value})} 
                            />
                            <input 
                                type="date" 
                                value={newOH.date} 
                                onChange={e => setNewOH({...newOH, date: e.target.value})} 
                            />
                            <div className="rt-time-row">
                                <select value={newOH.startTime} onChange={e => setNewOH({...newOH, startTime: e.target.value})}>
                                    <option>10:00 AM</option>
                                    <option>11:00 AM</option>
                                    <option>12:00 PM</option>
                                    <option>1:00 PM</option>
                                    <option>2:00 PM</option>
                                    <option>3:00 PM</option>
                                </select>
                                <span>a</span>
                                <select value={newOH.endTime} onChange={e => setNewOH({...newOH, endTime: e.target.value})}>
                                    <option>12:00 PM</option>
                                    <option>1:00 PM</option>
                                    <option>2:00 PM</option>
                                    <option>3:00 PM</option>
                                    <option>4:00 PM</option>
                                    <option>5:00 PM</option>
                                </select>
                            </div>
                            <button className="rt-btn-primary" onClick={addOpenHouse} disabled={!newOH.property}>
                                Programar Open House
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
