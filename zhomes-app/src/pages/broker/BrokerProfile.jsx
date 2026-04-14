import { useState } from 'react'
import { Star, MapPin, Phone, Mail, Award, Globe, Camera, Share2, Briefcase, Play, Edit3, Save, X, ExternalLink } from 'lucide-react'
import { BROKER, REALTOR_TRANSACTIONS } from '../../data/mockData'
import '../realtor/RealtorProfile.css' // Usamos los mismos estilos del realtor

const TikTokIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const SOCIAL_NETWORKS = [
    { key: 'instagram', label: 'Instagram', icon: Camera,    placeholder: 'https://instagram.com/tu_usuario',  color: 'var(--text-secondary)' },
    { key: 'facebook',  label: 'Facebook',  icon: Share2,    placeholder: 'https://facebook.com/tu_pagina',    color: 'var(--text-secondary)' },
    { key: 'linkedin',  label: 'LinkedIn',  icon: Briefcase, placeholder: 'https://linkedin.com/in/tu_perfil', color: 'var(--text-secondary)' },
    { key: 'tiktok',    label: 'TikTok',    icon: TikTokIcon, placeholder: 'https://tiktok.com/@tu_usuario',   color: 'var(--text-secondary)' },
    { key: 'youtube',   label: 'YouTube',   icon: Play,      placeholder: 'https://youtube.com/@tu_canal',    color: 'var(--text-secondary)' },
    { key: 'website', label: 'Sitio Web', icon: Globe, placeholder: 'https://tu-sitio-web.com', color: '#6366F1' },
]

