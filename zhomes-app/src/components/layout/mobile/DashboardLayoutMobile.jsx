import { useState, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, CheckCircle2, MessageSquare, Menu, X, Users, TrendingUp, Briefcase, Sun, Moon, UserPlus, Calendar, PenTool, BarChart3, MapPin, Target, Wallet, ShieldAlert, Heart, HeartHandshake } from 'lucide-react'
import { IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonTabBar, IonTabButton } from '@ionic/react'
import { useTheme } from '../../../context/ThemeContext'
import './DashboardLayoutMobile.css'

export default function DashboardLayoutMobile() {
    const loc = useLocation()
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [showHeader, setShowHeader] = useState(true)
    const lastScrollY = useRef(0)

    const handleScroll = (e) => {
        const currentScrollY = e.detail ? e.detail.scrollTop : e.target.scrollTop;
        if (currentScrollY > lastScrollY.current + 12 && currentScrollY > 60) {
            setShowHeader(false);
        } else if (currentScrollY < lastScrollY.current - 12 || currentScrollY <= 0) {
            setShowHeader(true);
        }
        lastScrollY.current = currentScrollY;
    }

    const navs = [
        { path: '/dashboard', icon: Home, label: 'Inicio' },
        { path: '/transacciones', icon: Briefcase, label: 'Pipeline' },
        { path: '/documentos', icon: FileText, label: 'Docs' },
        { path: '/mensajes', icon: MessageSquare, label: 'Chat' },
    ]

    const extras = [
        { path: '/crm', icon: UserPlus, label: 'CRM' },
        { path: '/visitas', icon: Calendar, label: 'Visitas' },
        { path: '/firmas', icon: PenTool, label: 'Firmas' },
        { path: '/cma', icon: BarChart3, label: 'CMA' },
        { path: '/mercado', icon: TrendingUp, label: 'Mercado' },
        { path: '/prospecting', icon: Target, label: 'Prospect' },
        { path: '/contabilidad', icon: Wallet, label: 'Contab.' },
        { path: '/comisiones', icon: CheckCircle2, label: 'Comis' },
        { path: '/analytics', icon: MapPin, label: 'Analytics' },
        { path: '/equipo', icon: Users, label: 'Equipo' },
        { path: '/admin/config', icon: ShieldAlert, label: 'Sistema' },
    ]

    return (
        <IonPage className="mobile-db-layout">
            <IonHeader className="ion-no-border" style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, 
                zIndex: 9999, 
                background: 'transparent',
                padding: 'env(safe-area-inset-top) 0 0',
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.4s cubic-bezier(0.3, 1, 0.3, 1)',
                pointerEvents: showHeader ? 'auto' : 'none'
            }}>
                <IonToolbar style={{ '--background': 'transparent' }}>
                    <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '60px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {(loc.pathname === '/dashboard') && (
                                <button className="m-theme-toggle" onClick={() => navigate('/')} style={{ background: 'rgba(228, 31, 37, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '50%', border: '1px solid rgba(228, 31, 37, 0.2)', color: 'var(--zhomes-red)', display: 'flex', padding: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                </button>
                            )}
                            <button className="m-theme-toggle" onClick={toggleTheme} style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', padding: '8px' }}>
                                {theme === 'light' ? <Moon size={18} color="white" /> : <Sun size={18} color="white" />}
                            </button>
                            <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', padding: '8px' }}>
                                {menuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent scrollEvents={true} onIonScroll={handleScroll} className="mobile-dash-main" style={{ '--background': 'var(--bg-secondary)' }}>
                <div style={{ paddingBottom: '90px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <Outlet />
                </div>
            </IonContent>

            {menuOpen && (
                <div className="mobile-db-slide-menu animate-fadeInUp" style={{ position: 'absolute', bottom: '85px', left: 0, right: 0, background: 'var(--bg-secondary)', zIndex: 100, borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                    <div className="mobile-sm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', margin: 0 }}>Más Opciones</h3>
                        <button onClick={() => setMenuOpen(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}><X size={18} /></button>
                    </div>
                    <div className="mobile-sm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
