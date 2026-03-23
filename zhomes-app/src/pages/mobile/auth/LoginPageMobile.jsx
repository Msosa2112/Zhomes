import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User } from 'lucide-react'
import './LoginPageMobile.css'

export default function LoginPageMobile() {
    const navigate = useNavigate()
    const [role, setRole] = useState('realtor')
    const [email, setEmail] = useState('valcarceljessy@gmail.com')

    const handleRoleSwitch = (newRole) => {
        setRole(newRole)
        setEmail(newRole === 'broker' ? 'gilbert@zhomesre.com' : 'valcarceljessy@gmail.com')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Determine routing based on assigned info
        if (role === 'realtor') {
            navigate('/realtor')
        } else {
            navigate('/dashboard')
        }
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
                </div>

                <form className="ml-form" onSubmit={handleSubmit}>
                    <div className="ml-form-group">
                        <label>Email</label>
                        <input type="email" placeholder="tu@zhomes.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="ml-form-group">
                        <label>Contraseña</label>
                        <input type="password" placeholder="••••••••" defaultValue="demo1234" />
                    </div>

                    <button type="submit" className="ml-submit-btn">
                        Entrar a la App
                    </button>
                </form>

                <p className="ml-footer">Prototipo ZHOMES v1.0 Mobile</p>
            </div>
        </div>
    )
}
