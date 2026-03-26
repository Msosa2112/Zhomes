import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, User, Calculator, Building2, Sun, Moon, Map, Flame, Heart } from 'lucide-react'
import { IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonTabBar, IonTabButton, IonButtons } from '@ionic/react'
import { useTheme } from '../../../context/ThemeContext'
import './PublicLayoutMobile.css'

export default function PublicLayoutMobile() {
    const loc = useLocation()
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()

    const [showHeader, setShowHeader] = useState(true)
    const lastScrollY = useRef(0)

    const handleScroll = (e) => {
        const currentScrollY = e.detail ? e.detail.scrollTop : e.target.scrollTop;
        if (currentScrollY > lastScrollY.current + 12 && currentScrollY > 60) {
            // Scrolling down significantly
            setShowHeader(false);
        } else if (currentScrollY < lastScrollY.current - 12 || currentScrollY <= 0) {
            // Scrolling up significantly, or at the very top
            setShowHeader(true);
        }
        lastScrollY.current = currentScrollY;
    }
    const navs = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/propiedades', icon: Search, label: 'Buscar' },
        { path: '/swipe', icon: Heart, label: 'Match' },
        { path: '/mapa', icon: Map, label: 'Mapa' },
        { path: '/vibe', icon: Flame, label: 'Vibe' },
    ]

    const isPropertyDetail = loc.pathname.startsWith('/propiedades/') && loc.pathname.length > '/propiedades/'.length;

    return (
        <IonPage className="mobile-public-layout">
            <IonHeader className="ion-no-border" style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, 
                zIndex: 9999, 
                background: 'transparent',
                padding: 'env(safe-area-inset-top) 0 0',
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.4s cubic-bezier(0.3, 1, 0.3, 1)',
                pointerEvents: showHeader ? 'auto' : 'none',
                display: isPropertyDetail ? 'none' : 'block'
            }}>
                <IonToolbar style={{ '--background': 'transparent' }}>
                    <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
                        <Link to="/" className="m-pub-logo" style={{ display: 'flex', alignItems: 'center' }}>
                            <img src="/assets/logo/LOGO HRZNTL 1.png" alt="ZHOMES" style={{ height: '28px' }} />
                        </Link>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button className="m-theme-toggle" onClick={toggleTheme} style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius:'50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', padding: '8px' }}>
                                {theme === 'light' ? <Moon size={18} color="white" /> : <Sun size={18} color="white" />}
                            </button>
                            <Link to="/login" className="m-pub-login" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white', background: 'var(--zhomes-red)', padding: '8px 14px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(227, 30, 36, 0.3)' }}>
                                <User size={16} /> Perfil
                            </Link>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent scrollEvents={true} onIonScroll={handleScroll} className="mobile-pub-main" style={{ '--background': 'transparent' }}>
                <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <Outlet />
                </div>
            </IonContent>

            <nav className="mobile-floating-nav">
                {navs.map(n => {
                    const active = loc.pathname === n.path || (n.path !== '/' && loc.pathname.startsWith(n.path))
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
