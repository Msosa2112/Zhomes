import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, DollarSign, MapPin, Home, Layout, ImageIcon, Save, Tag, User } from 'lucide-react'
import { useProperties } from '../../context/PropertyContext'
import { supabase } from '../../lib/supabaseClient'
import './CreatePropertyPage.css'

const PROPERTY_CATEGORIES = [
    { value: 'Fix & Flip', label: '🔨 Fix & Flip', desc: 'Para inversionistas, necesita remodelación' },
    { value: 'Exclusiva ZHomes', label: '⭐ Exclusiva ZHomes', desc: 'Pocket listing exclusivo de ZHomes' },
    { value: 'Exclusiva ZHomes', label: '⭐ Exclusiva ZHomes', desc: 'Pocket listing exclusivo de ZHomes' },
]

const PROPERTY_TYPES = [
    'Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'
]

export default function CreatePropertyPage() {
    const navigate = useNavigate()
    const { addProperty } = useProperties()
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user || null)
        })
    }, [])
    const [formData, setFormData] = useState({
        address: '',
        city: 'Louisville',
        state: 'KY',
        zip: '',
        price: '',
        beds: '',
        baths: '',
        sqft: '',
        description: '',
        image: '',
        type: 'Single Family',
        category: 'Exclusiva ZHomes',
        agentName: '',
        arv: '',          // After Repair Value (para Fix & Flip)
        repairCost: '',   // Estimated repair cost
    })

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                agentName: currentUser.user_metadata?.full_name || currentUser.email || ''
            }))
        }
    }, [currentUser])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await addProperty({
                ...formData,
                price: Number(formData.price),
                beds: Number(formData.beds),
                baths: Number(formData.baths),
                sqft: Number(formData.sqft),
                arv: formData.arv ? Number(formData.arv) : null,
                repairCost: formData.repairCost ? Number(formData.repairCost) : null,
                // Notes include category for easy identification
                description: `[${formData.category}] ${formData.description}`.trim(),
            })

            if (result) {
                setSuccess(true)
                setTimeout(() => navigate('/propiedades'), 1500)
            }
        } catch (err) {
            console.error('Error saving property:', err)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="create-property-page animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                    <h2>¡Propiedad publicada!</h2>
                    <p style={{ opacity: 0.7 }}>Redirigiendo...</p>
                </div>
            </div>
        )
    }

    const isFixFlip = formData.category === 'Fix & Flip'

    return (
        <div className="create-property-page animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1>Nueva Propiedad Exclusiva</h1>
                    <p>Publica un listing exclusivo que no está en el MLS</p>
                </div>
            </div>

            <div className="create-form-container glass">
                <form onSubmit={handleSubmit} className="create-form">

                    {/* Section: Categoría */}
                    <div className="form-section">
                        <h3><Tag size={18} /> Tipo de Listing</h3>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {PROPERTY_CATEGORIES.map(cat => (
                                <label
                                    key={cat.value}
                                    style={{
                                        flex: '1 1 200px',
                                        border: formData.category === cat.value
                                            ? '2px solid #FFD700'
                                            : '2px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: formData.category === cat.value
                                            ? 'rgba(255,215,0,0.08)'
                                            : 'transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value={cat.value}
                                        checked={formData.category === cat.value}
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{cat.label}</div>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>{cat.desc}</div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Section: Agente */}
                    <div className="form-section">
                        <h3><User size={18} /> Agente Responsable</h3>
                        <div className="form-group">
                            <label>Nombre del Agente</label>
                            <div className="input-icon">
                                <User size={16} />
                                <input
                                    type="text"
                                    name="agentName"
                                    placeholder="Nombre completo del agente"
                                    value={formData.agentName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Dirección */}
                    <div className="form-section">
                        <h3><Home size={18} /> Información Básica</h3>
                        <div className="form-grid">
                            <div className="form-group span-2">
                                <label>Dirección</label>
                                <div className="input-icon">
                                    <MapPin size={16} />
                                    <input type="text" name="address" required placeholder="Ej: 123 Main St" value={formData.address} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input type="text" name="city" required value={formData.city} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Código Postal</label>
                                <input type="text" name="zip" required placeholder="402..." value={formData.zip} onChange={handleChange} />
                            </div>
                            <div className="form-group span-2">
                                <label>Tipo de Propiedad</label>
                                <select name="type" value={formData.type} onChange={handleChange}>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Specs y Precio */}
                    <div className="form-section">
                        <h3><Layout size={18} /> Detalles y Precio</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{isFixFlip ? 'Precio de Compra ($)' : 'Precio ($)'}</label>
                                <div className="input-icon">
                                    <DollarSign size={16} />
                                    <input type="number" name="price" required placeholder="0" value={formData.price} onChange={handleChange} />
                                </div>
                            </div>
                            {isFixFlip && (
                                <>
                                    <div className="form-group">
                                        <label>ARV - Valor después de remodelación ($)</label>
                                        <div className="input-icon">
                                            <DollarSign size={16} />
                                            <input type="number" name="arv" placeholder="Ej: 280000" value={formData.arv} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Costo estimado de reparaciones ($)</label>
                                        <div className="input-icon">
                                            <DollarSign size={16} />
                                            <input type="number" name="repairCost" placeholder="Ej: 45000" value={formData.repairCost} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="form-group">
                                <label>Habitaciones</label>
                                <input type="number" name="beds" required placeholder="3" value={formData.beds} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Baños</label>
                                <input type="number" name="baths" step="0.5" required placeholder="2.5" value={formData.baths} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Sqft</label>
                                <input type="number" name="sqft" required placeholder="2000" value={formData.sqft} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Media */}
                    <div className="form-section">
                        <h3><ImageIcon size={18} /> Multimedia</h3>
                        <div className="form-group">
                            <label>URL de Imagen Principal</label>
                            <div className="input-icon">
                                <Upload size={16} />
                                <input type="url" name="image" required placeholder="https://..." value={formData.image} onChange={handleChange} />
                            </div>
                            <p className="hint">Usa una URL directa de imagen (Google Drive, Dropbox, Unsplash, etc.)</p>
                        </div>

                        {formData.image && (
                            <div className="image-preview">
                                <img src={formData.image} alt="Preview" />
                            </div>
                        )}

                        <div className="form-group mt-4">
                            <label>Descripción</label>
                            <textarea
                                name="description"
                                rows="4"
                                placeholder={isFixFlip
                                    ? "Describe la propiedad, estado actual, potencial de inversión..."
                                    : "Describe la propiedad para los compradores..."}
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : <><Save size={18} /> Publicar Exclusiva</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
