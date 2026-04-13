/**
 * api/emails.js — ZHomes Email System vía Resend
 *
 * Workflows por rol:
 *   broker  → Nuevo lead asignado | Alerta de deadline | Reporte diario
 *   realtor → Nueva transacción asignada | Recordatorio de deadline | Documento subido
 *   client  → Bienvenida | Cierre próximo | Actualización de estado
 *
 * POST /api/emails
 * Body: { type, data }
 *
 * Tipos:
 *   - broker_new_lead
 *   - broker_deadline_alert
 *   - realtor_transaction_assigned
 *   - realtor_deadline_reminder
 *   - realtor_document_uploaded
 *   - client_welcome
 *   - client_closing_soon
 *   - client_status_update
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = 'ZHomes TC <tc@zhomesapp.com>'
const BROKER_EMAIL   = 'zhomesreapp@gmail.com'

// ── Templates HTML ────────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0a0a0a; color: #e8e8e8; padding: 0; margin: 0;
`
const containerStyle = `
  max-width: 600px; margin: 0 auto; background: #111; 
  border: 1px solid #222; border-radius: 12px; overflow: hidden;
`
const headerStyle = `
  background: linear-gradient(135deg, #c0392b 0%, #8b0000 100%);
  padding: 32px 32px 24px; text-align: center;
`
const bodyStyle = `
  padding: 32px;
`
const footerStyle = `
  background: #0a0a0a; padding: 20px 32px; 
  text-align: center; color: #555; font-size: 12px;
  border-top: 1px solid #222;
`
const badgeStyle = (color) => `
  display: inline-block; background: ${color}22; color: ${color};
  border: 1px solid ${color}44; border-radius: 6px; 
  padding: 4px 12px; font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
`
const cardStyle = `
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
  padding: 20px; margin: 16px 0;
`
const btnStyle = (color='#c0392b') => `
  display: inline-block; background: ${color}; color: white;
  padding: 12px 28px; border-radius: 8px; text-decoration: none;
  font-weight: 700; font-size: 14px; margin-top: 20px;
`

function logo() {
  return `<div style="text-align:center;">
    <img src="https://zhomesapp.com/assets/logo/zhomes-horizontal.png" alt="ZHomes" style="height:36px; display:inline-block; vertical-align:middle; margin-bottom:8px;" />
    <div style="color:#ff6b6b;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Transaction Coordinator</div>
  </div>`
}

function footer() {
  return `<div style="${footerStyle}">
    <p>ZHomes Real Estate · Louisville, KY</p>
    <p>Este es un correo automático del sistema TC. No responder directamente.</p>
    <p style="color:#333;font-size:10px;">© 2025 ZHomes. Todos los derechos reservados.</p>
  </div>`
}

// ── Template: Broker — Nuevo Lead ─────────────────────────────────────────────
function tmpl_broker_new_lead({ agentName, clientName, propertyAddress, action, timestamp }) {
  const actionLabel = action === 'saved' ? '❤️ Guardó' : action === 'viewed' ? '👁️ Vio' : '📋 Contactó'
  const time = timestamp ? new Date(timestamp).toLocaleString('es-US', { timeZone: 'America/Louisville' }) : new Date().toLocaleString('es-US')

  return {
    subject: `🏠 Nuevo Lead: ${clientName} → ${propertyAddress}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <span style="${badgeStyle('#f39c12')}">Nuevo Lead</span>
        <h2 style="color:white;margin:16px 0 8px;">Actividad de lead detectada</h2>
        <p style="color:#aaa;">El agente <strong style="color:white">${agentName}</strong> tiene un nuevo lead potencial.</p>
        <div style="${cardStyle}">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#888;padding:6px 0;width:120px;">Cliente</td><td style="color:white;font-weight:700;">${clientName}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Acción</td><td style="color:#f39c12;font-weight:700;">${actionLabel} propiedad</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Propiedad</td><td style="color:white;">${propertyAddress}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Agente</td><td style="color:white;">${agentName}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Horario</td><td style="color:#aaa;">${time}</td></tr>
          </table>
        </div>
        <p style="color:#aaa;font-size:14px;">Este lead fue encolado automáticamente por el sistema ZHomes TC. Revisa el CRM para hacer seguimiento.</p>
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Broker — Alerta de Deadline ─────────────────────────────────────
function tmpl_broker_deadline_alert({ address, deadlineLabel, daysLeft, clientName, realtorName }) {
  const urgencyColor = daysLeft === 1 ? '#e74c3c' : daysLeft <= 3 ? '#f39c12' : '#3498db'
  const urgencyText  = daysLeft === 1 ? '🚨 URGENTE — 1 DÍA' : daysLeft <= 3 ? '⚠️ PRÓXIMO' : '📋 RECORDATORIO'

  return {
    subject: `${daysLeft === 1 ? '🚨 URGENTE' : '⚠️ Deadline'}: ${deadlineLabel} → ${address}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <span style="${badgeStyle(urgencyColor)}">${urgencyText}</span>
        <h2 style="color:white;margin:16px 0 8px;">Deadline próximo</h2>
        <div style="${cardStyle}">
          <div style="text-align:center;padding:16px 0;">
            <div style="font-size:48px;font-weight:900;color:${urgencyColor};">${daysLeft}</div>
            <div style="color:#aaa;font-size:14px;">día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#888;padding:6px 0;width:120px;">Propiedad</td><td style="color:white;font-weight:700;">${address}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Deadline</td><td style="color:${urgencyColor};font-weight:700;">${deadlineLabel}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Cliente</td><td style="color:white;">${clientName}</td></tr>
            <tr><td style="color:#888;padding:6px 0;">Realtor</td><td style="color:white;">${realtorName || 'No asignado'}</td></tr>
          </table>
        </div>
        <p style="color:#aaa;font-size:14px;">Se ha enviado un recordatorio SMS al realtor automáticamente. Revisa el Deal Room para más detalles.</p>
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Realtor — Transacción Asignada ──────────────────────────────────
function tmpl_realtor_transaction_assigned({ realtorName, address, clientName, closingDate, price, appUrl }) {
  const dateStr = closingDate ? new Date(closingDate).toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Por confirmar'
  const priceStr = price ? `$${Number(price).toLocaleString('en-US')}` : 'Por confirmar'

  return {
    subject: `🏠 Nueva Transacción Asignada: ${address}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <span style="${badgeStyle('#27ae60')}">Nueva Transacción</span>
        <h2 style="color:white;margin:16px 0 8px;">Hola, ${realtorName} 👋</h2>
        <p style="color:#aaa;">ZHomes TC ha abierto una nueva transacción asignada a ti. Aquí están los detalles:</p>
        <div style="${cardStyle}">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#888;padding:8px 0;width:140px;">Propiedad</td><td style="color:white;font-weight:700;">${address}</td></tr>
            <tr><td style="color:#888;padding:8px 0;">Cliente</td><td style="color:white;">${clientName}</td></tr>
            <tr><td style="color:#888;padding:8px 0;">Precio</td><td style="color:#27ae60;font-weight:700;">${priceStr}</td></tr>
            <tr><td style="color:#888;padding:8px 0;">Fecha de cierre</td><td style="color:#f39c12;font-weight:700;">${dateStr}</td></tr>
          </table>
        </div>
        <p style="color:#aaa;font-size:14px;">Ingresa al Deal Room para ver el checklist de documentos, el chat y los próximos pasos.</p>
        ${appUrl ? `<a href="${appUrl}" style="${btnStyle()}">Ver Deal Room →</a>` : ''}
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Realtor — Recordatorio Deadline ─────────────────────────────────
function tmpl_realtor_deadline_reminder({ realtorName, address, deadlineLabel, daysLeft, closingDate }) {
  const urgColor = daysLeft === 1 ? '#e74c3c' : daysLeft <= 3 ? '#f39c12' : '#3498db'
  const dateStr  = closingDate ? new Date(closingDate).toLocaleDateString('es-US', { month: 'long', day: 'numeric' }) : ''

  return {
    subject: `${daysLeft === 1 ? '🚨' : '⚠️'} Deadline en ${daysLeft}d: ${deadlineLabel} → ${address}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <h2 style="color:white;margin:0 0 16px;">Hola, ${realtorName}</h2>
        <p style="color:#aaa;">Este es un recordatorio automático del sistema ZHomes TC:</p>
        <div style="${cardStyle};border-left: 4px solid ${urgColor};">
          <p style="margin:0;color:${urgColor};font-weight:700;font-size:18px;">
            ${deadlineLabel} vence en <span style="font-size:28px;">${daysLeft}</span> día${daysLeft !== 1 ? 's' : ''}
          </p>
          <p style="margin:8px 0 0;color:#aaa;">Propiedad: <strong style="color:white">${address}</strong>${dateStr ? ` · ${dateStr}` : ''}</p>
        </div>
        <p style="color:#aaa;font-size:14px;">Toma acción hoy para evitar penalidades. Si necesitas una extensión, contacta a Gilbert inmediatamente.</p>
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Client — Bienvenida ─────────────────────────────────────────────
function tmpl_client_welcome({ clientName, realtorName, appUrl }) {
  return {
    subject: `🏠 Bienvenido a ZHomes, ${clientName.split(' ')[0]}!`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <h2 style="color:white;margin:0 0 16px;">Hola, ${clientName} 👋</h2>
        <p style="color:#aaa;">¡Bienvenido a ZHomes! Tu agente <strong style="color:white">${realtorName}</strong> está listo para acompañarte en el proceso de compra.</p>
        <div style="${cardStyle}">
          <h3 style="color:white;margin:0 0 12px;">¿Qué sigue?</h3>
          <p style="color:#aaa;margin:8px 0;">✅ Tu perfil fue creado en nuestro sistema</p>
          <p style="color:#aaa;margin:8px 0;">🔍 Ya puedes explorar propiedades en la app</p>
          <p style="color:#aaa;margin:8px 0;">💬 Contacta a tu agente directamente por WhatsApp</p>
          <p style="color:#aaa;margin:8px 0;">📱 Descarga la app de ZHomes para seguimiento en tiempo real</p>
        </div>
        ${appUrl ? `<a href="${appUrl}" style="${btnStyle()}">Explorar propiedades →</a>` : ''}
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Client — Cierre Próximo ─────────────────────────────────────────
function tmpl_client_closing_soon({ clientName, address, daysLeft, closingDate, realtorName, realtorPhone }) {
  const dateStr = closingDate ? new Date(closingDate).toLocaleDateString('es-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return {
    subject: `🎉 ¡Tu cierre se acerca! ${address} — ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <h2 style="color:white;margin:0 0 8px;">¡${clientName.split(' ')[0]}, casi es tuya! 🎉</h2>
        <p style="color:#aaa;">Tu cierre en <strong style="color:white">${address}</strong> está a solo ${daysLeft} día${daysLeft !== 1 ? 's' : ''} de distancia.</p>
        <div style="${cardStyle};text-align:center;">
          <div style="font-size:56px;font-weight:900;color:#27ae60;">${daysLeft}</div>
          <div style="color:#aaa;margin-top:4px;">día${daysLeft !== 1 ? 's' : ''} para el cierre</div>
          <div style="color:white;font-weight:700;margin-top:12px;">${dateStr}</div>
        </div>
        <div style="${cardStyle}">
          <h3 style="color:white;margin:0 0 12px;">📋 Asegúrate de tener listo:</h3>
          <p style="color:#aaa;margin:6px 0;">💵 Fondos de cierre (cashier's check o wire transfer)</p>
          <p style="color:#aaa;margin:6px 0;">🪪 Identificación oficial con foto</p>
          <p style="color:#aaa;margin:6px 0;">📋 Cualquier documento pendiente solicitado</p>
          <p style="color:#aaa;margin:6px 0;">🚗 Llegar puntual a la closing table</p>
        </div>
        ${realtorPhone ? `<p style="color:#aaa;font-size:14px;">¿Preguntas? Escríbele directamente a ${realtorName}: <strong style="color:white">${realtorPhone}</strong></p>` : ''}
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Template: Client — Actualización de Estado ────────────────────────────────
function tmpl_client_status_update({ clientName, address, oldStatus, newStatus }) {
  const statusLabels = {
    contract_signed: '📝 Contrato firmado',
    inspection:      '🔍 En inspección',
    appraisal:       '📊 Tasación (Appraisal)',
    financing:       '🏦 Aprobación de financiamiento',
    pre_close:       '✅ Pre-cierre — ¡casi listo!',
    closed:          '🎉 ¡CERRADO! — ¡Felicidades!',
  }

  const newLabel   = statusLabels[newStatus] || newStatus
  const isClosing  = newStatus === 'closed'
  const accentColor = isClosing ? '#27ae60' : '#3498db'

  return {
    subject: `📢 Actualización: Tu transacción de ${address}`,
    html: `<div style="${baseStyle}"><div style="${containerStyle}">
      <div style="${headerStyle}">${logo()}</div>
      <div style="${bodyStyle}">
        <span style="${badgeStyle(accentColor)}">Actualización de Estado</span>
        <h2 style="color:white;margin:16px 0 8px;">
          ${isClosing ? `¡${clientName.split(' ')[0]}, lo lograste! 🎉` : `Hola, ${clientName.split(' ')[0]}`}
        </h2>
        <p style="color:#aaa;">Tu transacción de <strong style="color:white">${address}</strong> ha avanzado:</p>
        <div style="${cardStyle};text-align:center;">
          <div style="color:#555;font-size:13px;margin-bottom:8px;">NUEVO ESTADO</div>
          <div style="font-size:22px;font-weight:700;color:${accentColor};">${newLabel}</div>
          ${isClosing ? `<p style="color:#aaa;margin-top:16px;">¡Bienvenido a tu nuevo hogar! Ha sido un placer acompañarte en este proceso. 🏡</p>` : ''}
        </div>
        <p style="color:#aaa;font-size:14px;">Si tienes preguntas sobre este cambio, contacta a tu agente o responde a este correo.</p>
      </div>
      ${footer()}
    </div></div>`
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })

  if (!RESEND_API_KEY) {
    console.error('[Emails] RESEND_API_KEY no configurada')
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada en variables de entorno' })
  }

  const { type, to, data = {} } = req.body

  if (!type || !to) {
    return res.status(400).json({ error: 'type y to son requeridos' })
  }

  // Seleccionar template según tipo
  let emailContent
  try {
    switch (type) {
      case 'broker_new_lead':
        emailContent = tmpl_broker_new_lead(data); break
      case 'broker_deadline_alert':
        emailContent = tmpl_broker_deadline_alert(data); break
      case 'realtor_transaction_assigned':
        emailContent = tmpl_realtor_transaction_assigned(data); break
      case 'realtor_deadline_reminder':
        emailContent = tmpl_realtor_deadline_reminder(data); break
      case 'client_welcome':
        emailContent = tmpl_client_welcome(data); break
      case 'client_closing_soon':
        emailContent = tmpl_client_closing_soon(data); break
      case 'client_status_update':
        emailContent = tmpl_client_status_update(data); break
      default:
        return res.status(400).json({ error: `Tipo de email desconocido: ${type}` })
    }
  } catch (err) {
    return res.status(400).json({ error: `Error generando template: ${err.message}` })
  }

  // Enviar via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      Array.isArray(to) ? to : [to],
        subject: emailContent.subject,
        html:    emailContent.html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[Resend] Error:', result)
      return res.status(response.status).json({ error: result.message || 'Error enviando email', details: result })
    }

    console.log(`[Emails] ✅ Enviado: ${type} → ${to} | ID: ${result.id}`)
    return res.status(200).json({ success: true, id: result.id, type, to })

  } catch (err) {
    console.error('[Emails] Error Resend:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
