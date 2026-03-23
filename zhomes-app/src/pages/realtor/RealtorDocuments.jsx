import { useState } from 'react'
import { Upload, CheckCircle2, Clock, Eye, Download, FolderOpen, FolderClosed, File, AlertCircle, ChevronDown, ChevronRight, Home, MapPin } from 'lucide-react'
import { REALTOR_TRANSACTIONS } from '../../data/mockData'
import './RealtorDocuments.css'

const DOC_ICONS = {
    approved: { icon: CheckCircle2, color: '#10B981', label: 'Aprobado' },
    uploaded: { icon: Eye, color: '#3B82F6', label: 'En revisión' },
    pending: { icon: Clock, color: '#9CA3AF', label: 'Pendiente' },
}

export default function RealtorDocuments() {
    const [openFolders, setOpenFolders] = useState(() => {
        // Open the first folder by default
        return { [REALTOR_TRANSACTIONS[0]?.id]: true }
    })
    const [statusFilter, setStatusFilter] = useState('all')

    const toggleFolder = (id) => {
        setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const allDocs = REALTOR_TRANSACTIONS.flatMap(t => t.documents)
    const countByStatus = {
        all: allDocs.length,
        approved: allDocs.filter(d => d.status === 'approved').length,
        uploaded: allDocs.filter(d => d.status === 'uploaded').length,
        pending: allDocs.filter(d => d.status === 'pending').length,
    }

    return (
        <div className="rdoc-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mis Documentos</h1>
                    <p className="page-subtitle">Organizados por propiedad — {REALTOR_TRANSACTIONS.length} carpetas</p>
                </div>
            </div>

            {/* Stats row */}
            <div className="rdoc-stats">
                <div className="rdoc-stat-pill total">
                    <FolderClosed size={16} />
                    <span>{countByStatus.all} Total</span>
                </div>
                <div className="rdoc-stat-pill approved">
                    <CheckCircle2 size={16} />
                    <span>{countByStatus.approved} Aprobados</span>
                </div>
                <div className="rdoc-stat-pill uploaded">
                    <Eye size={16} />
                    <span>{countByStatus.uploaded} En Revisión</span>
                </div>
                <div className="rdoc-stat-pill pending">
                    <AlertCircle size={16} />
                    <span>{countByStatus.pending} Pendientes</span>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="rdoc-filter-tabs">
                {[
                    { key: 'all', label: 'Todos' },
                    { key: 'approved', label: 'Aprobados' },
                    { key: 'uploaded', label: 'En Revisión' },
                    { key: 'pending', label: 'Pendientes' },
                ].map(f => (
                    <button
                        key={f.key}
                        className={`rdoc-filter-btn ${statusFilter === f.key ? 'active' : ''}`}
                        onClick={() => setStatusFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Folder list by property */}
            <div className="rdoc-folders">
                {REALTOR_TRANSACTIONS.map(tx => {
                    const isOpen = openFolders[tx.id]
                    const docs = statusFilter === 'all'
                        ? tx.documents
                        : tx.documents.filter(d => d.status === statusFilter)
                    const approvedCount = tx.documents.filter(d => d.status === 'approved').length
                    const totalCount = tx.documents.length
                    const progress = Math.round((approvedCount / totalCount) * 100)

                    return (
                        <div key={tx.id} className={`rdoc-folder ${isOpen ? 'open' : ''}`}>
                            {/* Folder header */}
                            <button className="rdoc-folder-header" onClick={() => toggleFolder(tx.id)}>
                                <div className="rdoc-folder-icon-wrap">
                                    {isOpen ? <FolderOpen size={20} /> : <FolderClosed size={20} />}
                                </div>
                                <div className="rdoc-folder-info">
                                    <div className="rdoc-folder-title-row">
                                        <span className="rdoc-folder-name">{tx.address}</span>
                                        <span className="rdoc-folder-status" style={{ color: tx.statusColor, background: `${tx.statusColor}12` }}>
                                            {tx.statusLabel}
                                        </span>
                                    </div>
                                    <div className="rdoc-folder-meta">
                                        <MapPin size={12} />
                                        <span>{tx.city}</span>
                                        <span className="rdoc-folder-sep">·</span>
                                        <span>${tx.price.toLocaleString()}</span>
                                        <span className="rdoc-folder-sep">·</span>
                                        <span>{approvedCount}/{totalCount} docs completos</span>
                                    </div>
                                </div>
                                <div className="rdoc-folder-progress">
                                    <div className="rdoc-progress-track">
                                        <div className="rdoc-progress-fill" style={{ width: `${progress}%`, background: progress === 100 ? '#10B981' : '#3B82F6' }}></div>
                                    </div>
                                    <span className="rdoc-progress-pct">{progress}%</span>
                                </div>
                                <div className="rdoc-folder-chevron">
                                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                            </button>

                            {/* Expanded folder contents */}
                            {isOpen && (
                                <div className="rdoc-folder-body animate-fadeInUp">
                                    {/* Upload dropzone per folder */}
                                    <div className="rdoc-folder-dropzone">
                                        <Upload size={16} />
                                        <span>Subir documentos a <strong>{tx.address}</strong></span>
                                    </div>

                                    {/* Document list */}
                                    <div className="rdoc-file-list">
                                        {docs.length === 0 ? (
                                            <div className="rdoc-empty">No hay documentos con ese filtro</div>
                                        ) : (
                                            docs.map((doc, i) => {
                                                const st = DOC_ICONS[doc.status]
                                                return (
                                                    <div key={i} className={`rdoc-file-row ${doc.status}`}>
                                                        <div className="rdoc-file-icon">
                                                            <File size={16} />
                                                        </div>
                                                        <div className="rdoc-file-info">
                                                            <span className="rdoc-file-name">{doc.name}</span>
                                                            <span className="rdoc-file-type">PDF</span>
                                                        </div>
                                                        <span className="rdoc-file-status" style={{ color: st.color, background: `${st.color}12` }}>
                                                            <st.icon size={14} />
                                                            {st.label}
                                                        </span>
                                                        <div className="rdoc-file-actions">
                                                            {doc.status === 'pending' ? (
                                                                <button className="rdoc-action-btn upload-action">
                                                                    <Upload size={14} />
                                                                    Subir
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button className="rdoc-action-btn" title="Ver">
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button className="rdoc-action-btn" title="Descargar">
                                                                        <Download size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
