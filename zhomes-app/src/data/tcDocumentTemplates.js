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
    { name: 'Pre-Approval Letter',          category: 'financial',  required: true,  sort_order: 1,  notes: 'Carta de pre-aprobación del lender', ai_qa_enabled: true, ai_guidelines: 'Rechaza si no es una carta de pre-aprobación emitida por un banco o prestamista. Debe incluir explícitamente el nombre del prestatario, el monto máximo aprobado, y la fecha de emisión no debe ser mayor a 90 días.' },
    { name: 'Proof of Funds',               category: 'financial',  required: false, sort_order: 2,  notes: 'Si es compra en efectivo', ai_qa_enabled: true, ai_guidelines: 'Debe ser un estado de cuenta bancario oficial o carta de fondos. Verifica que el nombre del titular esté presente y el saldo disponible cubra el monto requerido. Oculta u omite los números completos de cuenta.' },

    // Contrato
    { name: 'Contrato de Compra-Venta',     category: 'contract',   required: true,  sort_order: 3,  notes: 'Purchase Agreement firmado por ambas partes', ai_qa_enabled: true, ai_guidelines: 'Rechaza si no es un contrato de compraventa (Purchase Agreement). Debe incluir precio de compra (Purchase Price), el depósito (Earnest Money Deposit o EMD), la dirección de propiedad, y las firmas tanto del comprador como del vendedor.' },
    { name: 'Seller Disclosure',            category: 'contract',   required: true,  sort_order: 4,  notes: 'Divulgación de condición de la propiedad por el vendedor', ai_qa_enabled: true, ai_guidelines: 'Debe ser el formulario de "Seller\'s Property Disclosure". Verifica que todas las páginas estén presentes y tenga las firmas/iniciales del vendedor y el acknowledge del comprador.' },
    { name: 'HOA Addendum',                 category: 'contract',   required: false, sort_order: 5,  notes: 'Solo si la propiedad pertenece a una HOA', ai_qa_enabled: true, ai_guidelines: 'Evidencia sobre tarifas y reglas de Homeowners Association. Extrae los montos de cuotas mensuales/anuales y las frecuencias de pago.' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 6,  notes: 'Requerido si la propiedad fue construida antes de 1978', ai_qa_enabled: true, ai_guidelines: 'Debe referir sobre la pintura con base de plomo. Es obligatorio verificar firmas de compradores, vendedores y sus respectivos agentes.' },
    { name: 'Counter Offer / Addendum',     category: 'contract',   required: false, sort_order: 7,  notes: 'Si hubo negociación adicional', ai_qa_enabled: true, ai_guidelines: 'Debe contener extensiones, cambios de precio o reparaciones acordadas al contrato original. Debe estar firmado por ambas partes para ser válido.' },

    // Inspección
    { name: 'Home Inspection Report',       category: 'inspection', required: true,  sort_order: 8,  notes: 'Reporte completo del inspector certificado', ai_qa_enabled: true, ai_guidelines: 'Un reporte de inspección de vivienda. Si es válido, resume los 3 a 5 "defectos o riesgos principales" encontrados (Major Concerns o Safety Hazards).' },
    { name: 'Seller Repair Agreement',      category: 'inspection', required: false, sort_order: 9,  notes: 'Si se negociaron reparaciones post-inspección', ai_qa_enabled: true, ai_guidelines: 'Documento que estipula formalmente qué reparaciones acepta realizar el vendedor antes del cierre en respuesta a la inspección.' },
    { name: 'Well / Septic Inspection',     category: 'inspection', required: false, sort_order: 10, notes: 'Solo si la propiedad tiene pozo o tanque séptico', ai_qa_enabled: true, ai_guidelines: 'Reporte de calidad de agua de pozo o condición de la fosa séptica. Extrae su estado actual y si requiere reemplazo.' },
    { name: 'Radon Test Results',           category: 'inspection', required: false, sort_order: 11, notes: 'Recomendado en Kentucky', ai_qa_enabled: true, ai_guidelines: 'Resultados del nivel de radón en la vivienda. Rechaza si el nivel está por encima del rango seguro sin plan de mitigación.' },

    // Financiamiento
    { name: 'Loan Estimate (LE)',            category: 'financial',  required: true,  sort_order: 12, notes: 'Estimado de préstamo del lender', ai_qa_enabled: true, ai_guidelines: 'Busca el "Loan Estimate" oficial de 3 páginas. Extrae el monto estimado para el cierre (Cash to Close), el interés estimado y los pagos mensuales.' },
    { name: 'Appraisal Report',             category: 'financial',  required: true,  sort_order: 13, notes: 'Tasación ordenada por el lender', ai_qa_enabled: true, ai_guidelines: 'Rechaza si no es un reporte de Avalúo (Appraisal). Extrae y confirma si el "Appraised Value" iguala o supera el precio de compra del contrato.' },
    { name: 'Loan Approval / Clear to Close', category: 'financial', required: true, sort_order: 14, notes: 'Aprobación final del préstamo', ai_qa_enabled: true, ai_guidelines: 'Documento oficial del banco confirmando la autorización final (Clear to Close u OK to Fund). Deben haberse superado las contingencias financieras principales.' },

    // Título
    { name: 'Title Search Report',          category: 'title',      required: true,  sort_order: 15, notes: 'Búsqueda de título para verificar propiedad limpia', ai_qa_enabled: true, ai_guidelines: 'Reporte de compromiso de título (Title Commitment). Identifica problemas en la Parte B (Lien, encumbrances) o juicios que puedan frenar la venta.' },
    { name: 'Title Insurance (Lender)',     category: 'title',      required: true,  sort_order: 16, notes: 'Requerida por el lender', ai_qa_enabled: true, ai_guidelines: 'Póliza preliminar que asegura el título al banco prestatario. Identifica la compañía que emite el seguro y la cobertura.' },
    { name: 'Title Insurance (Owner)',      category: 'title',      required: false, sort_order: 17, notes: 'Recomendada para el comprador', ai_qa_enabled: true, ai_guidelines: 'Póliza preliminar que asegura el título a favor del comprador futuro.' },

    // Cierre
    { name: 'Proof of Homeowner Insurance', category: 'closing',    required: true,  sort_order: 18, notes: 'Póliza activa antes del cierre', ai_qa_enabled: true, ai_guidelines: 'Identificada a veces como "Hazard Insurance" o póliza de vivienda. Debe contener la declaración del "Premium" anual pagado o a pagar en el cierre.' },
    { name: 'Closing Disclosure (CD)',      category: 'closing',    required: true,  sort_order: 19, notes: 'Se recibe 3 días hábiles antes del cierre', ai_qa_enabled: true, ai_guidelines: 'El documento de 5 páginas llamado "Closing Disclosure". Extrae el "Cash to Close" y comprueba que las cifras coincidan razonablemente con el "Loan Estimate".' },
    { name: 'Final Walkthrough Confirmation', category: 'closing',  required: true,  sort_order: 20, notes: '24-48 hrs antes del cierre', ai_qa_enabled: true, ai_guidelines: 'Documento que firma el comprador indicando que caminó por la propiedad antes de firmar y acepta sus condiciones finales y que las reparaciones pactadas se completaron.' },
    { name: 'Wire Transfer / Cashier Check', category: 'closing',   required: true,  sort_order: 21, notes: 'Fondos para el cierre', ai_qa_enabled: true, ai_guidelines: 'Recibo o confirmación del banco de la transferencia de "Clear to close funds".' },
    { name: 'Settlement Statement (HUD)',    category: 'closing',   required: true,  sort_order: 22, notes: 'Resumen financiero del cierre', ai_qa_enabled: true, ai_guidelines: 'Liquidación ALTA o HUD-1 detallando prorrateos, pagos y desembolsos.' },
  ],

  // ── VENTA DE PROPIEDAD ───────────────────────────────────────────
  sale: [
    { name: 'Listing Agreement',            category: 'contract',   required: true,  sort_order: 1,  notes: 'Contrato de representación del vendedor', ai_qa_enabled: true, ai_guidelines: 'Contrato oficial o "Exclusive Right to Sell". Rechaza si faltan las cláusulas de compensación o vigencia de vencimiento del acuerdo.' },
    { name: 'Seller Disclosure',            category: 'contract',   required: true,  sort_order: 2,  notes: 'Divulgación obligatoria en Kentucky', ai_qa_enabled: true, ai_guidelines: 'Debe ser el formulario de "Seller\'s Property Disclosure". Verifica que todas las páginas estén presentes y tenga las firmas/iniciales del vendedor y el acknowledge del comprador.' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 3,  notes: 'Si construida antes de 1978', ai_qa_enabled: true, ai_guidelines: 'Debe referir sobre la pintura con base de plomo. Es obligatorio verificar firmas de compradores, vendedores y sus respectivos agentes.' },
    { name: 'Contrato de Compra-Venta',     category: 'contract',   required: true,  sort_order: 4,  notes: 'Oferta aceptada por el vendedor', ai_qa_enabled: true, ai_guidelines: 'Rechaza si no es un contrato de compraventa (Purchase Agreement). Debe incluir precio de compra (Purchase Price), el depósito (Earnest Money Deposit o EMD), la dirección de propiedad, y las firmas tanto del comprador como del vendedor.' },
    { name: 'HOA Resale Package',           category: 'contract',   required: false, sort_order: 5,  notes: 'Documentos de HOA si aplica', ai_qa_enabled: true, ai_guidelines: 'Paquete completo de las reglas y presupuestos de la Asociación.' },
    { name: 'Home Inspection Response',     category: 'inspection', required: false, sort_order: 6,  notes: 'Respuesta del vendedor a la inspección del comprador', ai_qa_enabled: true, ai_guidelines: 'Acuerdo en el que el vendedor deniega o acepta reparar ciertos puntos indicados en la inspección.' },
    { name: 'Repair Receipts',              category: 'inspection', required: false, sort_order: 7,  notes: 'Si se acordaron reparaciones', ai_qa_enabled: true, ai_guidelines: 'Facturas pagadas y recibos confirmando que los contratistas arreglaron la propiedad.' },
    { name: 'Title Search Report',          category: 'title',      required: true,  sort_order: 8,  notes: 'Confirmación de título limpio', ai_qa_enabled: true, ai_guidelines: 'Busca un Title Commitment.' },
    { name: 'Mortgage Payoff Statement',    category: 'financial',  required: false, sort_order: 9,  notes: 'Si hay hipoteca activa', ai_qa_enabled: true, ai_guidelines: 'Documento oficial del prestamista del vendedor donde se detalla el saldo total remanente de pagar antes del cierre ("Payoff Amount").' },
    { name: 'Closing Disclosure (CD)',      category: 'closing',    required: true,  sort_order: 10, notes: 'Estado financiero final', ai_qa_enabled: true, ai_guidelines: 'Closing Disclosure oficial (CD).' },
    { name: 'Settlement Statement (HUD)',   category: 'closing',    required: true,  sort_order: 11, notes: 'Resumen del cierre', ai_qa_enabled: true, ai_guidelines: 'Liquidación ALTA o HUD-1 detallando prorrateos, pagos y desembolsos.' },
    { name: 'Deed Transfer Documents',      category: 'closing',    required: true,  sort_order: 12, notes: 'Transferencia legal de título', ai_qa_enabled: true, ai_guidelines: 'Documentos como el "Warranty Deed" (Escritura pública).' },
  ],

  // ── ARRENDAMIENTO ────────────────────────────────────────────────
  lease: [
    { name: 'Lease Agreement',              category: 'contract',   required: true,  sort_order: 1,  notes: 'Contrato de arrendamiento', ai_qa_enabled: true, ai_guidelines: 'Contrato de locación. Rechaza si no hay fecha de vigencia clara, cantidad mensual de renta establecida o la falta de firmas de ambas partes (Landlord y Tenant).' },
    { name: 'Rental Application',           category: 'financial',  required: true,  sort_order: 2,  notes: 'Solicitud del inquilino', ai_qa_enabled: true, ai_guidelines: 'Debe contener los datos biográficos, empleo, e historial de arrendadores anteriores del aplicante.' },
    { name: 'Credit / Background Check',    category: 'financial',  required: true,  sort_order: 3,  notes: 'Verificación de crédito e historial', ai_qa_enabled: true, ai_guidelines: 'Resultado de historial criminal / crediticio. Extrae el Credit Score resultante si lo hubiere.' },
    { name: 'Proof of Income',              category: 'financial',  required: true,  sort_order: 4,  notes: 'Últimos 2 pay stubs o tax returns', ai_qa_enabled: true, ai_guidelines: 'Rechaza si no es evidencia de dinero (Facturas, nominas de W2, Tax Return).' },
    { name: 'Photo ID',                     category: 'contract',   required: true,  sort_order: 5,  notes: 'Identificación del inquilino', ai_qa_enabled: true, ai_guidelines: 'Rechaza si es ilegible. Verifica que sea una identificación gubernamental oficial con fotografía y que no esté vencida.' },
    { name: 'Security Deposit Receipt',     category: 'financial',  required: true,  sort_order: 6,  notes: 'Recibo del depósito de seguridad', ai_qa_enabled: true, ai_guidelines: 'Acuse de recibo explícito de los fondos pagados para respaldar la propiedad.' },
    { name: 'Move-In Inspection Report',    category: 'inspection', required: true,  sort_order: 7,  notes: 'Condición inicial de la propiedad', ai_qa_enabled: true, ai_guidelines: 'Inventario de daños iniciales o reporte de "Move-in Checklist".' },
    { name: 'Lead Paint Disclosure',        category: 'contract',   required: true,  sort_order: 8,  notes: 'Si construida antes de 1978', ai_qa_enabled: true, ai_guidelines: 'Debe referir sobre la pintura con base de plomo. Es obligatorio verificar firmas.' },
    { name: 'HOA Rules (si aplica)',        category: 'contract',   required: false, sort_order: 9,  notes: 'Reglamento de la comunidad', ai_qa_enabled: true, ai_guidelines: 'By-laws y regulaciones de la comunidad a acatarse por el inquilino.' },
    { name: 'Renter\'s Insurance Proof',   category: 'closing',    required: false, sort_order: 10, notes: 'Recomendado para el inquilino', ai_qa_enabled: true, ai_guidelines: 'Prueba de seguro "Renter\'s Policy" indicando límites de cobertura.' },
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
    transaction_id:  transactionId,
    name:            doc.name,
    category:        doc.category,
    status:          'pending',
    required:        doc.required,
    sort_order:      doc.sort_order,
    notes:           doc.notes ?? null,
    ai_qa_enabled:   doc.ai_qa_enabled ?? false,
    ai_guidelines:   doc.ai_guidelines ?? null,
  }));
}

// Categorías con etiquetas en español para la UI
export const DOCUMENT_CATEGORIES = {
  contract:   { label: 'Contrato',       color: '#6366f1', icon: null },
  inspection: { label: 'Inspección',     color: '#f59e0b', icon: null },
  financial:  { label: 'Financiamiento', color: '#10b981', icon: null },
  title:      { label: 'Título',         color: '#3b82f6', icon: null },
  closing:    { label: 'Cierre',         color: '#8b5cf6', icon: null },
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
  closed:           { label: '¡Cerrada!',       step: 4, color: '#10b981' },
  cancelled:        { label: 'Cancelada',        step: -1, color: '#ef4444' },
};
