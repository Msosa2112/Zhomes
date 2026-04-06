import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Key, Mail, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css'

export default function LoginPageMobile() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginRole, setLoginRole] = useState('client') // 'client', 'realtor', 'broker'
    const [loading, setLoading] = useState(true) // Start loading while checking auth
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const checkAuth = async () => {
            const redirectUrl = localStorage.getItem('zhomes_redirect_after_login');
            const demoRaw = localStorage.getItem('zhomes_demo_user')
            if (demoRaw) {
                if (redirectUrl) {
                    localStorage.removeItem('zhomes_redirect_after_login');
                    navigate(redirectUrl, { replace: true });
                } else {
                    try {
                        const demoUser = JSON.parse(demoRaw)
                        if (demoUser.role === 'realtor') navigate('/realtor', { replace: true })
                        else if (demoUser.role === 'broker') navigate('/dashboard', { replace: true })
                        else navigate('/perfil', { replace: true })
                    } catch (e) {
                        navigate('/perfil', { replace: true })
                    }
                }
                return
            }
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                if (redirectUrl) {
                    localStorage.removeItem('zhomes_redirect_after_login');
                    navigate(redirectUrl, { replace: true });
                    return;
                }
                const role = session.user.user_metadata?.role || 'client'
                if (role === 'realtor') navigate('/realtor', { replace: true })
                else if (role === 'broker') navigate('/dashboard', { replace: true })
                else navigate('/perfil', { replace: true })
            } else {
                setLoading(false)
            }
        }
        checkAuth()
    }, [navigate])

    const handleEmailLogin = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            setErrorMsg('Por favor ingresa email y contraseña.')
            return
        }
        setLoading(true)
        setErrorMsg('')
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            
            if (error) throw error

            // Si es exitoso, ruteamos según el rol guardado en los metadatos
            const role = data.user?.user_metadata?.role || 'client'
            
            if (role === 'realtor') {
                const { data: agentData } = await supabase
                    .from('zhomes_agents')
                    .select('status')
                    .eq('id', data.user.id)
                    .single()
                
                if (!agentData || agentData.status !== 'Active') {
                    await supabase.auth.signOut()
                    throw new Error('Cuenta sujeta a aprobación. Te notificaremos cuando el Broker te autorice.')
                }
            }
            
            const redirectUrl = localStorage.getItem('zhomes_redirect_after_login');
            if (redirectUrl) {
                localStorage.removeItem('zhomes_redirect_after_login');
                navigate(redirectUrl);
                return;
            }

            if (role === 'realtor') {
                navigate('/realtor')
            } else if (role === 'broker') {
                navigate('/dashboard')
            } else {
                navigate('/perfil')
            }
        } catch (error) {
            setErrorMsg(error.message || 'Error al iniciar sesión.')
        } finally {
            setLoading(false)
        }
    }

    const handleDemoLogin = () => {
        localStorage.setItem('zhomes_demo_user', JSON.stringify({ 
            id: 'demo-123', 
            name: loginRole === 'broker' ? 'Gilbert Demo' : (loginRole === 'realtor' ? 'Jessy Demo' : 'Client Demo'),
            role: loginRole 
        }))
        
        const redirectUrl = localStorage.getItem('zhomes_redirect_after_login');
        if (redirectUrl) {
            localStorage.removeItem('zhomes_redirect_after_login');
            navigate(redirectUrl, { replace: true });
        } else if (loginRole === 'realtor') {
            navigate('/realtor', { replace: true })
        } else if (loginRole === 'broker') {
            navigate('/dashboard', { replace: true })
        } else {
            navigate('/perfil', { replace: true })
        }
    }

    const handleOAuthLogin = async (provider) => {
        setLoading(true)
        setErrorMsg('')
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin + '/perfil' // Deberíamos redirigir a un manejador que verifique el rol
                }
            })
            if (error) throw error
        } catch (error) {
            setErrorMsg(`Error conectando con ${provider}.`)
            setLoading(false)
        }
    }

    return (
        <div className="mobile-login-page">
            <div className="ml-bg"></div>

            <div className="ml-content">
                <div className="ml-header">
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="ml-logo animate-float" />
                    <h1>{loginRole === 'broker' ? 'Portal Broker' : 'Portal ZHOMES'}</h1>
                    <p>
                        {loginRole === 'broker' 
                            ? 'Si no eres Gilbert o Ernesto, ¿qué haces aquí? 👀' 
                            : 'Inicia sesión en tu cuenta'}
                    </p>
                </div>

                <div className="ml-role-switcher" style={{ marginBottom: '20px' }}>
                    <button className={loginRole === 'client' ? 'active' : ''} type="button" onClick={() => setLoginRole('client')}>
                        <User size={16} /> Cliente
                    </button>
                    <button className={loginRole === 'realtor' ? 'active' : ''} type="button" onClick={() => setLoginRole('realtor')}>
                        <User size={16} /> Realtor
                    </button>
                    <button className={loginRole === 'broker' ? 'active' : ''} type="button" onClick={() => setLoginRole('broker')}>
                        <Key size={16} /> Broker
                    </button>
                </div>

                <form className="ml-form" onSubmit={handleEmailLogin}>
                    {errorMsg && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}
                    
                    <div className="ml-form-group">
                        <label><Mail size={14}/> Email</label>
                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required/>
                    </div>
                    <div className="ml-form-group">
                        <label><Key size={14}/> Contraseña</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required/>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '20px' }}>
                        <button 
                            type="button" 
                            onClick={() => navigate('/recuperar')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="ml-submit-btn" disabled={loading} style={{ margin: 0, flex: 1, padding: '16px 10px', fontSize: '1rem' }}>
                            {loading ? 'Iniciando...' : 'Inicia Sesión'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/registro')}
                            className="ml-submit-btn" 
                            style={{ margin: 0, flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', padding: '16px 10px', fontSize: '1rem' }}
                        >
                            Crear Cuenta
                        </button>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={handleDemoLogin}
                        className="ml-submit-btn" 
                        style={{ marginTop: '10px', width: '100%', background: 'linear-gradient(135deg, #FFB800, #F3A000)', color: '#1a1a1a', fontWeight: 'bold', border: 'none', padding: '16px 10px', fontSize: '1rem' }}
                    >
                        Acceso Rápido (Modo Demo)
                    </button>
                </form>

                <div className="ml-oauth-divider">
                    <span>O continúa con</span>
                </div>

                <div className="ml-oauth-buttons">
                    <button type="button" className="oauth-btn google-btn" onClick={() => handleOAuthLogin('google')} disabled={loading}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" />
                        Google
                    </button>
                    <button type="button" className="oauth-btn apple-btn" onClick={() => handleOAuthLogin('apple')} disabled={loading}>
                        <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" width="20" />
                        Apple
                    </button>
                </div>

            </div>
        </div>
    )
}
