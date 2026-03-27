import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User, Key, Mail, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css'

export default function LoginPageMobile() {
    const navigate = useNavigate()
    const [role, setRole] = useState('realtor')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleRoleSwitch = (newRole) => {
        setRole(newRole)
        setErrorMsg('')
    }

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

            // Si es exitoso, ruteamos según el rol
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
                    redirectTo: window.location.origin + (role === 'realtor' ? '/realtor' : '/dashboard')
                }
            })
            if (error) throw error
        } catch (error) {
            setErrorMsg(`Error conectando con ${provider}.`)
            setLoading(false)
        }
    }

    const handleDemoLogin = () => {
        // Bypass Supabase auth for demo purposes
        const demoUsers = {
            broker: { email: 'broker@zhomes.com', name: 'Gilbert Zaldivar', role: 'broker' },
            realtor: { email: 'jessica@zhomes.com', name: 'Jessica Hernandez', role: 'realtor' },
            client: { email: 'cliente@zhomes.com', name: 'Carlos Rivera', role: 'client' },
        }
        const user = demoUsers[role]
        localStorage.setItem('zhomes_demo_user', JSON.stringify(user))
        
        if (role === 'realtor') navigate('/realtor')
        else if (role === 'broker') navigate('/dashboard')
        else navigate('/perfil')
    }

    return (
        <div className="mobile-login-page">
            <div className="ml-bg"></div>

            <div className="ml-content">
                <div className="ml-header">
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="ml-logo animate-float" />
                    <h1>Portal ZHOMES</h1>
                    <p>Accede a tu Centro de Mando</p>
                </div>

                <div className="ml-role-switcher">
                    <button className={role === 'broker' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('broker')}>
                        <Building2 size={18} /> Broker
                    </button>
                    <button className={role === 'realtor' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('realtor')}>
                        <User size={18} /> Realtor
                    </button>
                    <button className={role === 'client' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('client')}>
                        <User size={18} /> Cliente
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
                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="ml-form-group">
                        <label><Key size={14}/> Contraseña</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    </div>

                    <button type="submit" className="ml-submit-btn" disabled={loading}>
                        {loading ? 'Iniciando...' : 'Entrar con Email'}
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

                <p className="ml-footer" style={{ marginTop: '30px' }}>ZHOMES v1.0 Mobile Auth</p>
            </div>
        </div>
    )
}
