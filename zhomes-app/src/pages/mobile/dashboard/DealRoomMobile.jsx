import { useState } from 'react'
import { MapPin, FileText, CheckCircle2, Clock, Upload, ArrowLeft, MoreHorizontal, Send, Brain } from 'lucide-react'
import { Link } from 'react-router-dom'
import './DealRoomMobile.css'

const DEAL = {
    address: '2215 Tremont Dr', city: 'Louisville, KY', price: 567000,
    statusLabel: 'Bajo Contrato', statusColor: '#8B5CF6',
    realtor: 'Miriam Castaño',
    documents: [
        { name: 'Contrato Compra-Venta', status: 'approved' },
        { name: 'Inspección', status: 'uploaded' },
        { name: 'Tasación', status: 'pending' },
    ]
}

const TABS = ['Docs', 'Chat', 'Detalles', 'AI']

export default function DealRoomMobile() {
    const [tab, setTab] = useState('Docs')

    return (
        <div className="mobile-deal-room">
            <div className="mdr-nav">
                <Link to="/dashboard/transacciones" className="mdr-back"><ArrowLeft size={20} /></Link>
                <span>Sala de Negocio</span>
                <button className="mdr-back"><MoreHorizontal size={20} /></button>
            </div>

            <div className="mdr-hero">
                <h1>{DEAL.address}</h1>
                <div className="mdr-meta">
                    <MapPin size={12} /> {DEAL.city} · ${DEAL.price.toLocaleString()}
                </div>
                <div className="mdr-status" style={{ background: `${DEAL.statusColor}20`, color: DEAL.statusColor }}>
                    {DEAL.statusLabel}
                </div>
            </div>

            <div className="mdr-tabs-wrapper">
                <div className="mdr-tabs">
                    {TABS.map(t => (
                        <button key={t} className={`mdr-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mdr-content">
                {tab === 'Docs' && (
                    <div className="mdr-docs-view animate-fadeInUp">
                        <button className="mdr-btn-upload">
                            <Upload size={18} /> Subir Documento
                        </button>

                        <div className="mdr-docs-list">
                            {DEAL.documents.map((d, i) => (
                                <div key={i} className="mdr-doc-card">
                                    <div className="mdr-doc-icon"><FileText size={20} /></div>
                                    <div className="mdr-doc-info">
                                        <div className="mdr-doc-name">{d.name}</div>
                                        <div className={`mdr-doc-status ${d.status}`}>
                                            {d.status === 'approved' && <><CheckCircle2 size={12} /> Aprobado</>}
                                            {d.status === 'uploaded' && <><Clock size={12} /> Revisando</>}
                                            {d.status === 'pending' && 'Falta subir'}
                                        </div>
                                    </div>
                                    {d.status === 'pending' && <button className="mdr-doc-action">Subir</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'Chat' && (
                    <div className="mdr-chat-view animate-fadeInUp">
                        <div className="mdr-msgs">
                            <div className="mdr-msg">
                                <span className="mdr-sender">Miriam</span>
                                <div className="mdr-bubble">Subí la inspección, todo en orden.</div>
                            </div>
                            <div className="mdr-msg mine">
                                <div className="mdr-bubble">Perfecto, ¿ya hay fecha de tasación?</div>
                            </div>
                        </div>
                        <div className="mdr-chat-input-area">
                            <input type="text" placeholder="Escribe un mensaje..." />
                            <button><Send size={18} /></button>
                        </div>
                    </div>
                )}

                {tab === 'AI' && (
                    <div className="mdr-ai-view animate-fadeInUp">
                        <div className="mdr-ai-card">
                            <div className="ai-header"><Brain size={18} /> Deal Intel</div>
                            <p>Este trato tiene una probabilidad del <strong>85%</strong> de cerrar a tiempo.
                                Sin embargo, el promedio de retraso por falta de tasación es de 4 días.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
