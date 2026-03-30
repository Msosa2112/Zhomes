import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import './LoginPageMobile.css' // Reusing styles

export default function CompleteProfileMobile() {
    const navigate = useNavigate()
    const [role, setRole] = useState('client')
    const [license, setLicense] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [user, setUser] = useState(null)

    useEffect(() => {
        // Fetch current user
        supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error || !user) {
                navigate('/login')
            } else {
                setUser(user)
                // If they already have a role, redirect to their dashboard
                if (user.user_metadata?.role) {
                    navigate(user.user_metadata.role === 'realtor' ? '/realtor' : '/perfil', { replace: true })
                }
            }
        })
    }, [navigate])

    const handleRoleSwitch = (newRole) => {
        setRole(newRole)
        setErrorMsg('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user) return

        if (role === 'realtor' && !license) {
            setErrorMsg('Por favor ingresa tu número de licencia (DRE).')
            return
        }

        setLoading(true)
        setErrorMsg('')

        try {
            // Update user metadata in Auth
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    role: role,
                    license_number: role === 'realtor' ? license : null
                }
            })

            if (error) throw error

            // If realtor, create pending agent profile
            if (role === 'realtor') {
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Agente'
                await supabase.from('zhomes_agents').insert([{
                    id: user.id,
                    full_name: fullName,
                    email: user.email,
                    status: 'pending_approval'
                }]).select()
            }

            // Route user based on selection
            if (role === 'realtor') {
                navigate('/realtor', { replace: true })
            } else {
                navigate('/perfil', { replace: true })
            }

        } catch (error) {
            setErrorMsg(error.message || 'Error al actualizar el perfil.')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0e0e0e' }}>
                <div className="custom-spinner" style={{ width: 40, height: 40, border: '4px solid #E31E24', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
    )

    return (
        <div className="mobile-login-page" style={{ height: 'auto', minHeight: '100dvh' }}>
            <div className="ml-bg"></div>

            <div className="ml-content" style={{ padding: '2rem 1.5rem', marginTop: '10vh' }}>
                <div className="ml-header" style={{ marginBottom: '1.5rem' }}>
                    <CheckCircle2 color="#10B981" size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <h1 style={{ fontSize: '1.5rem' }}>Cuenta Validada</h1>
                    <p style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
                        ¡Te has conectado con éxito! Solo un paso más para personalizar tu experiencia en ZHomes.
                    </p>
                </div>

                <div className="ml-role-switcher" style={{ marginTop: '2rem' }}>
                    <button className={role === 'client' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('client')}>
                        <User size={18} /> Soy Cliente
                    </button>
                    <button className={role === 'realtor' ? 'active' : ''} type="button" onClick={() => handleRoleSwitch('realtor')}>
                        <Building2 size={18} /> Soy Realtor
                    </button>
                </div>

                <form className="ml-form" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                    {errorMsg && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}

                    {role === 'client' ? (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
                            Buscarás viviendas, agendarás visitas y te conectarás con Realtors profesionales aprobados.
                        </div>
                    ) : (
                        <div className="ml-form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <label><Building2 size={14}/> DRE / Número de Licencia *</label>
                            <input 
                                type="text" 
                                placeholder="Ej. 01234567" 
                                value={license} 
                                onChange={(e) => setLicense(e.target.value)} 
                                disabled={loading} 
                                required 
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                Tu cuenta será verificada por nuestro equipo antes de publicar propiedades completas.
                            </p>
                        </div>
                    )}

                    <button type="submit" className="ml-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
                        {loading ? 'Guardando...' : `Finalizar como ${role === 'realtor' ? 'Realtor' : 'Cliente'}`}
                    </button>
                </form>
            </div>
        </div>
    )
}
