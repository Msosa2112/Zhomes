import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, CheckCircle2, MessageSquare, Menu, X, Users, TrendingUp, Briefcase, Sun, Moon } from 'lucide-react'
import { IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonTabBar, IonTabButton } from '@ionic/react'
import { useTheme } from '../../../context/ThemeContext'
import './DashboardLayoutMobile.css'

export default function DashboardLayoutMobile() {
    const loc = useLocation()
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)

    const navs = [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/transacciones', icon: Briefcase, label: 'Pipeline' },
        { path: '/documentos', icon: FileText, label: 'Docs' },
        { path: '/mensajes', icon: MessageSquare, label: 'Chat' },
    ]

    const extras = [
        { path: '/comisiones', icon: CheckCircle2, label: 'Comis' },
        { path: '/analytics', icon: TrendingUp, label: 'Analytics' },
        { path: '/equipo', icon: Users, label: 'Equipo' },
    ]

    return (
        <IonPage className="mobile-db-layout">
            <IonHeader className="ion-no-border">
                <IonToolbar style={{ '--background': 'var(--bg-glass-strong)' }}>
                    <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                        <div className="mobile-db-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            <img src="/assets/logo/fav.png" alt="Z" style={{ height: '24px' }} />
                            <span>ZHOMES Hub</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <button className="m-theme-toggle" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', display: 'flex' }}>
                                {theme === 'light' ? <Moon size={22} color="var(--text-primary)" /> : <Sun size={22} color="var(--text-primary)" />}
                            </button>
                            <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', display: 'flex' }}>
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <main className="mobile-dash-main" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                <Outlet />
            </main>

            {menuOpen && (
                <div className="mobile-db-slide-menu animate-fadeInUp" style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, background: 'var(--bg-secondary)', zIndex: 100, borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                    <div className="mobile-sm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', margin: 0 }}>Más Opciones</h3>
                        <button onClick={() => setMenuOpen(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}><X size={18} /></button>
                    </div>
                    <div className="mobile-sm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {extras.map(e => (
                            <Link key={e.path} to={e.path} onClick={() => setMenuOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: loc.pathname === e.path ? 'var(--zhomes-red)' : 'var(--text-secondary)', textDecoration: 'none' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: loc.pathname === e.path ? 'rgba(227, 30, 36, 0.1)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <e.icon size={24} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '500' }}>{e.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <nav className="mobile-floating-nav" style={{ zIndex: 1000 }}>
                {navs.map(n => {
                    const active = loc.pathname === n.path || (n.path !== '/dashboard' && loc.pathname.startsWith(n.path))
                    return (
                        <Link key={n.path} to={n.path} className={`m-float-tab ${active ? 'active' : ''}`}>
                            <n.icon size={20} className="m-float-icon" />
                            <span className="m-float-label">{n.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </IonPage>
    )
}
