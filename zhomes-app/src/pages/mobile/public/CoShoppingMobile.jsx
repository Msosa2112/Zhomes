import { useState, useEffect } from 'react'
import { Heart, UserPlus, Share2, CheckCircle2, Copy, Search, ArrowRight, ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { MOCK_PROPERTIES } from '../../../data/mockData'
import './CoShoppingMobile.css'

export default function CoShoppingMobile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [partnerLinked, setPartnerLinked] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [mutualMatches, setMutualMatches] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserAndMatches = async () => {
            // Search for invite code in URL
            const urlParams = new URLSearchParams(window.location.search);
            const inviteParam = urlParams.get('invite');
            
            if (inviteParam) {
                // Save invite to process after login
                localStorage.setItem('zhomes_pending_invite', inviteParam);
            }

            const { data: { session } } = await supabase.auth.getSession();
            const activeUser = session?.user || null;

            if (!activeUser) {
                // Save current URL to redirect back after login/register
                localStorage.setItem('zhomes_redirect_after_login', window.location.pathname + window.location.search);
                if (inviteParam) {
                    navigate('/registro', { replace: true });
                } else {
                    navigate('/login', { replace: true });
                }
                return;
            }
            setUser(activeUser);

            // Process any pending invites
            const pendingInvite = localStorage.getItem('zhomes_pending_invite');
            if (pendingInvite && pendingInvite !== activeUser.id) {
                localStorage.setItem('zhomes_partner_linked', 'true');
                localStorage.removeItem('zhomes_pending_invite');
                
                // Remove ?invite= from URL for cleanliness
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // SIMULATION: Check if linked. We use localStorage to mock this for now.
            const isLinked = localStorage.getItem('zhomes_partner_linked') === 'true'
            setPartnerLinked(isLinked)

            if (isLinked) {
                // Simulate some mutual matches by picking random properties
                setMutualMatches([
                    MOCK_PROPERTIES[0],
                    MOCK_PROPERTIES[2]
                ])
            }
            
            setLoading(false)
        }
        fetchUserAndMatches()
    }, [navigate])

    const handleShareLink = async () => {
        const inviteUrl = `${window.location.origin}/pareja?invite=${user?.id}`;
        
        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'ZHomes - Modo Parejas',
                    text: '¡Únete conmigo para buscar casa juntos en ZHomes! ',
                    url: inviteUrl
                });
            } catch (err) {
                // User cancelled share - that's ok
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(inviteUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch (err) {
                // Final fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = inviteUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            }
        }
        
        // Simular que la pareja aceptó después de 3 segundos para la demo
        if (!partnerLinked) {
            setTimeout(() => {
                localStorage.setItem('zhomes_partner_linked', 'true')
                setPartnerLinked(true)
                setMutualMatches([MOCK_PROPERTIES[0], MOCK_PROPERTIES[2]])
            }, 3000)
        }
    }

    const unpair = () => {
        localStorage.removeItem('zhomes_partner_linked')
        setPartnerLinked(false)
        setMutualMatches([])
    }

    if (loading) return <div className="co-loading">Cargando Modo Parejas...</div>

    return (
        <div className="co-page animate-fadeInUp">
            <div className="co-header">
                <button className="co-back-btn" onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
                <h2>Modo Parejas</h2>
                <div style={{width: '40px'}}></div>
            </div>

            <div className="co-hero">
                <div className="co-hero-icon">
                    <Heart size={40} color="white" fill="white" />
                </div>
                <h3>Co-Shopping</h3>
                <p>Busca casa en equipo. Comparte tus favoritos y descubre los "Matches" cuando ámbos le den Like a la misma propiedad.</p>
            </div>

            {!partnerLinked ? (
                <div className="co-invite-section">
                    <div className="co-invite-card">
                        <UserPlus size={32} color="var(--zhomes-red)" />
                        <h4>Invita a tu pareja</h4>
                        <p>Envíale este enlace exclusivo para vincular sus cuentas.</p>
                        
                        <button className="co-copy-btn" onClick={handleShareLink}>
                            {linkCopied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
                            {linkCopied ? '¡Enlace Copiado!' : 'Compartir Enlace de Invitación'}
                        </button>
                    </div>

                    <div className="co-demo-notice">
                        <small> Para esta demo, el estado de "vinculado" se activará automáticamente 3 segundos después de copiar el enlace.</small>
                    </div>
                </div>
            ) : (
                <div className="co-matches-section">
                    <div className="co-partner-info">
                        <div className="co-partner-avatar">PA</div>
                        <div className="co-partner-details">
                            <h4>Vinculado con tu Pareja</h4>
                            <p>¡Listos para encontrar casa juntos!</p>
                        </div>
                        <button className="co-unpair-btn" onClick={unpair}>Desvincular</button>
                    </div>

                    <div className="co-matches-header">
                        <h3>Match Mutuo ({mutualMatches.length})</h3>
                        <p>Propiedades que a los dos les gustan.</p>
                    </div>

                    {mutualMatches.length === 0 ? (
                        <div className="co-empty-matches">
                            <Search size={32} />
                            <p>Aún no tienen matches mutuos. ¡Sigan usando Tinder Inmobiliario para descubrir casas que les gusten a ambos!</p>
                            <button className="co-swipe-btn" onClick={() => navigate('/swipe')}>Ir al Swipe Mode</button>
                        </div>
                    ) : (
                        <div className="co-mutual-list">
                            {mutualMatches.map(prop => (
                                <Link to={`/propiedades/${prop.id}`} key={prop.id} className="co-mutual-card">
                                    <div className="co-mutual-badge">¡MATCH!</div>
                                    <img src={prop.image} alt={prop.address} className="co-mutual-img" />
                                    <div className="co-mutual-info">
                                        <h4>${prop.price?.toLocaleString()}</h4>
                                        <p>{prop.address}</p>
                                    </div>
                                    <ArrowRight className="co-mutual-arrow" size={20} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
