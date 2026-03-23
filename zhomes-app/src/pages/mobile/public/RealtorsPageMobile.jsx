import { Phone, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { REALTORS } from '../../../data/mockData'
import './RealtorsPageMobile.css'

export default function RealtorsPageMobile() {
    return (
        <div className="mobile-r-page">
            <div className="mr-bg-left"></div>
            
            <div className="mr-content-right">
                <header className="mr-hero">
                    <h1>REALTOR DIRECTORY</h1>
                    <p>Zhomes Exclusive Agents</p>
                </header>

                <div className="mr-list">
                    {REALTORS.map((a, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            key={a.id}
                            className="mr-card"
                        >
                            <img src={a.photo} alt={a.name} className="mr-card-img" />
                            <div className="mr-card-info">
                                <div className="mr-name-wrap">
                                    <h2>{a.name}</h2>
                                    <span className="mr-title">{a.title}</span>
                                </div>
                                
                                <div className="mr-contact-rows">
                                    <div className="mr-c-row"><span className="mr-c-label">M:</span> <span className="mr-c-val">{a.phone}</span></div>
                                </div>

                                <div className="mr-card-actions">
                                    <button className="mr-a-btn-round" onClick={() => window.location.href = `tel:${a.phone}`}>
                                        <Phone size={14} fill="white" />
                                    </button>
                                    <button className="mr-a-btn-round" onClick={() => window.location.href = `mailto:${a.email}`}>
                                        <MessageCircle size={14} fill="white" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ height: '110px' }} />
            </div>
        </div>
    )
}
