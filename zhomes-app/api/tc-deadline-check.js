/**
 * ZHomes TC — Fase 4: Deadline Tracker
 * GET /api/tc-deadline-check  (llamado por Vercel Cron cada mañana a las 9am)
 *
 * Lógica:
 * 1. Lee todas las transacciones activas con deadlines próximos.
 * 2. Calcula urgencia: 1 día, 3 días, 7 días.
 * 3. Para cada urgencia, dispara un webhook a N8N que envía SMS via Twilio.
 * 4. Registra cada alerta disparada en tc_events para el Reporte IA del Broker.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const N8N_WEBHOOK = process.env.N8N_TC_WEBHOOK_URL // p.ej: https://n8n.zhomesreapp.com/webhook/tc-sms-alert

// ── Tipos de deadline a revisar ──────────────────────────────────────────────
const DEADLINE_CHECKS = [
  {
    field:    'inspection_deadline',
    label:    'Inspección',
    urgency:  [1, 3, 7],
  },
  {
    field:    'financing_deadline',
    label:    'Financing Contingency',
    urgency:  [1, 3, 5],
  },
  {
    field:    'appraisal_deadline',
    label:    'Tasación (Appraisal)',
    urgency:  [1, 3, 5],
  },
  {
    field:    'closing_date',
    label:    'Cierre',
    urgency:  [1, 3, 7],
  },
]

// ── Mensajes SMS por tipo ─────────────────────────────────────────────────────
function buildSmsMessage({ type, address, deadlineLabel, daysLeft, closingDate }) {
  const dateStr = closingDate
    ? new Date(closingDate).toLocaleDateString('es-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  if (type === 'realtor') {
    if (daysLeft === 1) {
      return `🚨 ZHomes TC: MAÑANA vence el deadline de ${deadlineLabel} para ${address}. Confirma estado inmediatamente.`
    }
    if (daysLeft <= 3) {
      return `⚠️ ZHomes TC: El deadline de ${deadlineLabel} para ${address} vence en ${daysLeft} días (${dateStr}). Actúa hoy.`
    }
    return `📋 ZHomes TC: Recordatorio — el deadline de ${deadlineLabel} para ${address} vence en ${daysLeft} días (${dateStr}).`
  }

  if (type === 'client') {
    if (daysLeft === 1) {
      return `🏠 ZHomes: ¡Mañana es el gran día! Tu cierre de ${address} es mañana (${dateStr}). Confirma con tu agente que todo está listo.`
    }
    if (daysLeft <= 7) {
      return `🏠 ZHomes: ¡Tu cierre se acerca! ${address} cierra el ${dateStr} (en ${daysLeft} días). Si tienes preguntas, responde este mensaje.`
    }
    return null // No molestar al cliente con alertas tempranas de etapas intermedias
  }

  return null
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Solo GET — el cron de Vercel usa GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Verificar que proviene del cron de Vercel (cabecera de seguridad)
  const cronSecret = req.headers['x-vercel-cron-signature'] || req.query.secret
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results = {
    checked:  0,
    alerts:   [],
    sms_sent: 0,
    errors:   [],
  }

  try {
    // 1. Traer todas las transacciones activas con sus deadlines y datos de contacto
    const { data: transactions, error } = await supabase
      .from('tc_transactions')
      .select('id, address, client_name, client_phone, client_email, realtor_id, inspection_deadline, financing_deadline, appraisal_deadline, closing_date, status')
      .not('status', 'in', '("closed","cancelled")')
      .order('closing_date', { ascending: true })

    if (error) throw error

    results.checked = transactions.length

    // 2. Para cada transacción, revisar cada tipo de deadline
    for (const tx of transactions) {
      for (const deadline of DEADLINE_CHECKS) {
        const deadlineDate = tx[deadline.field]
        if (!deadlineDate) continue

        const dDate = new Date(deadlineDate)
        dDate.setHours(0, 0, 0, 0)
        const daysLeft = Math.round((dDate - today) / 86400000)

        // Solo alertar si está en la lista de urgencias Y no ha pasado
        if (!deadline.urgency.includes(daysLeft) || daysLeft < 0) continue

        const alertKey = `${tx.id}_${deadline.field}_${daysLeft}`

        // Verificar que no ya enviamos esta alerta hoy (evitar duplicados)
        const { data: existing } = await supabase
          .from('tc_events')
          .select('id')
          .eq('transaction_id', tx.id)
          .eq('event_type', 'deadline_approaching')
          .like('description', `%${deadline.label}%${daysLeft}%`)
          .gte('created_at', today.toISOString())
          .limit(1)

        if (existing?.length > 0) continue // Ya enviada hoy

        // 3. Registrar el evento en tc_events
        await supabase.from('tc_events').insert({
          transaction_id: tx.id,
          event_type:     'deadline_approaching',
          description:    `${deadline.label} vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para ${tx.address}`,
          due_date:       deadlineDate,
          is_alert:       true,
          is_resolved:    false,
          metadata: {
            deadline_field: deadline.field,
            days_left:      daysLeft,
            deadline_label: deadline.label,
          },
        })

        // 4. Obtener teléfono del Realtor desde auth.users
        let realtorPhone = null, realtorEmail = null, realtorName = 'Agente'
        if (tx.realtor_id) {
          const { data: realtorData } = await supabase.auth.admin.getUserById(tx.realtor_id)
          realtorPhone = realtorData?.user?.user_metadata?.phone
          realtorEmail = realtorData?.user?.email
          realtorName = realtorData?.user?.user_metadata?.first_name || 'Agente'
        }

        // 5. Enviar SMS al Realtor
        const realtorMsg = buildSmsMessage({
          type: 'realtor',
          address: tx.address,
          deadlineLabel: deadline.label,
          daysLeft,
          closingDate: deadlineDate,
        })

        if (realtorMsg && realtorPhone && N8N_WEBHOOK) {
          await sendSmsViaN8N({
            to:          realtorPhone,
            message:     realtorMsg,
            transaction: tx.id,
            type:        'realtor_deadline_alert',
          })
          results.sms_sent++
        }

        // Email al Broker
        await sendEmailViaInternalApi(req, {
          type: 'broker_deadline_alert',
          to: 'zhomesreapp@gmail.com',
          data: {
            address: tx.address,
            deadlineLabel: deadline.label,
            daysLeft,
            clientName: tx.client_name,
            realtorName: realtorName
          }
        })

        // Email al Realtor
        if (realtorEmail) {
          await sendEmailViaInternalApi(req, {
            type: 'realtor_deadline_reminder',
            to: realtorEmail,
            data: {
              realtorName: realtorName,
              address: tx.address,
              deadlineLabel: deadline.label,
              daysLeft,
              closingDate: deadlineDate
            }
          })
        }

        // 6. Enviar SMS al Cliente (solo en cierre próximo)
        if (deadline.field === 'closing_date' && tx.client_phone) {
          const clientMsg = buildSmsMessage({
            type: 'client',
            address: tx.address,
            deadlineLabel: deadline.label,
            daysLeft,
            closingDate: deadlineDate,
          })

          if (clientMsg && N8N_WEBHOOK) {
            await sendSmsViaN8N({
              to:          tx.client_phone,
              message:     clientMsg,
              transaction: tx.id,
              type:        'client_closing_alert',
            })
            results.sms_sent++
          }

          if (tx.client_email) {
            await sendEmailViaInternalApi(req, {
              type: 'client_closing_soon',
              to: tx.client_email,
              data: {
                clientName: tx.client_name,
                address: tx.address,
                daysLeft,
                closingDate: deadlineDate,
                realtorName: realtorName,
                realtorPhone: realtorPhone || ''
              }
            })
          }
        }

        // Registrar SMS enviado en log
        await supabase.from('tc_events').insert({
          transaction_id: tx.id,
          event_type:     'sms_sent',
          description:    `SMS enviado: ${deadline.label} en ${daysLeft}d para ${tx.address}`,
          is_alert:       false,
          metadata: {
            days_left:      daysLeft,
            deadline_label: deadline.label,
            sms_realtor:    !!realtorPhone,
            sms_client:     !!(deadline.field === 'closing_date' && tx.client_phone),
          },
        })

        results.alerts.push({
          transaction: tx.address,
          deadline:    deadline.label,
          days_left:   daysLeft,
        })
      }
    }

    // 7. Mensaje en chat del sistema para alertas críticas (1 día)
    const criticalAlerts = results.alerts.filter((a) => a.days_left === 1)
    for (const alert of criticalAlerts) {
      const tx = transactions.find((t) => t.address === alert.transaction)
      if (!tx) continue
      await supabase.from('tc_messages').insert({
        transaction_id: tx.id,
        sender_name:    'ZHomes TC Sistema',
        sender_role:    'system',
        content:        `🚨 ALERTA CRÍTICA: El deadline de ${alert.deadline} vence MAÑANA. Se envió SMS al realtor.`,
        message_type:   'alert',
      })
    }

    console.log(`[TC Deadline Check] Completado: ${results.checked} transacciones, ${results.alerts.length} alertas, ${results.sms_sent} SMS.`)

    return res.status(200).json({
      success:      true,
      date:         today.toISOString(),
      transactions: results.checked,
      alerts:       results.alerts.length,
      sms_sent:     results.sms_sent,
      details:      results.alerts,
    })

  } catch (err) {
    console.error('[TC Deadline Check] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ── Helper: Enviar SMS via N8N webhook ────────────────────────────────────────
async function sendSmsViaN8N({ to, message, transaction, type }) {
  try {
    const response = await fetch(N8N_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        message,
        transaction_id: transaction,
        sms_type:       type,
        source:         'zhomes_tc_cron',
        timestamp:      new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.error(`[TC SMS] N8N error para ${to}: ${response.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`[TC SMS] Error enviando a ${to}:`, err.message)
    return false
  }
}

// ── Helper: Enviar Email via Internal API ──────────────────────────────────────
async function sendEmailViaInternalApi(req, payload) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers.host || 'zhomesapp.com'
    const url = `${protocol}://${host}/api/emails`
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error(`[TC Email] Error HTTP ${res.status}`)
  } catch (err) {
    console.error(`[TC Email] Error:`, err.message)
  }
}
