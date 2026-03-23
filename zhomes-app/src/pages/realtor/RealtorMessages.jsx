import { useState } from 'react'
import { Send, Hash, User, Search, Paperclip, ChevronRight } from 'lucide-react'
import './RealtorMessages.css'

const CHANNELS = [
    { id: 'broker', type: 'direct', name: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', role: 'Broker', unread: 2 },
    { id: 'tx-101', type: 'transaction', name: '8708 Denise Dr', status: 'Pre-Cierre', unread: 1 },
    { id: 'tx-102', type: 'transaction', name: '1850 Lakewood Hills', status: 'Inspección', unread: 0 },
    { id: 'tx-103', type: 'transaction', name: '7821 Norbourne Ave', status: 'Listada', unread: 0 },
    { id: 'tx-104', type: 'transaction', name: '220 River Rd', status: 'Bajo Contrato', unread: 3 },
]

const MOCK_MESSAGES = {
    broker: [
        { id: 1, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Jess, ¿cómo va el cierre de 8708 Denise Dr?', time: '10:32 AM', date: 'Hoy' },
        { id: 2, sender: 'Jessica Hernandez', isMine: true, text: 'Bien Gilbert, estamos esperando la tasación. El vendedor ya firmó todo.', time: '10:45 AM', date: 'Hoy' },
        { id: 3, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Perfecto. También necesito que subas los docs del HUD para 220 River Rd cuando los tengas.', time: '10:48 AM', date: 'Hoy' },
        { id: 4, sender: 'Jessica Hernandez', isMine: true, text: 'Los pido hoy mismo al title company 👍', time: '10:50 AM', date: 'Hoy' },
        { id: 5, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Excelente. Por cierto, tu comisión de Springhurst ya fue procesada, debería llegar mañana.', time: '11:02 AM', date: 'Hoy' },
        { id: 6, sender: 'Jessica Hernandez', isMine: true, text: '¡Perfecto, gracias! 🎉', time: '11:05 AM', date: 'Hoy' },
    ],
    'tx-101': [
        { id: 1, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Revisé los documentos que subiste. El contrato de compra-venta está aprobado ✅', time: '9:15 AM', date: 'Ayer' },
        { id: 2, sender: 'Jessica Hernandez', isMine: true, text: 'Genial. Voy a subir la inspección hoy.', time: '9:30 AM', date: 'Ayer' },
        { id: 3, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Recuerda que necesitamos la tasación antes del viernes para cerrar a tiempo.', time: '2:15 PM', date: 'Hoy' },
    ],
    'tx-104': [
        { id: 1, sender: 'Jessica Hernandez', isMine: true, text: 'Gilbert, el comprador quiere negociar $15K menos por unos issues en la inspección.', time: '3:00 PM', date: 'Ayer' },
        { id: 2, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Vamos a hacer una contraoferta de $5K menos. Prepara la enmienda.', time: '3:22 PM', date: 'Ayer' },
        { id: 3, sender: 'Jessica Hernandez', isMine: true, text: 'Listo, ya la subí al Document Vault.', time: '4:10 PM', date: 'Ayer' },
        { id: 4, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Vi la enmienda, se ve bien. La apruebo.', time: '4:30 PM', date: 'Ayer' },
        { id: 5, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'El comprador aceptó la contra. ¡Seguimos bajo contrato! 🤝', time: '9:00 AM', date: 'Hoy' },
        { id: 6, sender: 'Jessica Hernandez', isMine: true, text: 'Excelente noticia! Voy a mover la transacción a tasación.', time: '9:15 AM', date: 'Hoy' },
        { id: 7, sender: 'Gilbert Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png', isMine: false, text: 'Perfecto. Sube la aceptación firmada por favor.', time: '9:20 AM', date: 'Hoy' },
    ],
}

export default function RealtorMessages() {
    const [activeChannel, setActiveChannel] = useState('broker')
    const [newMessage, setNewMessage] = useState('')

    const channel = CHANNELS.find(c => c.id === activeChannel)
    const messages = MOCK_MESSAGES[activeChannel] || []

    const handleSend = (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        setNewMessage('')
    }

    return (
        <div className="rm-page">
            <div className="rm-layout">
                {/* Sidebar channels */}
                <div className="rm-channels">
                    <div className="rm-channels-header">
                        <h2>Mensajes</h2>
                        <div className="rm-search">
                            <Search size={14} />
                            <input type="text" placeholder="Buscar..." />
                        </div>
                    </div>

                    <div className="rm-channel-group">
                        <span className="rm-group-label">Directo</span>
                        {CHANNELS.filter(c => c.type === 'direct').map(c => (
                            <button
                                key={c.id}
                                className={`rm-channel-btn ${activeChannel === c.id ? 'active' : ''}`}
                                onClick={() => setActiveChannel(c.id)}
                            >
                                <img src={c.avatar} alt="" className="rm-ch-avatar" />
                                <div className="rm-ch-info">
                                    <span className="rm-ch-name">{c.name}</span>
                                    <span className="rm-ch-role">{c.role}</span>
                                </div>
                                {c.unread > 0 && <span className="rm-ch-unread">{c.unread}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="rm-channel-group">
                        <span className="rm-group-label">Transacciones</span>
                        {CHANNELS.filter(c => c.type === 'transaction').map(c => (
                            <button
                                key={c.id}
                                className={`rm-channel-btn ${activeChannel === c.id ? 'active' : ''}`}
                                onClick={() => setActiveChannel(c.id)}
                            >
                                <div className="rm-ch-hash"><Hash size={16} /></div>
                                <div className="rm-ch-info">
                                    <span className="rm-ch-name">{c.name}</span>
                                    <span className="rm-ch-role">{c.status}</span>
                                </div>
                                {c.unread > 0 && <span className="rm-ch-unread">{c.unread}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat area */}
                <div className="rm-chat">
                    <div className="rm-chat-header">
                        {channel?.type === 'direct' ? (
                            <>
                                <img src={channel.avatar} alt="" className="rm-header-avatar" />
                                <div>
                                    <h3>{channel.name}</h3>
                                    <span className="rm-header-status">En línea</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <Hash size={20} className="rm-header-hash" />
                                <div>
                                    <h3>{channel?.name}</h3>
                                    <span className="rm-header-status">{channel?.status}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="rm-messages">
                        {messages.map((msg, i) => {
                            const showDate = i === 0 || messages[i - 1]?.date !== msg.date
                            return (
                                <div key={msg.id}>
                                    {showDate && <div className="rm-date-divider"><span>{msg.date}</span></div>}
                                    <div className={`rm-message ${msg.isMine ? 'mine' : ''}`}>
                                        {!msg.isMine && <img src={msg.avatar} alt="" className="rm-msg-avatar" />}
                                        <div className="rm-msg-bubble">
                                            {!msg.isMine && <span className="rm-msg-sender">{msg.sender}</span>}
                                            <p>{msg.text}</p>
                                            <span className="rm-msg-time">{msg.time}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <form className="rm-input-bar" onSubmit={handleSend}>
                        <button type="button" className="rm-attach-btn">
                            <Paperclip size={18} />
                        </button>
                        <input
                            type="text"
                            placeholder="Escribe un mensaje..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="rm-send-btn" disabled={!newMessage.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
