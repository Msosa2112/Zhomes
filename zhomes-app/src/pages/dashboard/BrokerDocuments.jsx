import { useState } from 'react'
import {
    Upload, CheckCircle2, Clock, Eye, Download,
    FolderOpen, FolderClosed, File, AlertCircle,
    ChevronDown, ChevronRight, MapPin, User
} from 'lucide-react'
import './BrokerDocuments.css'

const BROKER_TRANSACTIONS = [
    {
        id: 1, address: '8708 Denise Dr', city: 'Louisville, KY', price: 425000,
        statusLabel: 'Listada', statusColor: '#3B82F6',
        realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'uploaded' },
            { name: 'Contrato Compra-Venta', status: 'pending' },
            { name: 'Inspección', status: 'pending' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD / Settlement', status: 'pending' },
        ],
    },
    {
        id: 2, address: '4411 Lambert Rd', city: 'Louisville, KY', price: 289000,
        statusLabel: 'Listada', statusColor: '#3B82F6',
        realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'uploaded' },
            { name: 'Pre-Approval Letter', status: 'pending' },
            { name: 'Contrato Compra-Venta', status: 'pending' },
            { name: 'Inspección', status: 'pending' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD / Settlement', status: 'pending' },
        ],
    },
    {
        id: 3, address: '2215 Tremont Dr', city: 'Louisville, KY', price: 567000,
        statusLabel: 'Bajo Contrato', statusColor: '#8B5CF6',
        realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'uploaded' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD / Settlement', status: 'pending' },
        ],
    },
    {
        id: 4, address: '9320 Galene Dr', city: 'Louisville, KY', price: 199000,
        statusLabel: 'Inspección', statusColor: '#F59E0B',
        realtor: 'Yusleidy P.', avatar: '/assets/agents/Yusleidy Perez.png',
        image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'uploaded' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD / Settlement', status: 'pending' },
        ],
    },
    {
        id: 5, address: '1850 Lakewood Hills', city: 'Prospect, KY', price: 715000,
        statusLabel: 'Pre-Cierre', statusColor: '#10B981',
        realtor: 'Jessica H.', avatar: '/assets/agents/Jessica Hernandez.png',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'approved' },
            { name: 'Tasación', status: 'approved' },
            { name: 'HUD / Settlement', status: 'pending' },
        ],
    },
    {
        id: 6, address: '3744 Springhurst Blvd', city: 'Louisville, KY', price: 345000,
        statusLabel: 'Cerrada', statusColor: '#06B6D4',
        realtor: 'Miriam C.', avatar: '/assets/agents/Miriam Castano.png',
        image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'approved' },
            { name: 'Tasación', status: 'approved' },
            { name: 'HUD / Settlement', status: 'approved' },
        ],
    },
    {
        id: 7, address: '220 River Rd', city: 'Anchorage, KY', price: 899000,
        statusLabel: 'Pagada', statusColor: '#22C55E',
        realtor: 'Judith G.', avatar: '/assets/agents/Judith Gonzalez.png',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100',
        documents: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Disclosure Statement', status: 'approved' },
            { name: 'Pre-Approval Letter', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'approved' },
            { name: 'Inspección', status: 'approved' },
            { name: 'Tasación', status: 'approved' },
            { name: 'HUD / Settlement', status: 'approved' },
        ],
    },
]

const DOC_ICONS = {
    approved: { icon: CheckCircle2, color: '#10B981', label: 'Aprobado' },
    uploaded: { icon: Eye, color: '#3B82F6', label: 'En revisión' },
    pending: { icon: Clock, color: '#9CA3AF', label: 'Pendiente' },
}

export default function BrokerDocuments() {
    const [openFolders, setOpenFolders] = useState({ 1: true })
    const [statusFilter, setStatusFilter] = useState('all')

    const toggleFolder = (id) => {
        setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const allDocs = BROKER_TRANSACTIONS.flatMap(t => t.documents)
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
                    <h1 className="page-title">Documentos</h1>
                    <p className="page-subtitle">Todas las carpetas de documentos — {BROKER_TRANSACTIONS.length} propiedades</p>
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

            {/* Filter tabs */}
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

            {/* Folder list */}
            <div className="rdoc-folders">
                {BROKER_TRANSACTIONS.map(tx => {
                    const isOpen = openFolders[tx.id]
                    const docs = statusFilter === 'all'
                        ? tx.documents
                        : tx.documents.filter(d => d.status === statusFilter)
                    const approvedCount = tx.documents.filter(d => d.status === 'approved').length
                    const totalCount = tx.documents.length
                    const progress = Math.round((approvedCount / totalCount) * 100)

                    return (
                        <div key={tx.id} className={`rdoc-folder ${isOpen ? 'open' : ''}`}>
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
                                        <img src={tx.avatar} alt="" className="rdoc-realtor-avatar" />
                                        <span>{tx.realtor}</span>
                                        <span className="rdoc-folder-sep">·</span>
                                        <span>{approvedCount}/{totalCount} completos</span>
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

                            {isOpen && (
                                <div className="rdoc-folder-body animate-fadeInUp">
                                    <div className="rdoc-folder-dropzone">
                                        <Upload size={16} />
                                        <span>Subir documentos a <strong>{tx.address}</strong></span>
                                    </div>

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
                                                            ) : doc.status === 'uploaded' ? (
                                                                <>
                                                                    <button className="rdoc-action-btn approve-action">
                                                                        <CheckCircle2 size={14} />
                                                                        Aprobar
                                                                    </button>
                                                                    <button className="rdoc-action-btn">
                                                                        <Eye size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button className="rdoc-action-btn">
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button className="rdoc-action-btn">
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
