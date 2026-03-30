import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css'

export default function RecoverPasswordMobile() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    const handleRecover = async (e) => {
        e.preventDefault()
        if (!email) {
            setErrorMsg('Por favor ingresa tu correo electrónico.')
            return
        }
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/actualizar-password`,
            })
            
            if (error) throw error

            setSuccessMsg('Se ha enviado un enlace de recuperación a tu correo electrónico. Recuerda revisar tu carpeta de Spam.')
            setEmail('')
        } catch (error) {
            setErrorMsg(error.message || 'Error al solicitar el enlace de recuperación.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mobile-login-page">
            <div className="ml-bg"></div>

            <div className="ml-content">
                <div className="ml-header" style={{ position: 'relative' }}>
                    <button 
                        onClick={() => navigate('/login')} 
                        style={{ position: 'absolute', left: 0, top: 0, background: 'transparent', border: 'none', color: 'white', padding: '10px', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="ml-logo" style={{ marginTop: '20px' }} />
                    <h1>Recuperar Contraseña</h1>
                    <p>Ingresa tu correo para recibir un enlace seguro</p>
                </div>

                <form className="ml-form" onSubmit={handleRecover}>
                    {errorMsg && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> 
                            <span>{successMsg}</span>
                        </div>
                    )}
                    
                    <div className="ml-form-group">
                        <label><Mail size={14}/> Correo Electrónico</label>
                        <input 
                            type="email" 
                            placeholder="ejemplo@correo.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={loading} 
                            required
                        />
                    </div>

                    <button type="submit" className="ml-submit-btn" disabled={loading} style={{ marginTop: '20px' }}>
                        {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/login')}
                        style={{ background: 'transparent', border: 'none', color: 'white', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    )
}
