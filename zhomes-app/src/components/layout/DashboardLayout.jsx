import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, FileText, Users,
    FolderOpen, MessageSquare, BarChart3, Bell, LogOut, Sun, Moon
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useTheme } from '../../context/ThemeContext'
import NotificationCenter from '../notifications/NotificationCenter'
import Grainient from '../shared/Grainient'
import './DashboardLayout.css'

export default function DashboardLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const [notifOpen, setNotifOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()

    const handleLogout = async () => {
        localStorage.removeItem('zhomes_demo_user')
        localStorage.removeItem('zhomes_role')
        await supabase.auth.signOut()
        navigate('/')
    }

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/transacciones', label: 'Transacciones', icon: FileText },
        { path: '/documentos', label: 'Documentos', icon: FolderOpen },
        { path: '/equipo', label: 'Equipo', icon: Users },
        { path: '/mensajes', label: 'Mensajes', icon: MessageSquare, badge: 3 },
    ]

    return (
        <div className="dashboard-layout">
            {/* Entire screen scrolls; notch is sticky */}
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
                {/* Notch — sticky at top */}
                <nav className="top-navbar">
                    <div className="navbar-nav navbar-nav-left">
                        {navItems.slice(0, 3).map(item => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                    <Link to="/dashboard" className="navbar-logo">
                        <img src="/assets/logo/LOGO HRZNTL 1.png" alt="ZHOMES" className="logo-full" />
                        <img src="/assets/logo/fav.png" alt="Z" className="logo-icon" />
                    </Link>
                    <div className="navbar-nav navbar-nav-right">
                        {navItems.slice(3).map(item => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Action row — overlaps notch level, scrolls away behind it */}
                <div className="screen-actions-row">
                    <div className="actions-left"></div>
                    <div className="actions-right">
                        <button className="screen-icon-btn" onClick={toggleTheme}>
                            <span className={`theme-icon ${theme === 'light' ? 'active' : ''}`}><Sun size={17} /></span>
                            <span className={`theme-icon ${theme === 'dark' ? 'active' : ''}`}><Moon size={17} /></span>
                        </button>
                        <button className="screen-icon-btn" onClick={() => setNotifOpen(true)}>
                            <Bell size={18} />
                            <span className="notification-dot"></span>
                        </button>
                        <button className="screen-icon-btn logout-btn" onClick={handleLogout}><LogOut size={16} /></button>
                        <div className="topbar-avatar">
                            <img src="/assets/agents/Gilbert Zaldivar-Broker.png" alt="Broker" />
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main className="dashboard-main">
                    <Outlet />
                </main>
            </div>

            <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

            <nav className="mobile-bottom-nav">
                {navItems.slice(0, 5).map(item => (
                    <Link key={item.path} to={item.path}
                        className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                        {item.badge && <span className="mobile-nav-badge">{item.badge}</span>}
                    </Link>
                ))}
            </nav>
        </div>
    )
}
