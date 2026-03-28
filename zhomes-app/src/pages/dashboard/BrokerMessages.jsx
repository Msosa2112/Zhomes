import { useState } from 'react'
import { Send, Hash, User, Search, Paperclip, Users } from 'lucide-react'
import './BrokerMessages.css'

const AGENTS = [
    { id: 'jessica', name: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png', role: 'Asesora Residencial', unread: 1 },
    { id: 'judith', name: 'Judith Gonzalez', avatar: '/assets/agents/Judith Gonzalez.png', role: 'Asesora Residencial', unread: 0 },
    { id: 'miriam', name: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', role: 'Asesora Senior', unread: 2 },
    { id: 'yusleidy', name: 'Yusleidy Perez', avatar: '/assets/agents/Yusleidy Perez.png', role: 'Relocation Specialist', unread: 0 },
]

const TX_CHANNELS = [
    { id: 'tx-101', name: '8708 Denise Dr', status: 'Pre-Cierre', unread: 1 },
    { id: 'tx-102', name: '2215 Tremont Dr', status: 'Bajo Contrato', unread: 0 },
    { id: 'tx-103', name: '9320 Galene Dr', status: 'Inspección', unread: 0 },
    { id: 'tx-104', name: '220 River Rd', status: 'Pagada', unread: 3 },
]

const MOCK_MESSAGES = {
    jessica: [
        { id: 1, sender: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png', isMine: false, text: 'Gilbert, la tasación de 8708 Denise Dr ya llegó. Todo en orden — valor de $430K.', time: '10:12 AM', date: 'Hoy' },
        { id: 2, sender: 'Gilbert Zaldivar', isMine: true, text: 'Excelente. Sube el reporte al Document Vault para que quede en el expediente.', time: '10:20 AM', date: 'Hoy' },
        { id: 3, sender: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png', isMine: false, text: 'Listo, ya lo subí. ¿Necesitas algo más para avanzar al cierre?', time: '10:25 AM', date: 'Hoy' },
        { id: 4, sender: 'Gilbert Zaldivar', isMine: true, text: 'Necesito que confirmes con el title company la fecha de cierre. Intentemos para la próxima semana.', time: '10:30 AM', date: 'Hoy' },
    ],
    judith: [
        { id: 1, sender: 'Judith Gonzalez', avatar: '/assets/agents/Judith Gonzalez.png', isMine: false, text: '¡Buenos días! Ya firmé los documentos de 220 River Rd. Todo listo.', time: '9:00 AM', date: 'Ayer' },
        { id: 2, sender: 'Gilbert Zaldivar', isMine: true, text: 'Perfecto Judith. Ya revisé todos los documentos, todo en orden. Listos para el próximo cliente.', time: '9:15 AM', date: 'Ayer' },
        { id: 3, sender: 'Judith Gonzalez', avatar: '/assets/agents/Judith Gonzalez.png', isMine: false, text: '¡Gracias! 🎉 Ya estoy trabajando en un nuevo listing en St. Matthews.', time: '9:22 AM', date: 'Ayer' },
    ],
    miriam: [
        { id: 1, sender: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', isMine: false, text: 'Gilbert, el comprador de 2215 Tremont quiere negociar $10K menos.', time: '2:00 PM', date: 'Hoy' },
        { id: 2, sender: 'Gilbert Zaldivar', isMine: true, text: 'Hmm, el vendedor ya bajó $15K. Contraoferta: $5K menos y cubrimos closing costs.', time: '2:15 PM', date: 'Hoy' },
        { id: 3, sender: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', isMine: false, text: 'Me parece justo. Voy a preparar la enmienda.', time: '2:20 PM', date: 'Hoy' },
        { id: 4, sender: 'Gilbert Zaldivar', isMine: true, text: 'Perfecto. Avísame cuando la suba el comprador firmada.', time: '2:22 PM', date: 'Hoy' },
        { id: 5, sender: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', isMine: false, text: '¡El comprador aceptó! Contraoferta firmada, la subo ahora.', time: '4:30 PM', date: 'Hoy' },
        { id: 6, sender: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png', isMine: false, text: 'Ya está en el Document Vault ✅', time: '4:35 PM', date: 'Hoy' },
    ],
    yusleidy: [
        { id: 1, sender: 'Gilbert Zaldivar', isMine: true, text: 'Yusleidy, ¿cómo va el caso de relocation de la familia Miller?', time: '11:00 AM', date: 'Ayer' },
        { id: 2, sender: 'Yusleidy Perez', avatar: '/assets/agents/Yusleidy Perez.png', isMine: false, text: 'Bien, ya visitamos 4 propiedades. Les gustó mucho una en Prospect.', time: '11:30 AM', date: 'Ayer' },
        { id: 3, sender: 'Gilbert Zaldivar', isMine: true, text: 'Genial. Mantenme al tanto cuando hagan oferta.', time: '11:35 AM', date: 'Ayer' },
    ],
    'tx-101': [
        { id: 1, sender: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png', isMine: false, text: 'Actualización: el inspector confirmó fecha para mañana a las 10 AM.', time: '3:00 PM', date: 'Hoy' },
        { id: 2, sender: 'Gilbert Zaldivar', isMine: true, text: 'Bien. Asegúrate de estar presente y tomar fotos del reporte.', time: '3:10 PM', date: 'Hoy' },
    ],
}

export default function BrokerMessages() {
    const [activeChat, setActiveChat] = useState('jessica')
    const [newMessage, setNewMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const messages = MOCK_MESSAGES[activeChat] || []
    const activeAgent = AGENTS.find(a => a.id === activeChat)
    const activeTx = TX_CHANNELS.find(t => t.id === activeChat)
    const activeName = activeAgent?.name || activeTx?.name || ''

    const handleSend = () => {
        if (!newMessage.trim()) return
        setNewMessage('')
    }

    return (
        <div className="broker-messages">
            {/* Sidebar / Contact list */}
            <div className="bm-sidebar">
                <div className="bm-sidebar-header">
                    <h2>Mensajes</h2>
                    <span className="bm-total-badge">{AGENTS.reduce((s, a) => s + a.unread, 0) + TX_CHANNELS.reduce((s, t) => s + t.unread, 0)}</span>
                </div>

                <div className="bm-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Buscar agente o transacción..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bm-section-label"><User size={12} /> Agentes</div>
                {AGENTS.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(agent => (
                    <button
                        key={agent.id}
                        className={`bm-contact ${activeChat === agent.id ? 'active' : ''}`}
                        onClick={() => setActiveChat(agent.id)}
                    >
                        <img src={agent.avatar} alt="" className="bm-contact-avatar" />
                        <div className="bm-contact-info">
                            <span className="bm-contact-name">{agent.name}</span>
                            <span className="bm-contact-role">{agent.role}</span>
                        </div>
                        {agent.unread > 0 && <span className="bm-unread">{agent.unread}</span>}
                    </button>
                ))}

                <div className="bm-section-label"><Hash size={12} /> Transacciones</div>
                {TX_CHANNELS.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tx => (
                    <button
                        key={tx.id}
                        className={`bm-contact ${activeChat === tx.id ? 'active' : ''}`}
                        onClick={() => setActiveChat(tx.id)}
                    >
                        <div className="bm-tx-icon"><Hash size={14} /></div>
                        <div className="bm-contact-info">
                            <span className="bm-contact-name">{tx.name}</span>
                            <span className="bm-contact-role">{tx.status}</span>
                        </div>
                        {tx.unread > 0 && <span className="bm-unread">{tx.unread}</span>}
                    </button>
                ))}
            </div>

            {/* Chat area */}
            <div className="bm-chat">
                <div className="bm-chat-header">
                    {activeAgent && <img src={activeAgent.avatar} alt="" className="bm-chat-avatar" />}
                    {activeTx && <div className="bm-tx-icon lg"><Hash size={16} /></div>}
                    <div>
                        <h3>{activeName}</h3>
                        <span className="bm-chat-sub">
                            {activeAgent ? activeAgent.role : activeTx ? activeTx.status : ''}
                        </span>
                    </div>
                </div>

                <div className="bm-chat-body">
                    {messages.map(msg => (
                        <div key={msg.id} className={`bm-msg ${msg.isMine ? 'mine' : ''}`}>
                            {!msg.isMine && <img src={msg.avatar} alt="" className="bm-msg-avatar" />}
                            <div className="bm-msg-bubble">
                                {!msg.isMine && <span className="bm-msg-sender">{msg.sender}</span>}
                                <p>{msg.text}</p>
                                <span className="bm-msg-time">{msg.time}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bm-chat-input">
                    <button className="bm-attach"><Paperclip size={16} /></button>
                    <input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button className="bm-send" onClick={handleSend}><Send size={16} /></button>
                </div>
            </div>
        </div>
    )
}
