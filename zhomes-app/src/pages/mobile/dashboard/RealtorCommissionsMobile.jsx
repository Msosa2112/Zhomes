import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RealtorCommissionsMobile() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <ShieldCheck size={28} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 10 }}>Sección actualizada</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: 24 }}>
                    Conforme al NAR Settlement 2024, la compensación se acuerda por escrito con cada comprador. Consulta tu pipeline para el seguimiento de operaciones.
                </p>
                <Link
                    to="/realtor/transacciones"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--zhomes-red)', color: '#fff', padding: '12px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                >
                    Ver Transacciones <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    )
}
