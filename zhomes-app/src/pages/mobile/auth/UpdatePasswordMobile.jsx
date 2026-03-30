import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css'

export default function UpdatePasswordMobile() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // Optional: detect if they arrived from an email link
    // with Supabase you usually get a hash parameter, and auth automatically picks it up
    useEffect(() => {
        // Just checking auth state
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // They clicked the reset link
            }
        })
    }, [])

    const handleUpdate = async (e) => {
        e.preventDefault()
        if (!password || !confirmPassword) {
            setErrorMsg('Por favor rellena todos los campos.')
            return
        }
        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.')
            return
        }
        if (password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        
        try {
            const { error } = await supabase.auth.updateUser({ password })
            
            if (error) throw error

            setSuccessMsg('Contraseña actualizada con éxito.')
            
            // Redirect after 2s
            setTimeout(() => {
                navigate('/login')
            }, 2000)

        } catch (error) {
            setErrorMsg(error.message || 'Error al actualizar la contraseña.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mobile-login-page">
            <div className="ml-bg"></div>

            <div className="ml-content">
                <div className="ml-header">
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="ml-logo animate-float" />
                    <h1>Nueva Contraseña</h1>
                    <p>Ingresa tu nueva contraseña para acceder</p>
                </div>

                <form className="ml-form" onSubmit={handleUpdate}>
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
                        <label><Key size={14}/> Nueva Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            disabled={loading} 
                            required
                        />
                    </div>
                    
                    <div className="ml-form-group">
                        <label><Key size={14}/> Confirmar Nueva Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            disabled={loading} 
                            required
                        />
                    </div>

                    <button type="submit" className="ml-submit-btn" disabled={loading} style={{ marginTop: '20px' }}>
                        {loading ? 'Actualizando...' : 'Actualizar y Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
