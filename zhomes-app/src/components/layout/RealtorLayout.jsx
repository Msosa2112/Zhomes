import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, FileText, User,
    MessageSquare, FolderOpen, PlusCircle,
    Bell, LogOut, Sun, Moon
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useTheme } from '../../context/ThemeContext'
import { REALTORS } from '../../data/mockData'
import NotificationCenter from '../notifications/NotificationCenter'
import Grainient from '../shared/Grainient'
import '../layout/DashboardLayout.css'
import './RealtorLayout.css'

export default function RealtorLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const [notifOpen, setNotifOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()
    const currentRealtor = REALTORS[0]

    const handleLogout = async () => {
        localStorage.removeItem('zhomes_demo_user')
        localStorage.removeItem('zhomes_role')
        await supabase.auth.signOut()
        navigate('/')
    }

    const navItems = [
        { path: '/realtor', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/realtor/transacciones', label: 'Transacciones', icon: FileText },
        { path: '/realtor/documentos', label: 'Documentos', icon: FolderOpen },
        { path: '/realtor/mensajes', label: 'Mensajes', icon: MessageSquare },
        { path: '/realtor/crear-propiedad', label: 'Nueva Propiedad', icon: PlusCircle },
        { path: '/realtor/perfil', label: 'Perfil', icon: User },
    ]

    return (
        <div className="dashboard-layout realtor-portal">
            <div className="dashboard-screen">
                {/* Removed animated background per user request for simplicity */}
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
                    <Link to="/realtor" className="navbar-logo">
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
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                <div className="screen-actions-row">
                    <div className="actions-left">
                        <span className="realtor-badge">Realtor</span>
                    </div>
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
                            <img src={currentRealtor.photo} alt={currentRealtor.name} />
                        </div>
                    </div>
                </div>

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
                    </Link>
                ))}
            </nav>
        </div>
    )
}
