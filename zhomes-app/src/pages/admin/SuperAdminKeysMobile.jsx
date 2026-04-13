import { useState, useEffect } from 'react'
import { Key, Save, Eye, EyeOff, ShieldAlert, CheckCircle2, ChevronLeft, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './SuperAdminKeysMobile.css'

export default function SuperAdminKeysMobile() {
    const navigate = useNavigate()
    
    const [keys, setKeys] = useState({
        openai: '',
        supabase_url: '',
        supabase_key: '',
        twilio: '',
        resend: '',
        docusign: ''
    })
    
    const [showKeys, setShowKeys] = useState({})
    const [saved, setSaved] = useState(false)
    const [testing, setTesting] = useState(false)

    useEffect(() => {
        // Cargar llaves guardadas
        const savedKeys = localStorage.getItem('zhomes_api_keys')
        if (savedKeys) {
            setKeys(JSON.parse(savedKeys))
        }
    }, [])

    const handleSave = () => {
        setSaved(true)
        localStorage.setItem('zhomes_api_keys', JSON.stringify(keys))
        setTimeout(() => setSaved(false), 2000)
    }

    const handleTest = () => {
        setTesting(true)
        setTimeout(() => {
            setTesting(false)
            alert(" APIs simulando conexión con éxito.")
        }, 1500)
    }

    const toggleShow = (field) => {
        setShowKeys(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const renderInput = (id, label, icon) => (
        <div className="admin-input-group">
            <label>{icon} {label}</label>
            <div className="admin-input-wrapper">
                <input 
                    type={showKeys[id] ? "text" : "password"} 
                    value={keys[id]} 
                    onChange={e => setKeys(prev => ({...prev, [id]: e.target.value}))}
                    placeholder="Pegar API Key aquí..."
                />
                <button className="toggle-eye" onClick={() => toggleShow(id)}>
                    {showKeys[id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    )

    return (
        <div className="super-admin-page animate-fadeInUp">
            <div className="admin-header">
                <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <ShieldAlert size={20} color="#EF4444" />
                    <h2>Super Admin</h2>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-warning">
                    <strong>Zona de Peligro</strong>
                    <p>Estas credenciales controlan los accesos a los servicios de producción. Guardarlas aquí las asegura localmente para inyectarlas en las peticiones de desarrollo.</p>
                </div>

                <div className="admin-section">
                    <h3>Inteligencia Artificial</h3>
                    {renderInput('openai', 'OpenAI API Key', <Key size={14} />)}
                </div>

                <div className="admin-section">
                    <h3>Base de Datos (Supabase)</h3>
                    {renderInput('supabase_url', 'Project URL', <Key size={14} />)}
                    {renderInput('supabase_key', 'Anon Key', <Key size={14} />)}
                </div>

                <div className="admin-section">
                    <h3>Comunicaciones</h3>
                    {renderInput('twilio', 'Twilio Auth Token', <Key size={14} />)}
                    {renderInput('resend', 'Resend API Key', <Key size={14} />)}
                </div>

                <div className="admin-section">
                    <h3>Firmas (E-Signatures)</h3>
                    {renderInput('docusign', 'Dropbox Sign / DocuSign', <Key size={14} />)}
                </div>

                <div className="admin-actions">
                    <button className="btn-test" onClick={handleTest} disabled={testing}>
                        {testing ? <Activity className="spin" size={20} /> : <Activity size={20} />}
                        Probar Conexión
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                        {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                        {saved ? 'Guardado' : 'Guardar Llaves'}
                    </button>
                </div>
            </div>
        </div>
    )
}
