import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, User, Key, Mail, Phone, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css' // Reutilizamos estilos, añadimos pocos nuevos si hace falta

export default function RegisterPageMobile() {
    const navigate = useNavigate()
    const [role, setRole] = useState('client')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        license: ''
    })
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState(false)

    const handleRoleSwitch = (newRole) => {
        setRole(newRole)
        setErrorMsg('')
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
            setErrorMsg('Por favor completa todos los campos obligatorios.')
            return
        }
        if (formData.password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
            return
        }
        
        setLoading(true)
        setErrorMsg('')

        try {
            // 1. Crear el usuario en Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone,
                        role: role,
                        license_number: formData.license || null
                    }
                }
            })

            if (error) throw error

            // Si llegamos aquí, el registro fue exitoso
            // Dependiendo de si activaste la confirmación de email, el usuario podría no estar "activo" aún.
            setSuccessMsg(true)

            // Intentar crear un registro temporal en la base de datos si es agent (puedes fallar por RLS, se ignora por ahora si es así)
            if (role === 'realtor' && data?.user) {
                await supabase.from('zhomes_agents').insert([{
                    id: data.user.id,
                    full_name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    status: 'pending_approval' // Ideal para revisar antes de darles acceso a publicar
                }]);

                // Notificar al administrador en N8N para la aprobación
                try {
                    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL_REALTOR_APPROVAL || 'https://n8n-production-cfe9c.up.railway.app/webhook/realtor-approval';
                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            realtor_name: formData.name,
                            realtor_email: formData.email,
                            realtor_phone: formData.phone,
                            timestamp: new Date().toISOString()
                        })
                    }).catch(e => console.warn('[N8N] Admin approval hook failed:', e));
                } catch (e) {
                    console.error('Error firing approval hook', e);
                }
            }

        } catch (error) {
            setErrorMsg(error.message || 'Error al crear la cuenta.')
        } finally {
            setLoading(false)
        }
    }

    if (successMsg) {
        return (
            <div className="mobile-login-page">
                <div className="ml-bg"></div>
                <div className="ml-content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <CheckCircle2 color="#10B981" size={64} style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>¡Cuenta Creada!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                        Hemos enviado un correo de confirmación a <b>{formData.email}</b>. Por favor, revisa tu bandeja de entrada o la carpeta de SPAM para verificar tu cuenta antes de iniciar sesión.
                    </p>
                    <button onClick={() => navigate('/login')} className="ml-submit-btn" style={{ width: '100%' }}>
                        Ir al Inicio de Sesión
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mobile-login-page" style={{ height: 'auto', minHeight: '100dvh' }}>
            <div className="ml-bg"></div>

            <div className="ml-content">
                <div className="ml-header" style={{ marginBottom: '1.5rem' }}>
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="ml-logo animate-float" style={{ width: '48px', height: '48px' }} />
                    <h1 style={{ fontSize: '1.5rem' }}>Únete a ZHOMES</h1>
                    <p>Crea tu cuenta en segundos</p>
                </div>

                <div className="ml-role-switcher">
                    <button className={role === 'client' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('client')}>
                        <User size={18} /> Soy Cliente
                    </button>
                    <button className={role === 'realtor' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('realtor')}>
                        <Building2 size={18} /> Soy Realtor
                    </button>
                </div>

                <form className="ml-form" onSubmit={handleRegister}>
                    {errorMsg && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}
                    
                    <div className="ml-form-group">
                        <label><User size={14}/> Nombre Completo *</label>
                        <input type="text" name="name" placeholder="Ej. Carlos Rivera" value={formData.name} onChange={handleChange} disabled={loading} required />
                    </div>

                    <div className="ml-form-group">
                        <label><Mail size={14}/> Correo Electrónico *</label>
                        <input type="email" name="email" placeholder="ejemplo@correo.com" value={formData.email} onChange={handleChange} disabled={loading} required />
                    </div>

                    <div className="ml-form-group">
                        <label><Phone size={14}/> Teléfono Móvil *</label>
                        <input type="tel" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} disabled={loading} required />
                    </div>

                    <div className="ml-form-group">
                        <label><Key size={14}/> Crear Contraseña *</label>
                        <input type="password" name="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange} minLength={6} disabled={loading} required />
                    </div>

                    {role === 'realtor' && (
                        <div className="ml-form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <label><Building2 size={14}/> DRE / Número de Licencia (Opcional)</label>
                            <input type="text" name="license" placeholder="Ej. 01234567" value={formData.license} onChange={handleChange} disabled={loading} />
                        </div>
                    )}

                    <button type="submit" className="ml-submit-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                        ¿Ya tienes una cuenta? <Link to="/login" style={{ color: 'var(--zhomes-red)', fontWeight: 'bold', textDecoration: 'none' }}>Inicia sesión aquí</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
