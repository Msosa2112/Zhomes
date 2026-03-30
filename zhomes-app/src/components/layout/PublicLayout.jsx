import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Building2, Flame, LogIn, Sun, Moon, Calculator, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../shared/LanguageToggle'
import Grainient from '../shared/Grainient'
import '../layout/DashboardLayout.css'
import './PublicLayout.css'

export default function PublicLayout() {
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const { t } = useTranslation()

    const navItemsLeft = [
        { path: '/', label: t('nav.home'), icon: Home },
        { path: '/propiedades', label: t('nav.properties'), icon: Building2 },
    ]

    const navItemsRight = [
        { path: '/vibe', label: t('nav.vibe'), icon: Flame },
        { path: '/calculadora', label: t('nav.calculator'), icon: Calculator },
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
                            <span>{t('nav.login')}</span>
                        </Link>
                    </div>
                </nav>

                <div className="screen-actions-row">
                    <div className="actions-left"></div>
                    <div className="actions-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <LanguageToggle />
                        <button className="screen-icon-btn" onClick={toggleTheme}>
                            <span className={`theme-icon ${theme === 'light' ? 'active' : ''}`}><Sun size={17} /></span>
                            <span className={`theme-icon ${theme === 'dark' ? 'active' : ''}`}><Moon size={17} /></span>
                        </button>
                        {/* CTA button removed for privacy */}
                    </div>
                </div>

                <main className="dashboard-main public-main">
                    <Outlet />

                    <footer className="public-footer">
                        <div className="footer-grid">
                            <div className="footer-brand">
                                <img src="/assets/logo/LOGO HRZNTL 1.png" alt="ZHOMES" />
                                <p>{t('footer.slogan')}</p>
                            </div>
                            <div className="footer-links">
                                <h4>{t('footer.explore')}</h4>
                                <Link to="/propiedades">{t('nav.properties')}</Link>
                                <Link to="/realtors">{t('footer.ourRealtors')}</Link>
                                <Link to="/calculadora">{t('footer.mortgageCalc')}</Link>
                            </div>
                            <div className="footer-links">
                                <h4>{t('footer.services')}</h4>
                                <Link to="/propiedades">{t('footer.buy')}</Link>
                                <Link to="/propiedades">{t('footer.sell')}</Link>
                                <Link to="/propiedades">{t('footer.invest')}</Link>
                            </div>
                            <div className="footer-links">
                                <h4>{t('footer.portal')}</h4>
                                <Link to="/login">{t('nav.login')}</Link>
                                <Link to="/register">{t('nav.register', 'Registrarse')}</Link>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            {t('footer.rights')}
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
                    <User size={20} />
                    <span>{t('nav.profile')}</span>
                </Link>
            </nav>
        </div>
    )
}
