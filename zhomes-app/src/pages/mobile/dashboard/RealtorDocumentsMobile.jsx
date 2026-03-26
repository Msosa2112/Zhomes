import { useState, useRef } from 'react'
import { FolderClosed, FolderOpen, FileText, CheckCircle2, ChevronDown, ChevronRight, Upload, Loader2 } from 'lucide-react'
import './BrokerDocumentsMobile.css'

const INITIAL_DOCS = [
    { 
        id: 1, address: '1204 Willow Bend', status: 'Listada',
        docs: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Seller Disclosure', status: 'approved' },
            { name: 'Lead Paint Disclosure', status: 'approved' },
            { name: 'Contrato Compra-Venta', status: 'pending' },
            { name: 'Inspección de la Propiedad', status: 'pending' },
            { name: 'Certificado de Tasación', status: 'pending' },
            { name: 'Título de Propiedad', status: 'pending' },
        ]
    },
    { 
        id: 2, address: '8708 Denise Dr', status: 'Bajo Contrato',
        docs: [
            { name: 'Listing Agreement', status: 'approved' },
            { name: 'Purchase Agreement', status: 'approved' },
            { name: 'Seller Disclosure', status: 'approved' },
            { name: 'Home Inspection Report', status: 'approved' },
            { name: 'Lead Paint Disclosure', status: 'approved' },
            { name: 'Appraisal Report', status: 'pending' },
            { name: 'Title Insurance', status: 'pending' },
        ]
    },
]

export default function RealtorDocumentsMobile() {
    const [openFolders, setOpenFolders] = useState({ 1: true })
    const [txDocs, setTxDocs] = useState(INITIAL_DOCS)
    const [uploading, setUploading] = useState(null)
    const fileInputRef = useRef(null)
    const [activeFolder, setActiveFolder] = useState(null)

    const toggle = (id) => setOpenFolders(p => ({ ...p, [id]: !p[id] }))

    const handleUploadClick = (folderId) => {
        setActiveFolder(folderId)
        fileInputRef.current?.click()
    }

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0]
        if (!file || !activeFolder) return

        setUploading(activeFolder)

        // Simulate upload + AI analysis delay
        setTimeout(() => {
            setTxDocs(prev => prev.map(tx => {
                if (tx.id !== activeFolder) return tx
                return {
                    ...tx,
                    docs: [...tx.docs, { name: file.name, status: 'approved' }]
                }
            }))
            setUploading(null)
            setActiveFolder(null)
        }, 2000)

        e.target.value = ''
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
                <h1>Mis Documentos</h1>
                <p>Gestiona los documentos de tus transacciones</p>
                <div className="mobile-rdoc-tabs">
                    <button className="active">Pendientes</button>
                    <button>Aprobados</button>
                    <button>Todos</button>
                </div>
            </div>

            <div className="mobile-rdoc-list">
                {txDocs.map(tx => {
                    const isOpen = openFolders[tx.id]
                    const approved = tx.docs.filter(d => d.status === 'approved').length
                    return (
                        <div key={tx.id} className={`m-folder-card ${isOpen ? 'open' : ''}`}>
                            <button className="m-folder-head" onClick={() => toggle(tx.id)}>
                                <div className="m-folder-icon">{isOpen ? <FolderOpen size={20} /> : <FolderClosed size={20} />}</div>
                                <div className="m-folder-info">
                                    <h3 className="m-folder-address">{tx.address}</h3>
                                    <span className="m-folder-meta">{approved}/{tx.docs.length} Completos · {tx.status}</span>
                                </div>
                                {isOpen ? <ChevronDown size={20} className="m-folder-arr" /> : <ChevronRight size={20} className="m-folder-arr" />}
                            </button>

                            {isOpen && (
                                <div className="m-folder-body">
                                    <button 
                                        className="m-upload-btn" 
                                        onClick={() => handleUploadClick(tx.id)}
                                        disabled={uploading === tx.id}
                                    >
                                        {uploading === tx.id 
                                            ? <><Loader2 size={16} className="spin-icon" /> Analizando...</>
                                            : <><Upload size={16} /> Subir Documento</>
                                        }
                                    </button>
                                    {tx.docs.map((doc, i) => (
                                        <div key={i} className={`m-doc-row ${doc.status === 'pending' ? 'pending' : ''}`}>
                                            <FileText size={16} /> 
                                            <span className="m-doc-name">{doc.name}</span> 
                                            {doc.status === 'approved' 
                                                ? <CheckCircle2 size={16} color="#10B981" />
                                                : <span className="m-doc-badge">Subir</span>
                                            }
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div style={{ height: '90px' }} />
        </div>
    )
}
