import { useState } from 'react'
import { Star, MapPin, Phone, Mail, Award, Globe, Instagram, Facebook, Linkedin, Youtube, Edit3, Save, X, ExternalLink } from 'lucide-react'
import { REALTORS, REALTOR_TRANSACTIONS, REALTOR_COMMISSIONS } from '../../data/mockData'
import './RealtorProfile.css'

// TikTok icon (not in lucide)
const TikTokIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
)

const SOCIAL_NETWORKS = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/tu_usuario', color: '#E4405F' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/tu_pagina', color: '#1877F2' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/tu_perfil', color: '#0A66C2' },
    { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@tu_usuario', color: '#000000' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@tu_canal', color: '#FF0000' },
    { key: 'website', label: 'Sitio Web', icon: Globe, placeholder: 'https://tu-sitio-web.com', color: '#6366F1' },
]

export default function RealtorProfile() {
    const [realtor, setRealtor] = useState(REALTORS[0])
    const [editingProfile, setEditingProfile] = useState(false)
    const [tempProfile, setTempProfile] = useState(REALTORS[0])
    const totalSales = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').length
    const totalVolume = REALTOR_COMMISSIONS.filter(c => c.status === 'paid').reduce((s, c) => s + c.salePrice, 0)
    const activeListings = REALTOR_TRANSACTIONS.filter(t => t.status !== 'closed').length

    // Social links state
    const [socialLinks, setSocialLinks] = useState({
        instagram: realtor.social?.instagram || '',
        facebook: realtor.social?.facebook || '',
        linkedin: realtor.social?.linkedin || '',
        tiktok: realtor.social?.tiktok || '',
        youtube: realtor.social?.youtube || '',
        website: realtor.social?.website || '',
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

    const filledCount = Object.values(socialLinks).filter(v => v.trim()).length

    return (
        <div className="rp-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Mi Perfil</h1>
                    <p className="page-subtitle">Tu información profesional</p>
                </div>
                {!editingProfile ? (
                    <button className="btn btn-ghost" onClick={() => {setTempProfile({...realtor}); setEditingProfile(true);}}>
                        <Edit3 size={16} style={{marginRight: '6px'}}/> Editar
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost" style={{padding: '8px 12px'}} onClick={() => setEditingProfile(false)}>Canc.</button>
                        <button className="btn btn-primary" style={{padding: '8px 12px'}} onClick={() => {setRealtor({...tempProfile}); setEditingProfile(false);}}>Gdr</button>
                    </div>
                )}
            </div>

            <div className="rp-grid">
                {/* Profile card */}
                <div className="rp-profile-card animate-fadeInUp">
                    <div className="rp-avatar-wrap">
                        <img src={realtor.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(realtor.name) + '&background=e41f25&color=fff'} alt={realtor.name} className="rp-avatar" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(realtor.name) + '&background=e41f25&color=fff' }} />
                        {realtor.topProducer && (
                            <span className="rp-top-badge">
                                <Award size={12} />
                                TOP PRODUCER
                            </span>
                        )}
                    </div>
                    {editingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '16px' }}>
                            <input type="text" className="rp-social-input" value={tempProfile.name} onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})} placeholder="Nombre completo" />
                            <input type="text" className="rp-social-input" value={tempProfile.title} onChange={(e) => setTempProfile({...tempProfile, title: e.target.value})} placeholder="Título profesional" />
                            <input type="text" className="rp-social-input" value={tempProfile.specialty} onChange={(e) => setTempProfile({...tempProfile, specialty: e.target.value})} placeholder="Especialidad" />
                        </div>
                    ) : (
                        <>
                            <h2 className="rp-name">{realtor.name}</h2>
                            <span className="rp-title">{realtor.title}</span>
                            <span className="rp-specialty">{realtor.specialty}</span>
                        </>
                    )}

                    <div className="rp-rating">
                        <Star size={16} fill="#F5A623" color="#F5A623" />
                        <span>{realtor.rating}</span>
                        <span className="rp-rating-label">· {realtor.sales} ventas</span>
                    </div>

                    <div className="rp-contact-info">
                        <div className="rp-contact-item">
                            <Phone size={16} style={{ flexShrink: 0 }} />
                            {editingProfile ? (
                                <input type="text" className="rp-social-input" value={tempProfile.phone} onChange={(e) => setTempProfile({...tempProfile, phone: e.target.value})} />
                            ) : <span>{realtor.phone}</span>}
                        </div>
                        <div className="rp-contact-item">
                            <Mail size={16} style={{ flexShrink: 0 }} />
                            {editingProfile ? (
                                <input type="email" className="rp-social-input" value={tempProfile.email} onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})} />
                            ) : <span>{realtor.email}</span>}
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
                            realtor.languages.map((lang, i) => (
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
                            <span className="rp-stat-value">{realtor.sales}</span>
                            <span className="rp-stat-label">Ventas Totales</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">${(totalVolume / 1000000).toFixed(1)}M</span>
                            <span className="rp-stat-label">Volumen Vendido</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">{activeListings}</span>
                            <span className="rp-stat-label">Listings Activos</span>
                        </div>
                        <div className="rp-stat-card">
                            <span className="rp-stat-value">{realtor.experience}</span>
                            <span className="rp-stat-label">Experiencia</span>
                        </div>
                    </div>

                    {/* Social Media Editor */}
                    <div className="rp-social-card animate-fadeInUp delay-2">
                        <div className="rp-social-header">
                            <h3>Redes Sociales</h3>
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
                            <div className="rp-saved-toast">✓ Redes sociales actualizadas</div>
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
                        <h3>Biografía</h3>
                        {editingProfile ? (
                            <textarea className="rp-social-input" style={{width: '100%', minHeight: '100px', resize: 'vertical'}} value={tempProfile.bio} onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})} />
                        ) : (
                            <p>{realtor.bio}</p>
                        )}
                    </div>

                    {/* Recent activity */}
                    <div className="rp-activity-card animate-fadeInUp delay-4">
                        <h3>Actividad Reciente</h3>
                        <div className="rp-activity-list">
                            <div className="rp-activity-item">
                                <div className="rp-act-dot" style={{ background: '#10B981' }}></div>
                                <span>Cerró venta de 3744 Springhurst Blvd por $345,000</span>
                                <span className="rp-act-time">Hace 2 semanas</span>
                            </div>
                            <div className="rp-activity-item">
                                <div className="rp-act-dot" style={{ background: '#3B82F6' }}></div>
                                <span>Subió documentos para 220 River Rd</span>
                                <span className="rp-act-time">Hace 3 días</span>
                            </div>
                            <div className="rp-activity-item">
                                <div className="rp-act-dot" style={{ background: '#8B5CF6' }}></div>
                                <span>Nuevo listing: 7821 Norbourne Ave — $489,000</span>
                                <span className="rp-act-time">Hace 1 semana</span>
                            </div>
                            <div className="rp-activity-item">
                                <div className="rp-act-dot" style={{ background: '#F59E0B' }}></div>
                                <span>Inspección programada para 1850 Lakewood Hills</span>
                                <span className="rp-act-time">Hace 5 días</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
