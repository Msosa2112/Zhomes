/**
 * ZHomes TC — Document Checklist Templates
 * 
 * Templates de documentos requeridos por tipo de transacción en Kentucky.
 * Cuando se crea una nueva transacción, estos documentos se insertan automáticamente
 * en tc_documents con status 'pending'.
 * 
 * Confirmado con Gilbert Zaldivar — Actualizar según regulaciones KY actuales.
 */

export const TC_DOCUMENT_TEMPLATES = {
  // ── COMPRA DE PROPIEDAD ──────────────────────────────────────────
  purchase: [
    // Financiamiento
    { name: 'Pre-Approval Letter',          category: 'financial',  required: true,  sort_order: 1,  notes: 'Carta de pre-aprobación del lender' },
    { name: 'Proof of Funds',               category: 'financial',  required: false, sort_order: 2,  notes: 'Si es compra en efectivo' },

    // Contrato
    { name: 'Contrato de Compra-Venta',     category: 'contract',   required: true,  sort_order: 3,  notes: 'Purchase Agreement firmado por ambas partes' },
    { name: 'Seller Disclosure',            category: 'contract',   required: true,  sort_order: 4,  notes: 'Divulgación de condición de la propiedad por el vendedor' },
    { name: 'HOA Addendum',                 category: 'contract',   required: false, sort_order: 5,  notes: 'Solo si la propiedad pertenece a una HOA' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 6,  notes: 'Requerido si la propiedad fue construida antes de 1978' },
    { name: 'Counter Offer / Addendum',     category: 'contract',   required: false, sort_order: 7,  notes: 'Si hubo negociación adicional' },

    // Inspección
    { name: 'Home Inspection Report',       category: 'inspection', required: true,  sort_order: 8,  notes: 'Reporte completo del inspector certificado' },
    { name: 'Seller Repair Agreement',      category: 'inspection', required: false, sort_order: 9,  notes: 'Si se negociaron reparaciones post-inspección' },
    { name: 'Well / Septic Inspection',     category: 'inspection', required: false, sort_order: 10, notes: 'Solo si la propiedad tiene pozo o tanque séptico' },
    { name: 'Radon Test Results',           category: 'inspection', required: false, sort_order: 11, notes: 'Recomendado en Kentucky' },

    // Financiamiento
    { name: 'Loan Estimate (LE)',            category: 'financial',  required: true,  sort_order: 12, notes: 'Estimado de préstamo del lender' },
    { name: 'Appraisal Report',             category: 'financial',  required: true,  sort_order: 13, notes: 'Tasación ordenada por el lender' },
    { name: 'Loan Approval / Clear to Close', category: 'financial', required: true, sort_order: 14, notes: 'Aprobación final del préstamo' },

    // Título
    { name: 'Title Search Report',          category: 'title',      required: true,  sort_order: 15, notes: 'Búsqueda de título para verificar propiedad limpia' },
    { name: 'Title Insurance (Lender)',     category: 'title',      required: true,  sort_order: 16, notes: 'Requerida por el lender' },
    { name: 'Title Insurance (Owner)',      category: 'title',      required: false, sort_order: 17, notes: 'Recomendada para el comprador' },

    // Cierre
    { name: 'Proof of Homeowner Insurance', category: 'closing',    required: true,  sort_order: 18, notes: 'Póliza activa antes del cierre' },
    { name: 'Closing Disclosure (CD)',      category: 'closing',    required: true,  sort_order: 19, notes: 'Se recibe 3 días hábiles antes del cierre' },
    { name: 'Final Walkthrough Confirmation', category: 'closing',  required: true,  sort_order: 20, notes: '24-48 hrs antes del cierre' },
    { name: 'Wire Transfer / Cashier Check', category: 'closing',   required: true,  sort_order: 21, notes: 'Fondos para el cierre' },
    { name: 'Settlement Statement (HUD)',    category: 'closing',   required: true,  sort_order: 22, notes: 'Resumen financiero del cierre' },
  ],

  // ── VENTA DE PROPIEDAD ───────────────────────────────────────────
  sale: [
    { name: 'Listing Agreement',            category: 'contract',   required: true,  sort_order: 1,  notes: 'Contrato de representación del vendedor' },
    { name: 'Seller Disclosure',            category: 'contract',   required: true,  sort_order: 2,  notes: 'Divulgación obligatoria en Kentucky' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 3,  notes: 'Si construida antes de 1978' },
    { name: 'Contrato de Compra-Venta',     category: 'contract',   required: true,  sort_order: 4,  notes: 'Oferta aceptada por el vendedor' },
    { name: 'HOA Resale Package',           category: 'contract',   required: false, sort_order: 5,  notes: 'Documentos de HOA si aplica' },
    { name: 'Home Inspection Response',     category: 'inspection', required: false, sort_order: 6,  notes: 'Respuesta del vendedor a la inspección del comprador' },
    { name: 'Repair Receipts',              category: 'inspection', required: false, sort_order: 7,  notes: 'Si se acordaron reparaciones' },
    { name: 'Title Search Report',          category: 'title',      required: true,  sort_order: 8,  notes: 'Confirmación de título limpio' },
    { name: 'Mortgage Payoff Statement',    category: 'financial',  required: false, sort_order: 9,  notes: 'Si hay hipoteca activa' },
    { name: 'Closing Disclosure (CD)',      category: 'closing',    required: true,  sort_order: 10, notes: 'Estado financiero final' },
    { name: 'Settlement Statement (HUD)',   category: 'closing',    required: true,  sort_order: 11, notes: 'Resumen del cierre' },
    { name: 'Deed Transfer Documents',      category: 'closing',    required: true,  sort_order: 12, notes: 'Transferencia legal de título' },
  ],

  // ── ARRENDAMIENTO ────────────────────────────────────────────────
  lease: [
    { name: 'Lease Agreement',              category: 'contract',   required: true,  sort_order: 1,  notes: 'Contrato de arrendamiento' },
    { name: 'Rental Application',           category: 'financial',  required: true,  sort_order: 2,  notes: 'Solicitud del inquilino' },
    { name: 'Credit / Background Check',    category: 'financial',  required: true,  sort_order: 3,  notes: 'Verificación de crédito e historial' },
    { name: 'Proof of Income',              category: 'financial',  required: true,  sort_order: 4,  notes: 'Últimos 2 pay stubs o tax returns' },
    { name: 'Photo ID',                     category: 'contract',   required: true,  sort_order: 5,  notes: 'Identificación del inquilino' },
    { name: 'Security Deposit Receipt',     category: 'financial',  required: true,  sort_order: 6,  notes: 'Recibo del depósito de seguridad' },
    { name: 'Move-In Inspection Report',    category: 'inspection', required: true,  sort_order: 7,  notes: 'Condición inicial de la propiedad' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 8,  notes: 'Si construida antes de 1978' },
    { name: 'HOA Rules (si aplica)',        category: 'contract',   required: false, sort_order: 9,  notes: 'Reglamento de la comunidad' },
    { name: 'Renter\'s Insurance Proof',   category: 'closing',    required: false, sort_order: 10, notes: 'Recomendado para el inquilino' },
  ],
};

