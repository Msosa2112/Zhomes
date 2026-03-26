import { useState, useRef } from 'react'
import { FolderClosed, FolderOpen, FileText, CheckCircle2, ChevronDown, ChevronRight, Upload, Loader2, Eye, XCircle, Clock, User, Home } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import './BrokerDocumentsMobile.css'

const INITIAL_DATA = {
    realtors: [
        {
            id: 'r1', name: 'Jessica Hernandez', avatar: '/assets/agents/Jessica%20Hernandez/Jessica%20Hernandez.png',
            properties: [
                {
                    id: 'p1', address: '8708 Denise Dr', status: 'Listada',
                    docs: [
                        { id: 'd1', name: 'Listing Agreement', status: 'approved', date: '2026-03-10' },
                        { id: 'd2', name: 'Seller Disclosure', status: 'approved', date: '2026-03-12' },
                        { id: 'd3', name: 'Lead Paint Disclosure', status: 'approved', date: '2026-03-12' },
                        { id: 'd4', name: 'Contrato Compra-Venta', status: 'pending', date: '2026-03-20' },
                        { id: 'd5', name: 'Inspección de la Propiedad', status: 'pending', date: null },
                        { id: 'd6', name: 'Certificado de Tasación', status: 'pending', date: null },
                    ]
                },
                {
                    id: 'p2', address: '2215 Tremont Dr', status: 'Bajo Contrato',
                    docs: [
                        { id: 'd7', name: 'Listing Agreement', status: 'approved', date: '2026-02-15' },
                        { id: 'd8', name: 'Purchase Agreement', status: 'approved', date: '2026-02-20' },
                        { id: 'd9', name: 'Home Inspection Report', status: 'reviewed', date: '2026-03-01' },
                        { id: 'd10', name: 'Appraisal Report', status: 'pending', date: null },
                        { id: 'd11', name: 'Title Insurance', status: 'pending', date: null },
                    ]
                }
            ]
        },
        {
            id: 'r2', name: 'Carlos Martinez', avatar: null,
            properties: [
                {
                    id: 'p3', address: '1204 Willow Bend', status: 'Listada',
                    docs: [
                        { id: 'd12', name: 'Listing Agreement', status: 'approved', date: '2026-03-05' },
                        { id: 'd13', name: 'Seller Disclosure', status: 'reviewed', date: '2026-03-08' },
                        { id: 'd14', name: 'Lead Paint Disclosure', status: 'pending', date: null },
                        { id: 'd15', name: 'MLS Upload Confirmation', status: 'pending', date: null },
                    ]
                },
                {
                    id: 'p4', address: '900 S 4th Street', status: 'Vendida',
                    docs: [
                        { id: 'd16', name: 'Closing Statement', status: 'approved', date: '2026-01-20' },
                        { id: 'd17', name: 'Deed of Transfer', status: 'approved', date: '2026-01-22' },
                        { id: 'd18', name: 'Final Walkthrough', status: 'reviewed', date: '2026-01-19' },
                    ]
                }
            ]
        },
        {
            id: 'r3', name: 'Ana Torres', avatar: null,
            properties: [
                {
                    id: 'p5', address: '3320 Bardstown Rd', status: 'Bajo Contrato',
                    docs: [
                        { id: 'd19', name: 'Purchase Agreement', status: 'approved', date: '2026-03-15' },
                        { id: 'd20', name: 'Buyer Disclosure', status: 'pending', date: '2026-03-18' },
                        { id: 'd21', name: 'Inspección Estructural', status: 'pending', date: null },
                    ]
                }
            ]
        }
    ]
}

