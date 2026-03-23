import { useState } from 'react'
import { FolderClosed, FolderOpen, FileText, CheckCircle2, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import './BrokerDocumentsMobile.css'

const TX_DOCS = [
    { id: 1, address: '8708 Denise Dr', status: 'Listada', total: 7, approved: 3, pending: 4 },
    { id: 2, address: '2215 Tremont Dr', status: 'Bajo Contrato', total: 7, approved: 5, pending: 2 },
]

export default function BrokerDocumentsMobile() {
    const [openFolders, setOpenFolders] = useState({ 1: true })

    const toggle = (id) => setOpenFolders(p => ({ ...p, [id]: !p[id] }))

    return (
        <div className="mobile-rdoc-page">
            <div className="mobile-rdoc-header">
                <h1>Documentos</h1>
                <p>Centro de cumplimiento y validación</p>
                <div className="mobile-rdoc-tabs">
                    <button className="active">Pendientes</button>
                    <button>Revisados</button>
                    <button>Todos</button>
                </div>
            </div>

            <div className="mobile-rdoc-list">
                {TX_DOCS.map(tx => {
                    const isOpen = openFolders[tx.id]
                    return (
                        <div key={tx.id} className={`m-folder-card ${isOpen ? 'open' : ''}`}>
                            <button className="m-folder-head" onClick={() => toggle(tx.id)}>
                                <div className="m-folder-icon">{isOpen ? <FolderOpen size={20} /> : <FolderClosed size={20} />}</div>
                                <div className="m-folder-info">
                                    <h3 className="m-folder-address">{tx.address}</h3>
                                    <span className="m-folder-meta">{tx.approved}/{tx.total} Completos · {tx.status}</span>
                                </div>
                                {isOpen ? <ChevronDown size={20} className="m-folder-arr" /> : <ChevronRight size={20} className="m-folder-arr" />}
                            </button>

                            {isOpen && (
                                <div className="m-folder-body">
                                    <button className="m-upload-btn"><Upload size={16} /> Subir Doc</button>
                                    <div className="m-doc-row">
                                        <FileText size={16} /> <span className="m-doc-name">Listing Agreement</span> <CheckCircle2 size={16} color="#10B981" />
                                    </div>
                                    <div className="m-doc-row pending">
                                        <FileText size={16} /> <span className="m-doc-name">Contrato Compra-Venta</span> <span className="m-doc-badge">Falta</span>
                                    </div>
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
