import { useState, useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { PenTool, RotateCcw, Download, Check, X } from 'lucide-react'
import jsPDF from 'jspdf'
import './SignaturePad.css'

export default function SignaturePad({ documentTitle, signerName, onSave, onClose }) {
  const sigCanvas = useRef(null)
  const [signed, setSigned] = useState(false)

  const handleClear = () => {
    sigCanvas.current?.clear()
    setSigned(false)
  }

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setSigned(true)
    }
  }

  const handleSave = useCallback(async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return

    const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    
    // Generate PDF with signature
    const doc = new jsPDF()
    const now = new Date()
    
    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('ZHomes Real Estate', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(documentTitle || 'Documento de Firma', 105, 30, { align: 'center' })
    
    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 35, 190, 35)
    
    // Document info
    doc.setFontSize(10)
    doc.text(`Fecha: ${now.toLocaleDateString('es-US')}`, 20, 45)
    doc.text(`Hora: ${now.toLocaleTimeString('es-US')}`, 20, 52)
    doc.text(`Firmante: ${signerName || 'N/A'}`, 20, 59)
    doc.text(`ID Documento: ZH-${Date.now().toString(36).toUpperCase()}`, 20, 66)
    
    // Signature area
    doc.setDrawColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text('Firma:', 20, 200)
    doc.line(20, 220, 120, 220)
    
    // Add signature image
    doc.addImage(signatureDataUrl, 'PNG', 25, 185, 90, 30)
    
    // Legal text
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(
      'Este documento ha sido firmado electrónicamente de acuerdo con la UETA y ESIGN Act.',
      105, 240, { align: 'center' }
    )
    doc.text(
      `Timestamp: ${now.toISOString()} | Verificado por ZHomes Real Estate LLC`,
      105, 245, { align: 'center' }
    )

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    if (onSave) {
      onSave({
        signatureImage: signatureDataUrl,
        pdfBlob,
        pdfUrl,
        timestamp: now.toISOString(),
        signerName
      })
    }
  }, [documentTitle, signerName, onSave])

  return (
    <div className="sigpad-overlay" onClick={onClose}>
      <div className="sigpad-modal" onClick={e => e.stopPropagation()}>
        <div className="sigpad-header">
          <div>
            <h3><PenTool size={18} /> Firmar Documento</h3>
            <p className="sigpad-doc-title">{documentTitle}</p>
          </div>
          <button className="sigpad-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="sigpad-info">
          <span>Firmante: <strong>{signerName}</strong></span>
          <span>{new Date().toLocaleDateString('es-US')}</span>
        </div>

        <div className="sigpad-doc-preview">
            <div className="doc-skeleton-line" />
            <div className="doc-skeleton-line" style={{ width: '80%' }} />
            <p className="doc-preview-text">
                Por la presente, (<strong>{signerName}</strong>) acepta y formaliza 
                legalmente todos los términos y condiciones definidos en el documento 
                titulado: <strong>{documentTitle}</strong>.
            </p>
            <div className="doc-skeleton-line" style={{ width: '90%' }} />
            <div className="doc-skeleton-line" style={{ width: '60%' }} />
            
            <div className="doc-sign-here-indicator">
                <span>FIRMA REQUERIDA A CONTINUACIÓN</span>
                <span style={{ fontSize: '14px', marginTop: '2px' }}>↓</span>
            </div>
        </div>

        <div className="sigpad-canvas-wrap">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'sigpad-canvas',
              width: 340,
              height: 180
            }}
            backgroundColor="white"
            penColor="#1a1a1a"
            minWidth={1.5}
            maxWidth={3}
            onEnd={handleEnd}
          />
          {!signed && (
            <div className="sigpad-placeholder">
              Dibuja tu firma aquí 
            </div>
          )}
        </div>

        <div className="sigpad-actions">
          <button className="sigpad-btn secondary" onClick={handleClear}>
            <RotateCcw size={16} /> Limpiar
          </button>
          <button 
            className="sigpad-btn primary" 
            onClick={handleSave}
            disabled={!signed}
          >
            <Check size={16} /> Firmar & Guardar
          </button>
        </div>

        <p className="sigpad-legal">
          Al firmar, acepto que esta firma electrónica tiene la misma validez
          legal que una firma manuscrita según la UETA y ESIGN Act.
        </p>
      </div>
    </div>
  )
}
