import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, DollarSign, MapPin, Home, Layout, ImageIcon, Save, Tag, User, ChevronLeft, X, Check } from 'lucide-react'
import { useProperties } from '../../context/PropertyContext'
import { supabase } from '../../lib/supabaseClient'
import './CreatePropertyPage.css'

const PROPERTY_TYPES = [
    'Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'
]

export default function CreatePropertyPage() {
    const navigate = useNavigate()
    const { addProperty, zhomesAgents } = useProperties()
    const fileInputRef = useRef(null)

    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)

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
        type: 'Single Family',
        category: 'Exclusiva ZHomes',
        agentName: '',
        arv: '',
        repairCost: '',
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

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 20 * 1024 * 1024) {
            alert('La imagen no puede superar los 20MB')
            return
        }
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!imageFile) {
            alert('Por favor selecciona una imagen para la propiedad')
            return
        }

        setLoading(true)
        setUploadProgress(10)

        try {
            // 1. Upload Image to Supabase
            const ext = imageFile.name.split('.').pop()
            const fileName = `${Date.now()}_${formData.address.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
            
            setUploadProgress(30)
            const { data: storageData, error: storageError } = await supabase.storage
                .from('property-images')
                .upload(fileName, imageFile, {
                    contentType: imageFile.type,
                    cacheControl: '3600'
                })
            
            // Si el bucket property-images no existe o hay error, la imagen falla pero no bloqueamos todo.
            let imageUrl = ''
            if (storageError) {
                console.warn("Could not upload to property-images bucket. Retrying in vibe-videos fallback...", storageError)
                const fallback = await supabase.storage.from('vibe-videos').upload(`img_${fileName}`, imageFile, { contentType: imageFile.type })
                if (!fallback.error) {
                    const urlData = supabase.storage.from('vibe-videos').getPublicUrl(`img_${fileName}`)
                    imageUrl = urlData.data.publicUrl
                } else {
                    throw new Error("No se pudo subir la imagen. Verifica los permisos de Storage.")
                }
            } else {
                const urlData = supabase.storage.from('property-images').getPublicUrl(fileName)
                imageUrl = urlData.data.publicUrl
            }

            setUploadProgress(70)

            // 2. Save Property
            const result = await addProperty({
                ...formData,
                price: Number(formData.price),
                beds: Number(formData.beds),
                baths: Number(formData.baths),
                sqft: Number(formData.sqft),
                arv: formData.arv ? Number(formData.arv) : null,
                repairCost: formData.repairCost ? Number(formData.repairCost) : null,
                image: imageUrl,
                description: `[${formData.category}] ${formData.description}`.trim(),
            })

            if (result) {
                setUploadProgress(100)
                setSuccess(true)
            }
        } catch (err) {
            console.error('Error saving property:', err)
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="create-property-page animate-fadeIn">
                <div className="create-success">
                    <div className="success-icon-large"><Check size={48} /></div>
                    <h2>¡Propiedad Publicada!</h2>
                    <p>La exclusiva está ahora en la plataforma</p>
                    <button className="submit-btn" style={{ width: '100%', maxWidth: '300px' }} onClick={() => navigate('/propiedades')}>
                        Ver Propiedades
                    </button>
                    <button className="submit-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: 12, width: '100%', maxWidth: '300px' }} onClick={() => {
                        setSuccess(false)
                        setImageFile(null)
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, address: '', price: '', sqft: '', description: '' }))
                    }}>
                        Subir Otra
                    </button>
                </div>
            </div>
        )
    }

    const isFixFlip = formData.category === 'Fix & Flip'

    return (
        <div className="create-property-page animate-fadeIn mobile-page">
            <div className="create-header">
                <button type="button" className="create-back" onClick={() => {
                    if (window.history.length > 2) {
                        navigate(-1)
                    } else {
                        navigate('/realtor')
                    }
                }}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Nueva Propiedad</h1>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="create-body">
                <div className="category-switch">
                    <button type="button" className={`cat-btn ${!isFixFlip ? 'active' : ''}`} onClick={() => setFormData(p => ({...p, category: 'Exclusiva ZHomes'}))}>
                        Exclusiva ZHomes
                    </button>
                    <button type="button" className={`cat-btn ${isFixFlip ? 'active' : ''}`} onClick={() => setFormData(p => ({...p, category: 'Fix & Flip'}))}>
                        Fix & Flip
                    </button>
                </div>

                <div 
                    className={`upload-image-zone ${imagePreview ? 'has-image' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} className="upload-preview" alt="Propiedad" />
                            <button className="upload-remove" onClick={(e) => {
                                e.stopPropagation();
                                setImageFile(null);
                                setImagePreview(null);
                            }}>
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <div className="upload-placeholder">
                            <ImageIcon size={40} />
                            <span>Toca para subir foto principal</span>
                            <small>JPG, PNG · Max 20MB</small>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                />

                <form onSubmit={handleSubmit} className="create-form">
                    <div className="form-section-title"><MapPin size={18} color="var(--zhomes-red)" /> Ubicación</div>
                    <div className="form-group">
                        <label>Dirección *</label>
                        <input type="text" name="address" required placeholder="Ej: 123 Main St" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input type="text" name="city" required value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>ZIP</label>
                            <input type="text" name="zip" required placeholder="402..." value={formData.zip} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-section-title" style={{ marginTop: 12 }}><Layout size={18} color="var(--zhomes-red)" /> Detalles del Inmueble</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{isFixFlip ? 'Precio Compra $' : 'Precio $'}</label>
                            <input type="number" name="price" required placeholder="0" value={formData.price} onChange={handleChange} />
                        </div>
                    </div>

                    {isFixFlip && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>ARV $</label>
                                <input type="number" name="arv" placeholder="280000" value={formData.arv} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Reparación $</label>
                                <input type="number" name="repairCost" placeholder="45000" value={formData.repairCost} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Hab. (Beds)</label>
                            <input type="number" name="beds" required placeholder="3" value={formData.beds} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Baños (Baths)</label>
                            <input type="number" name="baths" step="0.5" required placeholder="2.5" value={formData.baths} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Sqft</label>
                            <input type="number" name="sqft" required placeholder="2000" value={formData.sqft} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción y Notas Extras</label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder={isFixFlip ? "Describe el estado actual y potencial..." : "Atractivos principales..."}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Agente Responsable</label>
                        <select name="agentName" value={formData.agentName} onChange={handleChange}>
                            <option value="">ZHomes (Oficina)</option>
                            {zhomesAgents?.map((agent, i) => (
                                <option key={i} value={agent.name}>{agent.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading || !imageFile}>
                        {loading ? `Subiendo... ${uploadProgress}%` : <><Save size={18} /> Publicar Inmueble</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