export default function BrokerDocumentsMobile() {
    const { theme } = useTheme()
    const [data, setData] = useState(INITIAL_DATA)
    const [viewMode, setViewMode] = useState('property') // 'property' | 'realtor'
    const [tabFilter, setTabFilter] = useState('all') // 'pending' | 'reviewed' | 'all'
    const [openFolders, setOpenFolders] = useState({ p1: true, r1: true })
    const [uploading, setUploading] = useState(null)
    const [activeFolder, setActiveFolder] = useState(null)
    const fileInputRef = useRef(null)

    const toggle = (id) => setOpenFolders(p => ({ ...p, [id]: !p[id] }))

    // Flatten all properties
    const allProperties = data.realtors.flatMap(r => 
        r.properties.map(p => ({ ...p, realtorName: r.name, realtorId: r.id }))
    )

    // Filter docs inside a property based on tab
    const filterDocs = (docs) => {
        if (tabFilter === 'pending') return docs.filter(d => d.status === 'pending')
        if (tabFilter === 'reviewed') return docs.filter(d => d.status === 'approved' || d.status === 'reviewed')
        return docs
    }

    // Count helpers
    const countByStatus = (docs, st) => docs.filter(d => d.status === st).length

    const handleUploadClick = (folderId) => {
        setActiveFolder(folderId)
        fileInputRef.current?.click()
    }

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0]
        if (!file || !activeFolder) return
        setUploading(activeFolder)

        setTimeout(() => {
            setData(prev => {
                const updated = JSON.parse(JSON.stringify(prev))
                updated.realtors.forEach(r => {
                    r.properties.forEach(p => {
                        if (p.id === activeFolder) {
                            p.docs.push({ 
                                id: 'u' + Date.now(), 
                                name: file.name, 
                                status: 'pending', 
                                date: new Date().toISOString().split('T')[0] 
                            })
                        }
                    })
                })
                return updated
            })
            setUploading(null)
            setActiveFolder(null)
        }, 2000)
        e.target.value = ''
    }

    // Approve/reject doc
    const updateDocStatus = (docId, newStatus) => {
        setData(prev => {
            const updated = JSON.parse(JSON.stringify(prev))
            updated.realtors.forEach(r => {
                r.properties.forEach(p => {
                    p.docs.forEach(d => {
                        if (d.id === docId) d.status = newStatus
                    })
                })
            })
            return updated
        })
    }

    const statusIcon = (status) => {
        if (status === 'approved') return <CheckCircle2 size={16} color="#10B981" />
        if (status === 'reviewed') return <Eye size={16} color="#3B82F6" />
        return <Clock size={16} color="#F59E0B" />
    }

    const statusBadge = (status) => {
        if (status === 'approved') return <span className="m-doc-badge approved">Aprobado</span>
        if (status === 'reviewed') return <span className="m-doc-badge reviewed">Revisado</span>
        return <span className="m-doc-badge">Pendiente</span>
    }

    const renderDocRow = (doc) => (
        <div key={doc.id} className={`m-doc-row ${doc.status === 'pending' ? 'pending' : ''}`}>
            <FileText size={16} />
            <div className="m-doc-info-col">
                <span className="m-doc-name">{doc.name}</span>
                {doc.date && <span className="m-doc-date">{doc.date}</span>}
            </div>
            <div className="m-doc-actions">
                {doc.status === 'pending' && (
                    <>
                        <button className="m-doc-action-btn approve" onClick={() => updateDocStatus(doc.id, 'approved')} title="Aprobar">
                            <CheckCircle2 size={18} />
                        </button>
                        <button className="m-doc-action-btn reject" onClick={() => updateDocStatus(doc.id, 'reviewed')} title="Marcar revisado">
                            <Eye size={18} />
                        </button>
                    </>
                )}
                {doc.status !== 'pending' && statusIcon(doc.status)}
            </div>
        </div>
    )

    const renderPropertyFolder = (prop, showRealtor = false) => {
        const filteredDocs = filterDocs(prop.docs)
        if (filteredDocs.length === 0 && tabFilter !== 'all') return null
        const isOpen = openFolders[prop.id]
        const approved = countByStatus(prop.docs, 'approved')
        const reviewed = countByStatus(prop.docs, 'reviewed')

        return (
            <div key={prop.id} className={`m-folder-card ${isOpen ? 'open' : ''}`}>
                <button className="m-folder-head" onClick={() => toggle(prop.id)}>
                    <div className="m-folder-icon">{isOpen ? <FolderOpen size={20} /> : <FolderClosed size={20} />}</div>
                    <div className="m-folder-info">
                        <h3 className="m-folder-address">{prop.address}</h3>
                        <span className="m-folder-meta">
                            {approved + reviewed}/{prop.docs.length} Completos · {prop.status}
                            {showRealtor && ` · ${prop.realtorName}`}
                        </span>
                    </div>
                    {isOpen ? <ChevronDown size={20} className="m-folder-arr" /> : <ChevronRight size={20} className="m-folder-arr" />}
                </button>

                {isOpen && (
                    <div className="m-folder-body">
                        <button
                            className="m-upload-btn"
                            onClick={() => handleUploadClick(prop.id)}
                            disabled={uploading === prop.id}
                        >
                            {uploading === prop.id
                                ? <><Loader2 size={16} className="spin-icon" /> Subiendo...</>
                                : <><Upload size={16} /> Subir Doc</>
                            }
                        </button>
                        {filteredDocs.map(renderDocRow)}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="mobile-rdoc-page">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
            />

            <div className="mobile-rdoc-header">
                <h1>Documentos</h1>
                <p>Centro de cumplimiento y validación</p>

                {/* View mode switcher */}
                <div className="m-view-switcher">
                    <button 
                        className={viewMode === 'property' ? 'active' : ''} 
                        onClick={() => setViewMode('property')}
                    >
                        <Home size={14} /> Por Propiedad
                    </button>
                    <button 
                        className={viewMode === 'realtor' ? 'active' : ''} 
                        onClick={() => setViewMode('realtor')}
                    >
                        <User size={14} /> Por Realtor
                    </button>
                </div>

                {/* Tab filters */}
                <div className="mobile-rdoc-tabs">
                    <button className={tabFilter === 'pending' ? 'active' : ''} onClick={() => setTabFilter('pending')}>Pendientes</button>
                    <button className={tabFilter === 'reviewed' ? 'active' : ''} onClick={() => setTabFilter('reviewed')}>Revisados</button>
                    <button className={tabFilter === 'all' ? 'active' : ''} onClick={() => setTabFilter('all')}>Todos</button>
                </div>
            </div>

            <div className="mobile-rdoc-list">
                {viewMode === 'property' && (
                    allProperties.map(p => renderPropertyFolder(p, true))
                )}

                {viewMode === 'realtor' && (
                    data.realtors.map(realtor => {
                        const isRealtorOpen = openFolders[realtor.id]
                        const totalDocs = realtor.properties.flatMap(p => p.docs).length
                        const completeDocs = realtor.properties.flatMap(p => p.docs).filter(d => d.status !== 'pending').length

                        return (
                            <div key={realtor.id} className="m-realtor-group">
                                <button className="m-realtor-head" onClick={() => toggle(realtor.id)}>
                                    <div className="m-realtor-avatar">
                                        {realtor.avatar 
                                            ? <img src={realtor.avatar} alt={realtor.name} />
                                            : <User size={20} />
                                        }
                                    </div>
                                    <div className="m-folder-info">
                                        <h3 className="m-folder-address">{realtor.name}</h3>
                                        <span className="m-folder-meta">
                                            {realtor.properties.length} propiedad{realtor.properties.length > 1 ? 'es' : ''} · {completeDocs}/{totalDocs} docs
                                        </span>
                                    </div>
                                    {isRealtorOpen ? <ChevronDown size={20} className="m-folder-arr" /> : <ChevronRight size={20} className="m-folder-arr" />}
                                </button>

                                {isRealtorOpen && (
                                    <div className="m-realtor-properties">
                                        {realtor.properties.map(p => renderPropertyFolder(p))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
            <div style={{ height: '90px' }} />
        </div>
    )
}
