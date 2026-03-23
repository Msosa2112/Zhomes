import { Phone, Mail, Globe } from 'lucide-react'
import { motion } from 'motion/react'
import { REALTORS } from '../../../data/mockData'
import './RealtorsPageMobile.css'

export default function RealtorsPageMobile() {
    return (
        <div className="mobile-r-page">
            <header className="mr-hero">
                <h1>Nuestros Realtors</h1>
                <p>Expertos locales comprometidos con tus objetivos inmobiliarios.</p>
            </header>

            <div className="mr-list">
                {REALTORS.map((a, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        key={a.id}
                        className="mr-card"
                    >
                        <img src={a.photo} alt={a.name} className="mr-card-img" />
                        <div className="mr-card-info">
                            <h2>{a.name}</h2>
                            <span className="mr-title">{a.title}</span>
                            <div className="mr-data-row">
                                <span className="mr-exp">Exp: {a.experience}</span>
                                {a.languages && a.languages.length > 0 && (
                                    <span className="mr-lang"><Globe size={12} /> {a.languages.join(' / ')}</span>
                                )}
                            </div>
                            <p className="mr-bio">{a.bio.substring(0, 110)}...</p>
                        </div>
                        <div className="mr-card-actions">
                            <button className="mr-a-btn"><Phone size={18} /> Llamar</button>
                            <button className="mr-a-btn oline" onClick={() => window.location.href = `mailto:${a.email}`}><Mail size={18} /> Email</button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ height: '90px' }} />
        </div>
    )
}