/**
 * Genera el array de documentos para insertar en tc_documents
 * dado un tipo de transacción.
 * 
 * @param {string} transactionId - UUID de la transacción
 * @param {string} transactionType - 'purchase' | 'sale' | 'lease'
 * @returns {Array} - Array de objetos listos para insertar en Supabase
 */
export function generateChecklist(transactionId, transactionType = 'purchase') {
  const template = TC_DOCUMENT_TEMPLATES[transactionType] || TC_DOCUMENT_TEMPLATES.purchase;
  
  return template.map((doc) => ({
    transaction_id: transactionId,
    name:           doc.name,
    category:       doc.category,
    status:         'pending',
    required:       doc.required,
    sort_order:     doc.sort_order,
    notes:          doc.notes ?? null,
  }));
}

// Categorías con etiquetas en español para la UI
export const DOCUMENT_CATEGORIES = {
  contract:   { label: 'Contrato',      color: '#6366f1', icon: '' },
  inspection: { label: 'Inspección',    color: '#f59e0b', icon: '' },
  financial:  { label: 'Financiamiento', color: '#10b981', icon: '' },
  title:      { label: 'Título',        color: '#3b82f6', icon: '' },
  closing:    { label: 'Cierre',        color: '#8b5cf6', icon: '' },
};

// Estados de documento con sus etiquetas y colores
export const DOCUMENT_STATUSES = {
  pending:    { label: 'Pendiente',    color: '#6b7280', bg: '#f3f4f6' },
  uploaded:   { label: 'Subido',       color: '#f59e0b', bg: '#fffbeb' },
  reviewing:  { label: 'En Revisión',  color: '#3b82f6', bg: '#eff6ff' },
  approved:   { label: 'Aprobado ',  color: '#10b981', bg: '#f0fdf4' },
  rejected:   { label: 'Rechazado',   color: '#ef4444', bg: '#fef2f2' },
};

// Estados de transacción con etiquetas, colores y número de paso (para el Timeline)
export const TRANSACTION_STATUSES = {
  listed:           { label: 'Listada',          step: 0, color: '#6b7280' },
  under_contract:   { label: 'Bajo Contrato',    step: 1, color: '#3b82f6' },
  inspection:       { label: 'Inspección',       step: 2, color: '#f59e0b' },
  appraisal:        { label: 'Tasación',         step: 2, color: '#f59e0b' },
  pre_close:        { label: 'Pre-Cierre',       step: 3, color: '#8b5cf6' },
  closed:           { label: '¡Cerrada! ',    step: 4, color: '#10b981' },
  cancelled:        { label: 'Cancelada',        step: -1, color: '#ef4444' },
};
