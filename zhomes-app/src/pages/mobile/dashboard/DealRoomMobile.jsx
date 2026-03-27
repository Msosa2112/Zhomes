import { useState } from 'react'
import { MapPin, FileText, CheckCircle2, Clock, Upload, ArrowLeft, MoreHorizontal, Send, Brain, Sparkles, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import './DealRoomMobile.css'

const DEAL = {
    address: '2215 Tremont Dr', city: 'Louisville, KY', price: 567000,
    statusLabel: 'Bajo Contrato', statusColor: '#8B5CF6',
    realtor: 'Miriam Castaño',
    documents: [
        { name: 'Contrato Compra-Venta', status: 'approved' },
        { name: 'Inspección', status: 'uploaded' },
        { name: 'Tasación', status: 'pending' },
    ],
    messages: [
        { sender: 'Miriam', text: 'Subí la inspección, todo en orden.' },
        { sender: 'Cliente', text: '¿Ya hay fecha de tasación?' },
        { sender: 'Miriam', text: 'La tasación está agendada para el jueves.' },
    ]
}

const TABS = ['Docs', 'Chat', 'Detalles', 'AI']

export default function DealRoomMobile() {
    const [tab, setTab] = useState('Docs')
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
    const [briefData, setBriefData] = useState(null);

    const handleGenerateBriefing = async () => {
        setIsGeneratingBrief(true);
        setBriefData(null);

        try {
            // Call the real Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('zhomes-ai', {
                body: {
                    action: 'deal_briefing',
                    data: {
                        dealAddress: DEAL.address,
                        dealPrice: DEAL.price,
                        messages: DEAL.messages,
                        documents: DEAL.documents,
                        matchPrefs: { priceVsLocation: 50, moveInReady: 80, schools: 'B', lifestyle: 'family' }
                    }
                }
            });

            if (error) throw error;

            setBriefData(data);
        } catch (err) {
            console.warn('AI Edge Function unavailable, using mock data:', err);
            // Graceful fallback for local dev without API keys
            await new Promise(r => setTimeout(r, 1800));
            setBriefData({
                sentimentText: 'Confiado pero ansioso',
                summary: [
                    'El cliente subió la inspección de 2215 Tremont Dr. Todo en orden.',
                    'Preguntó en el chat sobre la fecha estimada de tasación y el monto a llevar al cierre.',
                    'La tasación está calendarizada para el jueves según confirmó Miriam.',
                ],
                nextAction: 'Informa al cliente sobre la fecha de tasación y prepara un estimado de costos de cierre (Closing Disclosure).'
            });
        } finally {
            setIsGeneratingBrief(false);
        }
    }


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
                        {!briefData && !isGeneratingBrief && (
                            <div className="ai-empty-state">
                                <div className="ai-icon-pulse">
                                    <Brain size={32} />
                                </div>
                                <h3>ZHomes AI Deal Intelligence</h3>
                                <p>Obtén un briefing ejecutivo sobre el estado de esta transacción basado en chats, documentos y actividad reciente.</p>
                                <button className="ai-btn-generate" onClick={handleGenerateBriefing}>
                                    <Sparkles size={18} /> Generar Briefing de IA
                                </button>
                            </div>
                        )}

                        {isGeneratingBrief && (
                            <div className="ai-loading-state">
                                <Loader2 size={32} className="ai-loading-icon" />
                                <p>Analizando documentos, historial de chat y preferencias del cliente...</p>
                                <div className="ai-shimmer-lines">
                                    <div className="shimmer-line"></div>
                                    <div className="shimmer-line delay-1"></div>
                                    <div className="shimmer-line short delay-2"></div>
                                </div>
                            </div>
                        )}

                        {briefData && !isGeneratingBrief && (
                            <div className="mdr-ai-card">
                                <div className="ai-header">
                                    <div className="ai-header-title">
                                        <Sparkles size={18} /> 
                                        <span>Deal Briefing Generado</span>
                                    </div>
                                    <span className="ai-time">Justo ahora</span>
                                </div>
                                
                                <div className="ai-section">
                                    <h4>Estado Emocional</h4>
                                    <div className="ai-sentiment positive">
                                        <div className="sentiment-dot"></div>
                                        {briefData.sentimentText}
                                    </div>
                                </div>

                                <div className="ai-section">
                                    <h4>Resumen Ejecutivo</h4>
                                    <ul className="ai-summary-list">
                                        {briefData.summary.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="ai-next-action">
                                    <div className="action-header">
                                        <AlertTriangle size={16} />
                                        <h4>Next Best Action</h4>
                                    </div>
                                    <p>{briefData.nextAction}</p>
                                    <button className="action-btn">
                                        Ejecutar Acción <ArrowRight size={16} />
                                    </button>
                                </div>

                                <button className="ai-btn-refresh" onClick={handleGenerateBriefing}>
                                    Actualizar Briefing
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
