import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { ChevronLeft, Upload, Video, X, Check, User } from 'lucide-react';
import { useProperties } from '../../../context/PropertyContext';
import './UploadVibeMobile.css';

export default function UploadVibeMobile() {
    const navigate = useNavigate();
    const { zhomesAgents, properties } = useProperties();
    const fileInputRef = useRef(null);

    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        property_address: '',
        city: 'Louisville',
        zip: '',
        price: '',
        beds: '',
        baths: '',
        sqft: '',
        description: '',
        realtor_name: '',
    });

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            alert('El video no puede superar 100MB');
            return;
        }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleUpload = async () => {
        if (!videoFile || !form.property_address) {
            alert('Selecciona un video y agrega la dirección');
            return;
        }

        setUploading(true);
        setUploadProgress(10);

        try {
            // 1. Upload video to Supabase Storage
            const ext = videoFile.name.split('.').pop();
            const fileName = `${Date.now()}_${form.property_address.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
            
            setUploadProgress(30);

            const { data: storageData, error: storageError } = await supabase.storage
                .from('vibe-videos')
                .upload(fileName, videoFile, {
                    contentType: videoFile.type,
                    cacheControl: '3600',
                });

            if (storageError) throw storageError;
            setUploadProgress(70);

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('vibe-videos')
                .getPublicUrl(fileName);

            const videoUrl = urlData.publicUrl;

            // 3. Insert into vibe_videos table
            const { error: dbError } = await supabase
                .from('vibe_videos')
                .insert({
                    property_address: form.property_address,
                    city: form.city,
                    zip: form.zip,
                    price: form.price ? parseInt(form.price) : null,
                    beds: form.beds ? parseInt(form.beds) : null,
                    baths: form.baths || null,
                    sqft: form.sqft ? parseInt(form.sqft) : null,
                    description: form.description,
                    video_url: videoUrl,
                    realtor_name: form.realtor_name || 'ZHomes Real Estate',
                    is_zhomes: true,
                    status: 'active',
                });

            if (dbError) throw dbError;
            setUploadProgress(100);
            setSuccess(true);

        } catch (err) {
            console.error('Upload error:', err);
            alert('Error al subir: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div className="upload-vibe-page">
                <div className="upload-success">
                    <div className="success-icon"><Check size={48} /></div>
                    <h2>¡Video Subido!</h2>
                    <p>Ya aparece en el Vibe Feed</p>
                    <button className="upload-btn primary" onClick={() => navigate('/vibe')}>
                        Ver en Vibe
                    </button>
                    <button className="upload-btn secondary" onClick={() => {
                        setSuccess(false);
                        setVideoFile(null);
                        setVideoPreview(null);
                        setForm({ property_address: '', city: 'Louisville', zip: '', price: '', beds: '', baths: '', sqft: '', description: '', realtor_name: '' });
                    }}>
                        Subir Otro
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-vibe-page">
            {/* Header */}
            <div className="upload-header">
                <button className="upload-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Subir Vibe Video</h1>
                <div style={{ width: 24 }} />
            </div>

            <div className="upload-body">
                {/* Video Picker */}
                <div 
                    className={`upload-video-zone ${videoPreview ? 'has-video' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {videoPreview ? (
                        <>
                            <video src={videoPreview} className="upload-preview" muted playsInline autoPlay loop />
                            <button className="upload-remove" onClick={(e) => {
                                e.stopPropagation();
                                setVideoFile(null);
                                setVideoPreview(null);
                            }}>
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <div className="upload-placeholder">
                            <Video size={40} />
                            <span>Toca para seleccionar video</span>
                            <small>MP4, MOV · Max 100MB</small>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    style={{ display: 'none' }}
                />

                {/* Property Details Form */}
                <div className="upload-form">
                    <div className="form-group">
                        <label>Vincular a Propiedad Existente</label>
                        <select
                            onChange={(e) => {
                                const propId = e.target.value;
                                if (!propId) return;
                                const p = properties?.find(x => String(x.id) === String(propId));
                                if (p) {
                                    setForm(prev => ({
                                        ...prev,
                                        property_address: p.address || p.property_address || '',
                                        city: p.city || 'Louisville',
                                        zip: p.zip || '',
                                        price: p.price || '',
                                        beds: p.beds || '',
                                        baths: p.baths || '',
                                        sqft: p.sqft || '',
                                        description: p.description || '',
                                        realtor_name: p.agentName || p.realtor_name || '',
                                    }));
                                }
                            }}
                        >
                            <option value="">Selecciona una propiedad (Opcional)</option>
                            {properties?.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.address || p.property_address} - ${p.price?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#aaa', marginTop: 4, display: 'block' }}>Al seleccionar se autocompletarán los datos.</small>
                    </div>

                    <div className="form-group">
                        <label>Dirección *</label>
                        <input
                            type="text"
                            placeholder="Ej: 10906 Milwaukee Way"
                            value={form.property_address}
                            onChange={(e) => handleChange('property_address', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>ZIP</label>
                            <input
                                type="text"
                                placeholder="40272"
                                value={form.zip}
                                onChange={(e) => handleChange('zip', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Precio $</label>
                            <input
                                type="number"
                                placeholder="189900"
                                value={form.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Sqft</label>
                            <input
                                type="number"
                                placeholder="1450"
                                value={form.sqft}
                                onChange={(e) => handleChange('sqft', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Habitaciones</label>
                            <input
                                type="number"
                                placeholder="3"
                                value={form.beds}
                                onChange={(e) => handleChange('beds', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Baños</label>
                            <input
                                type="text"
                                placeholder="2.0"
                                value={form.baths}
                                onChange={(e) => handleChange('baths', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            rows={3}
                            placeholder="Propiedad remodelada con acabados modernos..."
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>

                    {/* Realtor Selector */}
                    <div className="form-group">
                        <label><User size={14} style={{marginRight: 4, verticalAlign: 'middle'}} /> Asignar Realtor</label>
                        <select
                            value={form.realtor_name}
                            onChange={(e) => handleChange('realtor_name', e.target.value)}
                        >
                            <option value="">ZHomes (Oficina)</option>
                            {zhomesAgents.map((agent, i) => (
                                <option key={i} value={agent.name}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Upload Button */}
                {uploading ? (
                    <div className="upload-progress-container">
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="upload-progress-text">Subiendo... {uploadProgress}%</span>
                    </div>
                ) : (
                    <button 
                        className="upload-btn primary full"
                        onClick={handleUpload}
                        disabled={!videoFile || !form.property_address}
                    >
                        <Upload size={20} />
                        Publicar en Vibe
                    </button>
                )}
            </div>
        </div>
    );
}
