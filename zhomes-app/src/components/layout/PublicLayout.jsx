import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Building2, Users, LogIn, Sun, Moon, Calculator } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import Grainient from '../shared/Grainient'
import '../layout/DashboardLayout.css'
import './PublicLayout.css'

export default function PublicLayout() {
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()

    const navItemsLeft = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/propiedades', label: 'Propiedades', icon: Building2 },
    ]

    const navItemsRight = [
        { path: '/realtors', label: 'Realtors', icon: Users },
        { path: '/calculadora', label: 'Calculadora', icon: Calculator },
    ]

    const allNavItems = [...navItemsLeft, ...navItemsRight]

    return (
        <div className="dashboard-layout public-layout">
            <div className="dashboard-screen">
                {/* WebGL animated background */}
                <div className="grainient-bg">
                    <Grainient
                        color1={theme === 'dark' ? "#050505" : "#F7F8FA"}
                        color2={theme === 'dark' ? "#61170f" : "#FFE082"}
                        color3={theme === 'dark' ? "#190606" : "#FFFFFF"}
                        timeSpeed={0.75}
                        colorBalance={theme === 'dark' ? 0.13 : 0.6}
                        warpStrength={2.25}
                        warpFrequency={9.3} warpSpeed={2.8} warpAmplitude={50}
                        blendAngle={0} blendSoftness={0.28} rotationAmount={500}
                        noiseScale={2.55} grainAmount={0.1} grainScale={2}
                        grainAnimated
                        contrast={theme === 'dark' ? 1.5 : 1.1}
                        gamma={1} saturation={1}
                        centerX={0} centerY={0} zoom={0.9}
                    />
                </div>
                <nav className="top-navbar">
                    <div className="navbar-nav navbar-nav-left">
                        {navItemsLeft.map(item => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                    <Link to="/" className="navbar-logo">
                        <img src="/assets/logo/LOGO HRZNTL 1.png" alt="ZHOMES" className="logo-full" />
                        <img src="/assets/logo/fav.png" alt="Z" className="logo-icon" />
                    </Link>
                    <div className="navbar-nav navbar-nav-right">
                        {navItemsRight.map(item => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                        <Link to="/login" className={`nav-link`}>
                            <LogIn size={16} />
                            <span>Iniciar Sesión</span>
                        </Link>
                    </div>
                </nav>

                <div className="screen-actions-row">
                    <div className="actions-left"></div>
                    <div className="actions-right">
                        <button className="screen-icon-btn" onClick={toggleTheme}>
                            <span className={`theme-icon ${theme === 'light' ? 'active' : ''}`}><Sun size={17} /></span>
                            <span className={`theme-icon ${theme === 'dark' ? 'active' : ''}`}><Moon size={17} /></span>
                        </button>
                        <Link to="/login" className="public-cta-btn">
                            <LogIn size={14} />
                            <span>Portal Broker</span>
                        </Link>
                    </div>
                </div>

                <main className="dashboard-main public-main">
                    <Outlet />

                    <footer className="public-footer">
                        <div className="footer-grid">
                            <div className="footer-brand">
                                <img src="/assets/logo/LOGO HRZNTL 1.png" alt="ZHOMES" />
                                <p>Conectando familias con las mejores propiedades de Kentucky desde Louisville.</p>
                            </div>
                            <div className="footer-links">
                                <h4>Explora</h4>
                                <Link to="/propiedades">Propiedades</Link>
                                <Link to="/realtors">Nuestros Realtors</Link>
                                <Link to="/calculadora">Calculadora Hipoteca</Link>
                            </div>
                            <div className="footer-links">
                                <h4>Servicios</h4>
                                <Link to="/propiedades">Comprar</Link>
                                <Link to="/propiedades">Vender</Link>
                                <Link to="/propiedades">Invertir</Link>
                            </div>
                            <div className="footer-links">
                                <h4>Portal</h4>
                                <Link to="/login">Portal Broker</Link>
                                <Link to="/login">Iniciar Sesión</Link>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            © 2025 ZHOMES Real Estate. Todos los derechos reservados.
                        </div>
                    </footer>
                </main>
            </div>

            <nav className="mobile-bottom-nav">
                {allNavItems.map(item => (
                    <Link key={item.path} to={item.path}
                        className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </Link>
                ))}
                <Link to="/login" className={`mobile-nav-item`}>
                    <LogIn size={20} />
                    <span>Portal</span>
                </Link>
            </nav>
        </div>
    )
}