export default function BrokerProfile() {
    // Usamos el BROKER exportado (Gilbert)
    const [broker, setBroker] = useState({...BROKER, rating: 5.0, sales: 156, bio: 'Fundador y Principal Broker de ZHOMES Real Estate. Dedicado a llevar el sector inmobiliario hispano al siguiente nivel, brindando infraestructura y excelencia.'})
    const [editingProfile, setEditingProfile] = useState(false)
    const [tempProfile, setTempProfile] = useState(broker)
    
    // Solo demo numbers
    const totalSales = 156
    const totalVolume = 45000000
    const activeListings = 12

    // Social links state
    const [socialLinks, setSocialLinks] = useState({
        instagram: broker.social?.instagram || '',
        facebook: broker.social?.facebook || '',
        linkedin: broker.social?.linkedin || '',
        tiktok: broker.social?.tiktok || '',
        youtube: broker.social?.youtube || '',
        website: broker.website || 'https://zhomesre.com',
    })
    const [editingSocial, setEditingSocial] = useState(false)
    const [tempLinks, setTempLinks] = useState({ ...socialLinks })
    const [savedMsg, setSavedMsg] = useState(false)

    const handleEditSocial = () => {
        setTempLinks({ ...socialLinks })
        setEditingSocial(true)
    }

    const handleCancelSocial = () => {
        setTempLinks({ ...socialLinks })
        setEditingSocial(false)
    }

    const handleSaveSocial = () => {
        setSocialLinks({ ...tempLinks })
        setEditingSocial(false)
        setSavedMsg(true)
        setTimeout(() => setSavedMsg(false), 2500)
    }

    const filledCount = Object.values(socialLinks).filter(v => typeof v === 'string' && v.trim()).length

    return (
        <div className="rp-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Mi Perfil</h1>
                    <p className="page-subtitle">Configuración del Broker</p>
                </div>
                {!editingProfile ? (
                    <button className="btn btn-ghost" onClick={() => {setTempProfile({...broker}); setEditingProfile(true);}}>
                        <Edit3 size={16} style={{marginRight: '6px'}}/> Editar
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost" style={{padding: '8px 12px'}} onClick={() => setEditingProfile(false)}>Canc.</button>
                        <button className="btn btn-primary" style={{padding: '8px 12px'}} onClick={() => {setBroker({...tempProfile}); setEditingProfile(false);}}>Gdr</button>
                    </div>
                )}
            </div>

            <div className="rp-grid">
                {/* Profile card */}
                <div className="rp-profile-card animate-fadeInUp">
                    <div className="rp-avatar-wrap">
                        <img src={broker.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(broker.name) + '&background=e41f25&color=fff'} alt={broker.name} className="rp-avatar" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(broker.name) + '&background=e41f25&color=fff' }} />
                        <span className="rp-top-badge">
                            <Award size={12} />
                            BROKER
                        </span>
                    </div>
                    {editingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '16px' }}>
                            <input type="text" className="rp-social-input" value={tempProfile.name} onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})} placeholder="Nombre completo" />
                            <input type="text" className="rp-social-input" value={tempProfile.title} onChange={(e) => setTempProfile({...tempProfile, title: e.target.value})} placeholder="Título profesional" />
                        </div>
                    ) : (
                        <>
                            <h2 className="rp-name">{broker.name}</h2>
                            <span className="rp-title">{broker.title}</span>
                            <span className="rp-specialty">ZHOMES Real Estate</span>
                        </>
                    )}

                    <div className="rp-rating">
                        <Star size={16} fill="#F5A623" color="#F5A623" />
                        <span>{broker.rating}</span>
                        <span className="rp-rating-label">· {broker.sales} ventas</span>
                    </div>

                    <div className="rp-contact-info">
                        <div className="rp-contact-item">
                            <Phone size={16} style={{ flexShrink: 0 }} />
                            {editingProfile ? (
                                <input type="text" className="rp-social-input" value={tempProfile.phone} onChange={(e) => setTempProfile({...tempProfile, phone: e.target.value})} />
                            ) : <span>{broker.phone}</span>}
                        </div>
                        <div className="rp-contact-item">
                            <Mail size={16} style={{ flexShrink: 0 }} />
                            {editingProfile ? (
                                <input type="email" className="rp-social-input" value={tempProfile.email} onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})} />
                            ) : <span>{broker.email}</span>}
                        </div>
                        <div className="rp-contact-item">
                            <MapPin size={16} />
                            <span>Louisville, KY</span>
                        </div>
                    </div>

                    {/* Social links (display only) */}
                    <div className="rp-social">
                        {SOCIAL_NETWORKS.filter(n => socialLinks[n.key]).map(net => (
                            <a key={net.key} href={socialLinks[net.key]} target="_blank" rel="noreferrer" className="rp-social-link" title={net.label}>
                                <net.icon size={18} />
                            </a>
                        ))}
                        {filledCount === 0 && (
                            <span className="rp-no-social">Sin redes configuradas</span>
                        )}
                    </div>

                    {/* Languages */}
                    <div className="rp-languages" style={{ flexWrap: 'wrap' }}>
                        <Globe size={14} />
                        {editingProfile ? (
                            <input type="text" className="rp-social-input" value={tempProfile.languages.join(', ')} onChange={(e) => setTempProfile({...tempProfile, languages: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="EN, ES, etc" />
                        ) : (
                            broker.languages.map((lang, i) => (
                                <span key={i} className="rp-lang-tag">{lang}</span>
                            ))
                        )}
                    </div>
                </div>

                {/* Stats & Bio */}
                <div className="rp-details">
                    {/* Stats */}
                    <div className="rp-stats-grid animate-fadeInUp delay-1">
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">{broker.sales}</span>
                            <span className="rp-stat-label">Ventas Personales</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">${(totalVolume / 1000000).toFixed(1)}M</span>
                            <span className="rp-stat-label">Volumen Brokerage</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">{activeListings}</span>
                            <span className="rp-stat-label">Listings Activos</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">{broker.experience}</span>
                            <span className="rp-stat-label">Experiencia</span>
                        </div>
                    </div>

                    {/* Social Media Editor */}
                    <div className="rp-social-card animate-fadeInUp delay-2">
                        <div className="rp-social-header">
                            <h3>Redes Sociales y Webs</h3>
                            {!editingSocial ? (
                                <button className="btn btn-ghost rp-social-edit-btn" onClick={handleEditSocial}>
                                    <Edit3 size={14} />
                                    Editar
                                </button>
                            ) : (
                                <div className="rp-social-actions">
                                    <button className="btn btn-ghost rp-social-cancel" onClick={handleCancelSocial}>
                                        <X size={14} />
                                        Cancelar
                                    </button>
                                    <button className="btn btn-primary rp-social-save" onClick={handleSaveSocial}>
                                        <Save size={14} />
                                        Guardar
                                    </button>
                                </div>
                            )}
                        </div>

                        {savedMsg && (
                            <div className="rp-saved-toast"> Redes sociales actualizadas</div>
                        )}

                        <div className="rp-social-list">
                            {SOCIAL_NETWORKS.map(net => {
                                const IconComp = net.icon
                                const value = editingSocial ? tempLinks[net.key] : socialLinks[net.key]
                                return (
                                    <div key={net.key} className={`rp-social-row ${value ? 'has-link' : ''}`}>
                                        <div className="rp-social-icon" style={{ '--social-color': net.color }}>
                                            <IconComp size={18} />
                                        </div>
                                        <div className="rp-social-field">
                                            <label>{net.label}</label>
                                            {editingSocial ? (
                                                <input
                                                    type="url"
                                                    className="rp-social-input"
                                                    placeholder={net.placeholder}
                                                    value={tempLinks[net.key]}
                                                    onChange={(e) => setTempLinks(prev => ({ ...prev, [net.key]: e.target.value }))}
                                                />
                                            ) : (
                                                <span className="rp-social-value">
                                                    {value || <em className="rp-social-empty">No configurado</em>}
                                                </span>
                                            )}
                                        </div>
                                        {!editingSocial && value && (
                                            <a href={value} target="_blank" rel="noreferrer" className="rp-social-visit">
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="rp-bio-card animate-fadeInUp delay-3">
                        <h3>Biografía Corporativa</h3>
                        {editingProfile ? (
                            <textarea className="rp-social-input" style={{width: '100%', minHeight: '100px', resize: 'vertical'}} value={tempProfile.bio} onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})} />
                        ) : (
                            <p>{broker.bio}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
