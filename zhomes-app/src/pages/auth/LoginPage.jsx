import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, ArrowLeft, Eye, EyeOff, Building2, User } from 'lucide-react'
import { DEMO_USERS } from '../../data/mockData'
import './LoginPage.css'

export default function LoginPage() {
    const navigate = useNavigate()
    const [showPass, setShowPass] = useState(false)
    const [role, setRole] = useState('broker')
    const [email, setEmail] = useState('gilbert@zhomesre.com')

    const handleRoleSwitch = (newRole) => {
        setRole(newRole)
        setEmail(newRole === 'broker' ? 'gilbert@zhomesre.com' : 'valcarceljessy@gmail.com')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const user = DEMO_USERS[email]
        if (user?.role === 'realtor') {
            navigate('/realtor')
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-gradient"></div>
                <div className="login-particles">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="particle" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                        }}></div>
                    ))}
                </div>
            </div>

            <div className="login-card glass animate-fadeInUp">
                <Link to="/" className="login-back">
                    <ArrowLeft size={16} />
                    Volver al inicio
                </Link>

                <div className="login-header">
                    <img src="/assets/logo/fav.png" alt="ZHOMES" className="login-logo animate-float" />
                    <h1>Portal ZHOMES</h1>
                    <p>Accede a tu Centro de Mando</p>
                </div>

                {/* Role Switcher */}
                <div className="role-switcher">
                    <button
                        type="button"
                        className={`role-btn ${role === 'broker' ? 'active' : ''}`}
                        onClick={() => handleRoleSwitch('broker')}
                    >
                        <Building2 size={18} />
                        <span>Broker</span>
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${role === 'realtor' ? 'active' : ''}`}
                        onClick={() => handleRoleSwitch('realtor')}
                    >
                        <User size={18} />
                        <span>Realtor</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="tu@zhomes.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="pass-wrap">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                defaultValue="demo1234"
                            />
                            <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-gold btn-lg login-submit">
                        <LogIn size={18} />
                        {role === 'broker' ? 'Entrar como Broker' : 'Entrar como Realtor'}
                    </button>
                </form>

                <p className="login-footer">
                    <span className="text-tertiary">Prototipo ZHOMES v1.0</span>
                </p>
            </div>
        </div>
    )
}
