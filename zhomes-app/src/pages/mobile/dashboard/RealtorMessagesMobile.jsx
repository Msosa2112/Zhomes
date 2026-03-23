import { useState } from 'react'
import { Search, Send, ArrowLeft } from 'lucide-react'
import './BrokerMessagesMobile.css'

const CHATS = [
    { id: 'broker', name: 'Zhomes Broker', msg: 'Excelente, sube el reporte al sistema por favor.', time: '10:25 AM', unread: 1 },
    { id: 'tx-8708', name: '8708 Denise Dr', msg: 'El inspector vendrá mañana a las 10AM.', time: 'Ayer', unread: 0 },
    { id: 'soporte', name: 'Soporte Técnico', msg: 'Tu cuenta ha sido verificada.', time: 'Mar', unread: 0 },
]

export default function RealtorMessagesMobile() {
    const [view, setView] = useState('list')

    return (
        <div className="mobile-msgs-page">
            {view === 'list' ? (
                <div className="m-chat-list-view">
                    <div className="m-msg-header">
                        <h1>Mensajes</h1>
                        <div className="m-msg-search">
                            <Search size={16} />
                            <input type="text" placeholder="Buscar mensajes..." />
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
                        <div className="m-cd-title">Zhomes Broker</div>
                    </div>
                    <div className="m-cd-msgs">
                        <div className="m-msg-bubble sent">Hola, la tasación ya llegó, todo OK 👍</div>
                        <div className="m-msg-bubble rec">Excelente, sube el reporte al sistema por favor.</div>
                    </div>
                    <div className="m-cd-input">
                        <input type="text" placeholder="Escribe un mensaje..." />
                        <button><Send size={18} /></button>
                    </div>
                </div>
            )}
            {view === 'list' && <div style={{ height: '90px' }} />}
        </div>
    )
}
