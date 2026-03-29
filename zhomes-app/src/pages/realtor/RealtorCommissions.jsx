import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RealtorCommissions() {
    return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <ShieldCheck size={32} color="#10B981" />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 12 }}>Sección actualizada</h1>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
                    De acuerdo con las nuevas regulaciones de la industria (NAR Settlement 2024), la información de compensaciones se gestiona mediante acuerdos escritos directamente con los compradores. Consulta tu pipeline de transacciones para el seguimiento de tus operaciones.
                </p>
                <Link to="/realtor/transacciones" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Ver Pipeline de Transacciones <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    )
}
