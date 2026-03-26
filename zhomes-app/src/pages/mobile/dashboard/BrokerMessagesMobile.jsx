import { useState } from 'react'
import { Search, Send, ArrowLeft } from 'lucide-react'
import './BrokerMessagesMobile.css'

const CHATS = [
    { id: 'jessica', name: 'Jessica Hernandez', msg: 'La tasación ya llegó, todo OK 👍', time: '10:25 AM', unread: 1 },
    { id: 'miriam', name: 'Miriam Castaño', msg: 'El comprador aceptó la contraoferta.', time: 'Ayer', unread: 0 },
    { id: 'tx-2215', name: '2215 Tremont Dr', msg: 'Broker: Necesitamos el addendum.', time: 'Mar', unread: 0 },
]

export default function BrokerMessagesMobile() {
    const [view, setView] = useState('list') // list | chat
    const [msgs, setMsgs] = useState([
        { id: 1, type: 'rec', text: 'Hola, la tasación ya llegó, todo OK 👍' },
        { id: 2, type: 'sent', text: 'Excelente, sube el reporte al sistema por favor.' }
    ])
    const [inputStr, setInputStr] = useState('')

    const sendMsg = () => {
        if (!inputStr.trim()) return;
        setMsgs([...msgs, { id: Date.now(), type: 'sent', text: inputStr }]);
        setInputStr('');
    }

    return (
        <div className="mobile-msgs-page">
            {view === 'list' ? (
                <div className="m-chat-list-view">
                    <div className="m-msg-header">
                        <h1>Mensajes</h1>
                        <div className="m-msg-search">
                            <Search size={16} />
                            <input type="text" placeholder="Buscar..." />
                        </div>
                    </div>
                    <div className="m-chat-list">
                        {CHATS.map(c => (
                            <button key={c.id} className="m-chat-row" onClick={() => setView('chat')}>
                                <div className="m-cr-avatar">{c.name.charAt(0)}</div>
                                <div className="m-cr-info">
                                    <div className="m-cr-top">
                                        <span className="m-cr-name">{c.name}</span>
                                        <span className="m-cr-time">{c.time}</span>
                                    </div>
                                    <div className="m-cr-bot">
                                        <span className="m-cr-msg">{c.msg}</span>
                                        {c.unread > 0 && <span className="m-cr-badge">{c.unread}</span>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="m-chat-detail-view animate-fadeInRight">
                    <div className="m-cd-header">
                        <button className="m-cd-back" onClick={() => setView('list')}><ArrowLeft size={24} /></button>
                        <div className="m-cd-title">Jessica Hernandez</div>
                    </div>
                    <div className="m-cd-msgs">
                        {msgs.map(m => (
                            <div key={m.id} className={`m-msg-bubble ${m.type}`}>{m.text}</div>
                        ))}
                    </div>
                    <div className="m-cd-input">
                        <input 
                            type="text" 
                            placeholder="Mensaje..." 
                            value={inputStr}
                            onChange={(e) => setInputStr(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                        />
                        <button onClick={sendMsg}><Send size={18} /></button>
                    </div>
                </div>
            )}
            {view === 'list' && <div style={{ height: '90px' }} />}
        </div>
    )
}
