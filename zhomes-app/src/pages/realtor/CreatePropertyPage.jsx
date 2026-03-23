import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, DollarSign, MapPin, Home, Layout, Type, Image as ImageIcon, Save } from 'lucide-react'
import { useProperties } from '../../context/PropertyContext'
import './CreatePropertyPage.css'

export default function CreatePropertyPage() {
    const navigate = useNavigate()
    const { addProperty } = useProperties()
    const [loading, setLoading] = useState(false)

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
        status: 'For Sale',
        type: 'Single Family'
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Simular network delay
        await new Promise(resolve => setTimeout(resolve, 800))

        const newProp = {
            ...formData,
            price: Number(formData.price),
            beds: Number(formData.beds),
            baths: Number(formData.baths),
            sqft: Number(formData.sqft),
            lat: 38.2527 + (Math.random() * 0.1 - 0.05), // Random lat near Louisville for MVP map
            lng: -85.7585 + (Math.random() * 0.1 - 0.05) // Random lng near Louisville
        }

        addProperty(newProp)
        setLoading(false)
        navigate('/propiedades') // Redirect to public properties to see specific listing
    }

    return (
        <div className="create-property-page animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1>Nueva Propiedad</h1>
                    <p>Sube un nuevo listing al sistema ZHOMES</p>
                </div>
            </div>

            <div className="create-form-container glass">
                <form onSubmit={handleSubmit} className="create-form">

                    {/* Section: Basic Info */}
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
                        </div>
                    </div>

                    {/* Section: Specs */}
                    <div className="form-section">
                        <h3><Layout size={18} /> Detalles y Precio</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Precio ($)</label>
                                <div className="input-icon">
                                    <DollarSign size={16} />
                                    <input type="number" name="price" required placeholder="0.00" value={formData.price} onChange={handleChange} />
                                </div>
                            </div>
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

                    {/* Section: Media & Desc */}
                    <div className="form-section">
                        <h3><ImageIcon size={18} /> Multimedia</h3>
                        <div className="form-group">
                            <label>URL de Imagen Principal</label>
                            <div className="input-icon">
                                <Upload size={16} />
                                <input type="url" name="image" required placeholder="https://..." value={formData.image} onChange={handleChange} />
                            </div>
                            <p className="hint">Para MVP, usa una URL directa de imagen (Unsplash, etc)</p>
                        </div>

                        {formData.image && (
                            <div className="image-preview">
                                <img src={formData.image} alt="Preview" />
                            </div>
                        )}

                        <div className="form-group mt-4">
                            <label>Descripción</label>
                            <textarea name="description" rows="4" placeholder="Describe la propiedad..." value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : <><Save size={18} /> Publicar Propiedad</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
