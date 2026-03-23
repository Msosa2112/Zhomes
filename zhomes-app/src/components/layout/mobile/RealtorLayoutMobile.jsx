import { useState, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, CheckCircle2, MessageSquare, Menu, X, User, PlusCircle, Briefcase, Sun, Moon } from 'lucide-react'
import { IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonTabBar, IonTabButton } from '@ionic/react'
import { useTheme } from '../../../context/ThemeContext'
import './DashboardLayoutMobile.css' // Reusing the identical layout styles

export default function RealtorLayoutMobile() {
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
        { path: '/realtor', icon: Home, label: 'Inicio' },
        { path: '/realtor/transacciones', icon: Briefcase, label: 'Pipeline' },
        { path: '/realtor/documentos', icon: FileText, label: 'Docs' },
        { path: '/realtor/mensajes', icon: MessageSquare, label: 'Chat' },
    ]

    const extras = [
        { path: '/realtor/comisiones', icon: CheckCircle2, label: 'Comis' },
        { path: '/realtor/crear-propiedad', icon: PlusCircle, label: 'Nueva' },
        { path: '/realtor/perfil', icon: User, label: 'Perfil' },
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
                    <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
                        <Link to="/" className="mobile-db-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                            <img src="/assets/logo/fav.png" alt="Z" style={{ height: '24px' }} />
                            <span>Realtor Hub</span>
                        </Link>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                    const active = loc.pathname === n.path || (n.path !== '/realtor' && loc.pathname.startsWith(n.path))
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
