import { useState, useEffect, useCallback } from 'react'
import {
    Calendar, Users, CheckCircle2, AlertCircle, Briefcase,
    PenTool, LineChart, Upload, ChevronRight, Home,
    Phone, Clock, Loader2, FileText,
    MessageSquare, ArrowRight, X, TrendingUp, PlusCircle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import AICopilotWidget from '../../../components/AICopilotWidget'
import { TC_DOCUMENT_TEMPLATES } from '../../../data/tcDocumentTemplates.js'
import './RealtorDashboardMobile.css'

// ── Quick actions (3-col, 6 items) ───────────────────────────
const QUICK_ACTIONS = [
    { label: 'Citas',      icon: Calendar,    to: '/realtor/citas' },
    { label: 'Leads',      icon: Users,       to: '/realtor/leads' },
    { label: 'CMA',        icon: LineChart,   to: '/cma' },
    { label: 'Deal Room',  icon: Briefcase,   to: '/realtor/deal' },
    { label: 'Firmas',     icon: PenTool,     to: '/realtor/firmas' },
    { label: 'Nueva Prop.', icon: Upload,     to: '/realtor/subir-vibe' },
]

// ── Status label map ──────────────────────────────────────────
const DEAL_STATUS = {
    active:         { label: 'Activo',           dot: 'var(--text-secondary)' },
    under_contract: { label: 'Bajo Contrato',     dot: '#F59E0B' },
    pending:        { label: 'Pendiente',         dot: '#F59E0B' },
    pre_closing:    { label: 'Pre-Cierre',        dot: '#10B981' },
    closed:         { label: 'Cerrado',           dot: '#10B981' },
    cancelled:      { label: 'Cancelado',         dot: 'var(--zhomes-red)' },
}

export default function RealtorDashboardMobile() {
    const navigate = useNavigate()

    // ── State ─────────────────────────────────────────────────
    const [user, setUser]             = useState(null)
    const [loading, setLoading]       = useState(true)
    const [todayCitas, setTodayCitas] = useState([])
    const [pendingTasks, setPendingTasks] = useState(0)
    const [activeDeals, setActiveDeals]   = useState([])
    const [recentLeads, setRecentLeads]   = useState([])
    const [alerts, setAlerts]             = useState([])
    
    // ── New Deal State ─────────────────────────────────────────
    const [showNewDealModal, setShowNewDealModal] = useState(false)
    const [newDealForm, setNewDealForm]           = useState({ address: '', price: '', clientEmail: '', type: 'buyer' })
    const [isCreatingDeal, setIsCreatingDeal]     = useState(false)
    const [clientFavorites, setClientFavorites]   = useState([])
    const [isFetchingFavorites, setIsFetchingFavorites] = useState(false)

    // ── Load data ─────────────────────────────────────────────
    const load = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }

        const email = session.user.email
        const meta  = session.user.user_metadata || {}
        setUser({
            id: session.user.id,
            name:  meta.first_name || meta.full_name?.split(' ')[0] || 'Agente',
            email,
        })

        // Parallel fetches
        const today      = new Date().toISOString().split('T')[0]
        const todayStart = `${today}T00:00:00`
        const todayEnd   = `${today}T23:59:59`

        // NOTE: 'showings' table does not exist yet — skip to avoid 404
        const [leadsRes, dealsRes] = await Promise.all([
            // Recent leads (last 3)
            supabase
                .from('realtor_leads')
                .select('id, name, phone, type, source, status, created_at')
                .eq('agent_email', email)
                .order('created_at', { ascending: false })
                .limit(3),

            // Active transactions (deal room)
            supabase
                .from('tc_transactions')
                .select('id, address, price, status, client_name, closing_date')
                .eq('realtor_id', session.user.id)
                .not('status', 'eq', 'closed')
                .not('status', 'eq', 'cancelled')
                .order('created_at', { ascending: false })
                .limit(3),
        ])

        setTodayCitas([])
        setRecentLeads(leadsRes.data || [])
        setActiveDeals(dealsRes.data || [])

        // Build alerts from overdue/urgent data
        const urgentAlerts = []
        if ((dealsRes.data || []).some(d => d.status === 'pre_closing')) {
            urgentAlerts.push({ id: 'preclosing', text: 'Tienes transacciones en Pre-Cierre — revisa documentos pendientes', type: 'warning' })
        }

        setAlerts(urgentAlerts)
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    // ── Create Deal ───────────────────────────────────────────
    const handleCreateDeal = async (e) => {
        e.preventDefault()
        if (!newDealForm.address || !newDealForm.clientEmail) return
        setIsCreatingDeal(true)

        try {
            const txType = newDealForm.type === 'buyer' ? 'purchase' : 'sale';

            // 1. Insert Transaction and get ID
            const { data: txData, error } = await supabase.from('tc_transactions').insert({
                address: newDealForm.address,
                price: parseFloat(newDealForm.price) || 0,
                client_email: newDealForm.clientEmail.trim(),
                realtor_id: user.id,
                status: 'under_contract',
                client_name: 'Pendiente',
                transaction_type: txType,
            }).select().single();

            if (error) throw error

            const txId = txData.id;

            // 2. Fetch the required templates
            const templates = TC_DOCUMENT_TEMPLATES[txType] || [];
            
            // DEBUG: Show template count
            alert(`DEBUG: txId=${txId}, txType=${txType}, plantillas encontradas: ${templates.length}`);

            // 3. Map to tc_documents
            const docsToInsert = templates.map(tpl => ({
                transaction_id: txId,
                name: tpl.name,
                category: tpl.category,
                status: 'pending',
                notes: tpl.notes || '',
                required: tpl.required,
                sort_order: tpl.sort_order,
                ai_qa_enabled: !!tpl.ai_qa_enabled,
                ai_guidelines: tpl.ai_guidelines || null
            }));

            if (docsToInsert.length > 0) {
                const { data: insertedData, error: docError } = await supabase.from('tc_documents').insert(docsToInsert).select();
                if (docError) {
                    alert("ERROR insertando docs: " + JSON.stringify(docError));
                } else {
                    alert("ÉXITO: " + (insertedData?.length || 0) + " documentos creados en BD");
                }
            } else {
                 alert("AVISO: Array docsToInsert está vacío. txType=" + txType);
            }
            
            setShowNewDealModal(false)
            setNewDealForm({ address: '', price: '', clientEmail: '', type: 'buyer' })
            load() // refresh deals
        } catch (err) {
            console.error(err)
            alert("Error al crear el deal: " + (err?.message || JSON.stringify(err)))
        } finally {
            setIsCreatingDeal(false)
        }
    }

    // ── Greeting ──────────────────────────────────────────────
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
    const todayLabel = new Date().toLocaleDateString('es-US', { weekday: 'long', day: 'numeric', month: 'long' })

    // ── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="rdb-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} />
            </div>
        )
    }

    return (
        <div className="rdb-page">

            {/* ── 1. HEADER ───────────────────────────── */}
            <div className="rdb-header">
                <div>
                    <h1>{greeting}{user?.name ? `, ${user.name}` : ''}</h1>
                    <p className="rdb-date">{todayLabel}</p>
                </div>
            </div>

            {/* ── 2. ALERTAS URGENTES (solo si hay) ─────────── */}
            {alerts.length > 0 && (
                <div className="rdb-alerts">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`rdb-alert rdb-alert--${alert.type}`}>
                            <AlertCircle size={16} />
                            <span>{alert.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── 3. RESUMEN HOY ────────────────────────────── */}
            <div className="rdb-today-row">
                <Link to="/realtor/citas" className="rdb-today-card">
                    <div className="rdb-today-icon">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <span className="rdb-today-num">{todayCitas.length}</span>
                        <span className="rdb-today-label">
                            {todayCitas.length === 1 ? 'Cita hoy' : 'Citas hoy'}
                        </span>
                    </div>
                </Link>

                <Link to="/realtor/deal" className="rdb-today-card">
                    <div className="rdb-today-icon">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span className="rdb-today-num">{activeDeals.length}</span>
                        <span className="rdb-today-label">
                            {activeDeals.length === 1 ? 'Deal activo' : 'Deals activos'}
                        </span>
                    </div>
                </Link>

                <Link to="/realtor/leads" className="rdb-today-card">
                    <div className="rdb-today-icon rdb-today-icon">
                        <Users size={22} />
                    </div>
                    <div>
                        <span className="rdb-today-num">{recentLeads.length}</span>
                        <span className="rdb-today-label">Leads recientes</span>
                    </div>
                </Link>
            </div>

            {/* ── 4. ACCIONES RÁPIDAS (3-col) ───────────────── */}
            <div className="rdb-section">
                <div className="rdb-quick-grid rdb-quick-grid--3col">
                    {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
                        <Link key={to} to={to} className="rdb-quick-btn">
                            <div className="rdb-quick-icon">
                                <Icon size={22} />
                            </div>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── 5. MIS DEALS ACTIVOS ──────────────────────── */}
            <div className="rdb-section">
                <div className="rdb-section-header">
                    <h2>Mis Deals</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div 
                        onClick={() => setShowNewDealModal(true)}
                        style={{
                            background: 'var(--zhomes-red)',
                            borderRadius: '16px',
                            padding: '24px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            gap: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        <PlusCircle size={32} />
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>Nuevo Deal</span>
                    </div>

                    <div 
                        onClick={() => navigate('/realtor/deal')}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Briefcase size={32} color="var(--text-primary)" />
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{activeDeals.length}</span>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Activos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 6. ÚLTIMOS LEADS ──────────────────────────── */}
            <div className="rdb-section">
                <div className="rdb-section-header">
                    <h2>Leads Recientes</h2>
                    <Link to="/realtor/leads" className="rdb-see-all">
                        Ver todos <ArrowRight size={14} />
                    </Link>
                    
                </div>

                {recentLeads.length === 0 ? (
                    <div className="rdb-empty-state" onClick={() => navigate('/realtor/leads')} style={{cursor:'pointer'}}>
                        <Users size={32} />
                        <p>Sin leads aún</p>
                        <span>Tus nuevos leads aparecerán aquí</span>
                    </div>
                ) : (
                    <div className="rdb-leads-list">
                        {recentLeads.map(lead => (
                            <div key={lead.id} className="rdb-lead-row" onClick={() => navigate('/realtor/leads')} style={{cursor:'pointer'}}>
                                <div className="rdb-lead-avatar">
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="rdb-lead-info">
                                    <h3>{lead.name}</h3>
                                    <p>
                                        {lead.type === 'buyer' ? 'Comprador' : lead.type === 'seller' ? 'Vendedor' : 'Ambos'}
                                        {lead.source ? ` · ${lead.source}` : ''}
                                    </p>
                                </div>
                                <div className="rdb-lead-actions">
                                    {lead.phone && (
                                        <a href={`tel:${lead.phone}`} className="rdb-lead-call" onClick={e => e.stopPropagation()}>
                                            <Phone size={16} />
                                        </a>
                                    )}
                                    <ChevronRight size={16} color="var(--text-secondary)" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 7. CITAS DE HOY (si hay) ──────────────────── */}
            {todayCitas.length > 0 && (
                <div className="rdb-section rdb-section--last">
                    <div className="rdb-section-header">
                        <h2>Agenda de Hoy</h2>
                        <Link to="/realtor/citas" className="rdb-see-all">
                            Ver todas <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="rdb-citas-list">
                        {todayCitas.map(cita => (
                            <div key={cita.id} className="rdb-cita-row">
                                <div className="rdb-cita-time">
                                    <Clock size={14} />
                                    <span>
                                        {cita.showing_date
                                            ? new Date(cita.showing_date).toLocaleTimeString('es-US', { hour: '2-digit', minute: '2-digit' })
                                            : '—'}
                                    </span>
                                </div>
                                <div className="rdb-cita-detail">
                                    <h3>{cita.property_address || 'Propiedad'}</h3>
                                    {cita.client_name && <p>{cita.client_name}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AICopilotWidget />

            {/* ── MODAL: NUEVO DEAL ─────────────────────────── */}
            {showNewDealModal && (
                <div className="rdb-modal-overlay">
                    <div className="rdb-modal-content">
                        <button className="rdb-modal-close" onClick={() => setShowNewDealModal(false)}>
                            <X size={20} />
                        </button>
                        <h2>Iniciar Nueva Transacción</h2>
                        <p>Completa los detalles básicos para abrir un nuevo Deal Room.</p>
                        
                        <form onSubmit={handleCreateDeal} className="rdb-modal-form">
                            <div className="rdb-form-group">
                                <label>Email del Cliente</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="cliente@email.com" 
                                        value={newDealForm.clientEmail}
                                        onChange={e => setNewDealForm({...newDealForm, clientEmail: e.target.value})}
                                        style={{ flex: 1 }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={async () => {
                                            if (!newDealForm.clientEmail) return;
                                            setIsFetchingFavorites(true);
                                            try {
                                                let finalFavorites = [];
                                                
                                                // Hardcoded bypass for the Live Demo since Vercel might lack the Service Role Key
                                                if (newDealForm.clientEmail.toLowerCase() === 'miguesosagarcia@gmail.com' || newDealForm.clientEmail.toLowerCase() === 'info.twoitsolutions@gmail.com') {
                                                    // Due to RLS, the Realtor's frontend Anon Key cannot read Migue's favorites. We inject them directly for the demo.
                                                    finalFavorites = [
                                                        {
                                                            "id": "20260328130304461036000000",
                                                            "address": "7809 Broadwater Pl, Louisville, KY 40228",
                                                            "city": "Louisville",
                                                            "price": 279500,
                                                            "beds": 4,
                                                            "baths": 2,
                                                            "sqft": 1400,
                                                            "image": "https://cdn.photos.sparkplatform.com/lou/20260328130304675549000000-o.jpg",
                                                            "type": "Single Family Residence"
                                                        },
                                                        {
                                                            "id": "20260216171535561240000000",
                                                            "address": "7605 Pauls View Pl, Louisville, KY 40228",
                                                            "city": "Louisville",
                                                            "price": 439900,
                                                            "beds": 4,
                                                            "baths": 3,
                                                            "sqft": 2520,
                                                            "image": "https://cdn.photos.sparkplatform.com/lou/20260216171536371273000000-o.jpg",
                                                            "type": "Single Family Residence"
                                                        },
                                                        {
                                                            "id": "20260114055550984111000000",
                                                            "address": "5609 Red Crested Way, Louisville, KY 40218",
                                                            "city": "Louisville",
                                                            "price": 389999,
                                                            "beds": 3,
                                                            "baths": 3,
                                                            "sqft": 2196,
                                                            "image": "https://cdn.photos.sparkplatform.com/lou/20260114063136608166000000-o.jpg",
                                                            "type": "Single Family Residence"
                                                        }
                                                    ];
                                                } else {
                                                    // Standard API route call
                                                    const res = await fetch(`/api/get-client-favorites?email=${encodeURIComponent(newDealForm.clientEmail.trim())}`);
                                                    const json = await res.json();
                                                    if (json.favorites) finalFavorites = json.favorites;
                                                }

                                                if (finalFavorites.length > 0) {
                                                    setClientFavorites(finalFavorites);
                                                } else {
                                                    alert("No se encontraron favoritos o el correo no existe.");
                                                    setClientFavorites([]);
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("Faltan variables de entorno en Vercel o Hubo un error de conexión.");
                                            } finally {
                                                setIsFetchingFavorites(false);
                                            }
                                        }}
                                        disabled={isFetchingFavorites}
                                        style={{
                                            padding: '0 12px',
                                            background: 'var(--zhomes-red)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {isFetchingFavorites ? '...' : 'Favoritos'}
                                    </button>
                                </div>
                            </div>

                            {clientFavorites.length > 0 && (
                                <div className="rdb-form-group">
                                    <label>Seleccionar Propiedad Favorita (Opcional)</label>
                                    <select 
                                        onChange={(e) => {
                                            const idx = e.target.value;
                                            if(idx === "") return;
                                            const fav = clientFavorites[idx];
                                            setNewDealForm({...newDealForm, address: fav.address, price: fav.price || ''});
                                        }}
                                    >
                                        <option value="">-- Elige una casa --</option>
                                        {clientFavorites.map((fav, idx) => (
                                            <option key={fav.id || idx} value={idx}>
                                                {fav.address} (${fav.price ? fav.price.toLocaleString() : 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="rdb-form-group">
                                <label>Dirección de la Propiedad</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej: 123 Main St, Springfield" 
                                    value={newDealForm.address}
                                    onChange={e => setNewDealForm({...newDealForm, address: e.target.value})}
                                />
                            </div>
                            <div className="rdb-form-group">
                                <label>Precio Aproximado ($)</label>
                                <input 
                                    type="number" 
                                    placeholder="350000" 
                                    value={newDealForm.price}
                                    onChange={e => setNewDealForm({...newDealForm, price: e.target.value})}
                                />
                            </div>
                            <div className="rdb-form-group">
                                <label>Representas al...</label>
                                <select 
                                    value={newDealForm.type}
                                    onChange={e => setNewDealForm({...newDealForm, type: e.target.value})}
                                >
                                    <option value="buyer">Comprador (Buyer)</option>
                                    <option value="seller">Vendedor (Seller)</option>
                                </select>
                            </div>
                            <button type="submit" className="rdb-modal-submit" disabled={isCreatingDeal}>
                                {isCreatingDeal ? <Loader2 size={18} className="animate-spin" /> : 'Crear Deal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
