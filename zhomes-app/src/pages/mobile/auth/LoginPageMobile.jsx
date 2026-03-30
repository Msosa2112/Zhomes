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
                    navigate('/perfil', { replace: true })
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

                    <button type="submit" className="ml-submit-btn" disabled={loading}>
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
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

                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'white' }}>¿Eres nuevo en ZHomes?</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                        Crea tu cuenta gratis como Cliente o aplica como Realtor asociado.
                    </p>
                    <button 
                        onClick={() => navigate('/registro')}
                        style={{
                            background: 'white', color: 'var(--zhomes-red)', width: '100%', padding: '12px',
                            borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <UserPlus size={18} />
                        Crear Cuenta Nueva
                    </button>
                </div>

            </div>
        </div>
    )
}
