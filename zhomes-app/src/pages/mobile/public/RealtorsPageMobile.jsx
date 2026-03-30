import { useState, useEffect } from 'react'
import { Phone, MessageCircle, X, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../../../lib/supabaseClient'
import './RealtorsPageMobile.css'

export default function RealtorsPageMobile() {
    const [selectedAgent, setSelectedAgent] = useState(null)
    const [realtors, setRealtors] = useState([])
    const [loading, setLoading] = useState(true)
    const closeModal = () => setSelectedAgent(null)

    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('zhomes_agents')
                .select('id, full_name, first_name, last_name, email, phone, bio, status, photo_url')
                .eq('status', 'Active')
                .order('full_name')
            if (error) console.warn('[RealtorsPage] Error:', error.message)
            if (!error && data) {
                // Map DB fields to what the template expects
                setRealtors(data.map(a => ({
                    ...a,
                    name: a.full_name,
                    photo: a.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.full_name)}&background=E31E24&color=fff&size=400&bold=true`,
                    title: 'ZHomes Real Estate Agent',
                })))
            }
            setLoading(false)
        }
        fetchAgents()
    }, [])

    return (
        <div className="mobile-r-page">
            <div className="mr-bg-left"></div>
            
            <div className="mr-content-right">
                <header className="mr-hero">
                    <h1>REALTOR DIRECTORY</h1>
                    <p>Zhomes Exclusive Agents</p>
                </header>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        Cargando agentes...
                    </div>
                ) : (
                    <div className="mr-list">
                        {realtors.map((a, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                key={a.id}
                                className="mr-card"
                                onClick={() => setSelectedAgent(a)}
                                style={{ cursor: 'pointer' }}
                            >
                                <motion.img 
                                    src={a.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=E31E24&color=fff`}
                                    alt={a.name} 
                                    className="mr-card-img" 
                                    initial={{ filter: 'grayscale(100%) contrast(1.1)' }}
                                    whileInView={{ filter: 'grayscale(0%) contrast(1.1)' }}
                                    viewport={{ margin: '-35% 0px -35% 0px' }}
                                    transition={{ duration: 0.4 }}
                                />
                                <div className="mr-card-info">
                                    <div className="mr-name-wrap">
                                        <h2>{a.name}</h2>
                                        <span className="mr-title">{a.title}</span>
                                    </div>
                                    
                                    <div className="mr-contact-rows">
                                        <div className="mr-c-row"><span className="mr-c-label">M:</span> <span className="mr-c-val">{a.phone}</span></div>
                                    </div>

                                    <div className="mr-card-actions">
                                        <button className="mr-a-btn-round" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${a.phone}`; }}>
                                            <Phone size={14} className="mr-action-svg" />
                                        </button>
                                        <button className="mr-a-btn-round" onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${a.email}`; }}>
                                            <MessageCircle size={14} className="mr-action-svg" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div style={{ height: '110px' }} />
            </div>

            <AnimatePresence>
                {selectedAgent && (
                    <motion.div 
                        className="mr-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div 
                            className="mr-modal-card"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="mr-modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>

                            <img 
                                src={selectedAgent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAgent.name)}&background=E31E24&color=fff`}
                                alt={selectedAgent.name} 
                                className="mr-modal-avatar" 
                            />
                            
                            <h2 className="mr-modal-name">{selectedAgent.name}</h2>
                            <span className="mr-modal-title">{selectedAgent.title || 'ZHomes Real Estate Agent'}</span>
                            
                            <p className="mr-modal-bio">
                                {selectedAgent.bio || `Contacta a ${selectedAgent.name} para explorar opciones exclusivas con ZHomes Real Estate.`}
                            </p>

                            <div className="mr-modal-actions">
                                {selectedAgent.phone && (
                                    <button className="mr-modal-btn" onClick={() => window.location.href = `tel:${selectedAgent.phone}`}>
                                        <Phone size={16} className="mr-modal-svg" />
                                        Llamar
                                    </button>
                                )}
                                {selectedAgent.email && (
                                    <button className="mr-modal-btn" onClick={() => window.location.href = `mailto:${selectedAgent.email}`}>
                                        <Mail size={16} className="mr-modal-svg" />
                                        Email
                                    </button>
                                )}
                            </div>

                            <div className="mr-modal-social">
                                <a className="mr-social-icon" href={`https://instagram.com/zhomes_re`} target="_blank" rel="noreferrer" title="Instagram">
                                    <IconInstagram />
                                </a>
                                <a className="mr-social-icon" href={`https://facebook.com/zhomes`} target="_blank" rel="noreferrer" title="Facebook">
                                    <IconFacebook />
                                </a>
                                <a className="mr-social-icon" href={`https://tiktok.com/@zhomes`} target="_blank" rel="noreferrer" title="TikTok">
                                    <IconTiktok />
                                </a>
                                {selectedAgent.phone && (
                                    <a className="mr-social-icon" href={`https://wa.me/${selectedAgent.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp">
                                        <IconWhatsapp />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function IconInstagram() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
    )
}

function IconFacebook() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.326V1.326C24 .593 23.407 0 22.675 0z"/>
        </svg>
    )
}

function IconTiktok() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.07-1.14.07-2.3.43-3.38.74-2.22 2.6-4.01 4.9-4.52 1.05-.23 2.14-.26 3.2-.14v4.06c-1.09-.32-2.31-.04-3.16.71-.85.73-1.25 1.89-1.04 3.01.21 1.09 1.01 2.01 2.05 2.37 1.18.39 2.53.07 3.42-.76.74-.68 1.18-1.62 1.25-2.6.1-2.92.04-5.84.05-8.76V.02Z"/>
        </svg>
    )
}

function IconWhatsapp() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M12.01 2a9.91 9.91 0 019.9 9.92 9.93 9.93 0 01-14.88 8.57L2 22l1.62-4.99A9.92 9.92 0 0112.01 2m0 1.83a8.1 8.1 0 00-6.95 12.3l-1.05 3.25 3.32-1.05a8.1 8.1 0 104.68-14.5m4.23 11.23c-.23-.12-1.35-.67-1.56-.75-.2-.08-.34-.12-.49.1-.15.22-.6.75-.73.9-.13.15-.26.17-.49.05a6.56 6.56 0 01-3.69-2.28c-.28-.48.24-.46.88-1.74a.45.45 0 00-.02-.43c-.08-.15-.49-1.18-.67-1.61-.17-.43-.34-.37-.47-.38h-.4a.77.77 0 00-.56.26c-.19.2-1.2 0-1.74-.86-.53-.88-.41-1.4-.04-1.92.21-.29.47-.56.71-.85.11-.13.22-.27.28-.43.08-.2.03-.43-.09-.61-.31-.46-1.53-3.71-1.7-4.13-.15-.36-.33-.35-.5-.35z"/>
        </svg>
    )
}
