import { useState } from 'react'
import { Trophy, Star, TrendingUp, Plus, Trash2, Edit3, Check, X, User, Percent } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import './TeamPageMobile.css'

const INITIAL_AGENTS = [
    // Agents with Spark MLS transaction data
    { id: 1, name: 'Miriam C Castaño', deals: 1, vol: '$540,000', commission: 70, rank: 1, avatar: '/assets/agents/Miriam Castano.png', phone: '(502) 821-9977', email: 'realtormiriamcastano@gmail.com', status: 'active', languages: 'English & Spanish', experience: 6 },
    { id: 2, name: 'Rocio Martinez', deals: 1, vol: '$285,000', commission: 70, rank: 2, avatar: null, phone: '(786) 383-9236', email: 'rociomartinez.realtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 1 },
    { id: 3, name: 'Judith N Gonzalez', deals: 1, vol: '$188,000', commission: 65, rank: 3, avatar: '/assets/agents/Judith Gonzalez.png', phone: '(502) 767-5658', email: 'judithgonzalezrealestate@gmail.com', status: 'active', languages: 'English & Spanish', experience: 1 },
    { id: 4, name: 'Jessica Hernandez', deals: 1, vol: '$185,000', commission: 70, rank: 4, avatar: '/assets/agents/Jessica Hernandez.png', phone: '(502) 381-3781', email: 'valcarceljessy@gmail.com', status: 'active', languages: 'English & Spanish', experience: 1 },
    // Remaining CSV agents (no Spark closings yet)
    { id: 5, name: 'Gilbert R Zaldivar', deals: 0, vol: '$0', commission: 0, rank: 5, avatar: null, phone: '(502) 641-6623', email: 'micasa.gilbert@gmail.com', status: 'active', languages: 'English, Spanish & Italian', experience: 9, isBroker: true },
    { id: 6, name: 'Ernesto Cougil', deals: 0, vol: '$0', commission: 70, rank: 6, avatar: null, phone: '(502) 526-2896', email: 'ernestotoprealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 4 },
    { id: 7, name: 'Leidys Herrera', deals: 0, vol: '$0', commission: 70, rank: 7, avatar: null, phone: '(502) 356-7264', email: 'lhtopagent@gmail.com', status: 'active', languages: 'English & Spanish', experience: 5 },
    { id: 8, name: 'Pavel V Reyes', deals: 0, vol: '$0', commission: 70, rank: 8, avatar: null, phone: '(502) 296-4839', email: 'pavelpvrv@gmail.com', status: 'active', languages: 'English & Spanish', experience: 8 },
    { id: 9, name: 'Teresa Verdecia', deals: 0, vol: '$0', commission: 70, rank: 9, avatar: null, phone: '(502) 314-4344', email: 'teresa.verdecia@hotmail.com', status: 'active', languages: 'English & Spanish', experience: 6 },
    { id: 10, name: 'Maria T Mendez', deals: 0, vol: '$0', commission: 70, rank: 10, avatar: null, phone: '(305) 923-7367', email: 'mtm60bayona@gmail.com', status: 'active', languages: 'English & Spanish', experience: 4 },
    { id: 11, name: 'Alan J Hernandez', deals: 0, vol: '$0', commission: 70, rank: 11, avatar: null, phone: '(502) 296-1588', email: 'alan-6920@hotmail.com', status: 'active', languages: 'English & Spanish', experience: 2 },
    { id: 12, name: 'Dario Hernandez', deals: 0, vol: '$0', commission: 70, rank: 12, avatar: null, phone: '(502) 389-1023', email: 'betterhomesdario@gmail.com', status: 'active', languages: 'English & Spanish', experience: 3 },
    { id: 13, name: 'Jorge Betancourt', deals: 0, vol: '$0', commission: 70, rank: 13, avatar: null, phone: '(502) 432-9588', email: 'jorgeale90bet@gmail.com', status: 'active', languages: 'English & Spanish', experience: 2 },
    { id: 14, name: 'Stanis Shimiyimana', deals: 0, vol: '$0', commission: 70, rank: 14, avatar: null, phone: '(270) 935-7360', email: 'stanisrealty@gmail.com', status: 'active', languages: 'English & French', experience: 2 },
    { id: 15, name: 'Betsy S Zaldivar', deals: 0, vol: '$0', commission: 70, rank: 15, avatar: null, phone: '(502) 310-6049', email: 'betsyszaldivar1016@icloud.com', status: 'active', languages: 'English & Spanish', experience: 1 },
    { id: 16, name: 'Maylin Rodriguez', deals: 0, vol: '$0', commission: 70, rank: 16, avatar: null, phone: '(502) 202-1597', email: 'maylinkyrealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 17, name: 'Claudia Preciado', deals: 0, vol: '$0', commission: 70, rank: 17, avatar: null, phone: '(502) 751-6630', email: 'claudiakyrealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 5 },
    { id: 18, name: 'Yeimy Ortiz', deals: 0, vol: '$0', commission: 70, rank: 18, avatar: null, phone: '(502) 640-4036', email: 'yeimykyrealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 19, name: 'Yusleidy Perez', deals: 0, vol: '$0', commission: 70, rank: 19, avatar: '/assets/agents/Yusleidy Perez.png', phone: '(502) 310-2204', email: 'yusleidyrealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 20, name: 'Sidalg Nieves', deals: 0, vol: '$0', commission: 70, rank: 20, avatar: null, phone: '(502) 794-9894', email: 'sidalgnievesrealtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 21, name: 'Mariam Rodriguez', deals: 0, vol: '$0', commission: 70, rank: 21, avatar: null, phone: '(502) 915-6437', email: 'mariamrealtor24@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 22, name: 'Lisbeisy Echeverria', deals: 0, vol: '$0', commission: 70, rank: 22, avatar: null, phone: '(502) 435-2496', email: 'lisbeisyrealestate@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 23, name: 'Geraldine Santiago', deals: 0, vol: '$0', commission: 70, rank: 23, avatar: null, phone: '(502) 321-0671', email: 'geraldine10realtor@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 24, name: 'Roxana Arias', deals: 0, vol: '$0', commission: 70, rank: 24, avatar: null, phone: '(502) 641-7470', email: 'roxanakyrealestate@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 25, name: 'Ronney Aguiar', deals: 0, vol: '$0', commission: 70, rank: 25, avatar: null, phone: '(502) 915-1568', email: 'ronneyaguiar96@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 26, name: 'Celia Hernandez', deals: 0, vol: '$0', commission: 70, rank: 26, avatar: null, phone: '(502) 365-0718', email: '', status: 'active', languages: 'English & Spanish', experience: 0 },
    { id: 27, name: 'Yurisbel Garcia', deals: 0, vol: '$0', commission: 70, rank: 27, avatar: null, phone: '(502) 592-1390', email: 'yurrealestate@gmail.com', status: 'active', languages: 'English & Spanish', experience: 0 },
]

export default function TeamPageMobile() {
    const { theme } = useTheme()
    const [agents, setAgents] = useState(INITIAL_AGENTS)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editCommission, setEditCommission] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

    // Add agent form
    const [newAgent, setNewAgent] = useState({ name: '', email: '', phone: '', commission: 70 })

    const handleAddAgent = () => {
        if (!newAgent.name.trim()) return
        const agent = {
            id: Date.now(),
            name: newAgent.name,
            email: newAgent.email,
            phone: newAgent.phone,
            commission: parseInt(newAgent.commission) || 70,
            deals: 0,
            vol: '$0',
            rank: agents.length + 1,
            avatar: null,
            status: 'active'
        }
        setAgents([...agents, agent])
        setNewAgent({ name: '', email: '', phone: '', commission: 70 })
        setShowAddModal(false)
    }

    const handleRemoveAgent = (id) => {
        setAgents(agents.filter(a => a.id !== id))
        setConfirmDelete(null)
    }

    const startEditCommission = (agent) => {
        setEditingId(agent.id)
        setEditCommission(agent.commission.toString())
    }

    const saveCommission = (id) => {
        setAgents(agents.map(a => 
            a.id === id ? { ...a, commission: parseInt(editCommission) || a.commission } : a
        ))
        setEditingId(null)
    }

    const topAgent = agents.sort((a, b) => b.deals - a.deals)[0]

    return (
        <div className="m-team-page">
            <div className="m-team-header">
                <h1>Mi Equipo</h1>
                <button className="m-add-agent-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Agregar Realtor
                </button>
            </div>

            {/* Top performer */}
            {topAgent && (
                <div className="m-podium-section">
                    <div className="m-podium-card">
                        <Trophy size={40} color="#F59E0B" className="m-trophy" />
                        {topAgent.avatar 
                            ? <img src={topAgent.avatar} alt="" className="m-pod-img" />
                            : <div className="m-pod-img-placeholder"><User size={32} /></div>
                        }
                        <h2>{topAgent.name}</h2>
                        <span>{topAgent.vol} · {topAgent.deals} cierres</span>
                        <div className="m-commission-display">
                            <Percent size={14} /> Comisión: {topAgent.commission}%
                        </div>
                    </div>
                </div>
            )}

            {/* Agent list */}
            <div className="m-team-list">
                <h3>Equipo ({agents.length} realtors)</h3>
                {agents.map((a, idx) => (
                    <div key={a.id} className="m-agent-row">
                        <span className="m-rank">#{idx + 1}</span>
                        {a.avatar 
                            ? <img src={a.avatar} alt="" />
                            : <div className="m-agent-avatar-placeholder"><User size={20} /></div>
                        }
                        <div className="m-ainfo">
                            <strong>{a.name} {a.isBroker ? '👑' : ''}</strong>
                            <span>{a.deals > 0 ? `${a.deals} cierres · ${a.vol}` : `${a.experience || 0} años exp`} · {a.phone}</span>
                        </div>
                        
                        {/* Commission edit */}
                        <div className="m-commission-col">
                            {editingId === a.id ? (
                                <div className="m-commission-edit">
                                    <input 
                                        type="number" 
                                        value={editCommission}
                                        onChange={(e) => setEditCommission(e.target.value)}
                                        className="m-commission-input"
                                        min="0" max="100"
                                        autoFocus
                                    />
                                    <span className="m-pct">%</span>
                                    <button className="m-icon-btn save" onClick={() => saveCommission(a.id)}>
                                        <Check size={16} />
                                    </button>
                                    <button className="m-icon-btn cancel" onClick={() => setEditingId(null)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button className="m-commission-badge" onClick={() => startEditCommission(a)}>
                                    {a.commission}% <Edit3 size={12} />
                                </button>
                            )}
                        </div>

                        {/* Delete */}
                        {confirmDelete === a.id ? (
                            <div className="m-delete-confirm">
                                <button className="m-icon-btn delete" onClick={() => handleRemoveAgent(a.id)}>
                                    <Check size={16} />
                                </button>
                                <button className="m-icon-btn cancel" onClick={() => setConfirmDelete(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button className="m-icon-btn delete-trigger" onClick={() => setConfirmDelete(a.id)}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add agent modal */}
            {showAddModal && (
                <div className="m-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="m-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="m-modal-head">
                            <h2>Agregar Realtor</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="m-modal-form">
                            <label>Nombre completo</label>
                            <input 
                                type="text" 
                                placeholder="Nombre del realtor"
                                value={newAgent.name}
                                onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                            />

                            <label>Email</label>
                            <input 
                                type="email" 
                                placeholder="email@ejemplo.com"
                                value={newAgent.email}
                                onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                            />

                            <label>Teléfono</label>
                            <input 
                                type="tel" 
                                placeholder="(502) 555-0000"
                                value={newAgent.phone}
                                onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                            />

                            <label>Comisión (%)</label>
                            <div className="m-commission-input-row">
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={newAgent.commission}
                                    onChange={e => setNewAgent({...newAgent, commission: parseInt(e.target.value)})}
                                    className="m-range-input"
                                />
                                <span className="m-range-value">{newAgent.commission}%</span>
                            </div>
                            <p className="m-commission-note">
                                Broker retiene <strong>{100 - newAgent.commission}%</strong> · Realtor recibe <strong>{newAgent.commission}%</strong>
                            </p>

                            <button className="m-add-submit" onClick={handleAddAgent} disabled={!newAgent.name.trim()}>
                                <Plus size={18} /> Agregar al Equipo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: '90px' }} />
        </div>
    )
}
