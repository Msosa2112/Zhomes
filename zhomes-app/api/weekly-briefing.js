/**
 * /api/weekly-briefing.js
 * 
 * Cron endpoint — ejecuta cada lunes a las 9am (America/New_York)
 * Genera un briefing semanal ejecutivo con GPT-4o y lo envía por email
 * al broker (Gilbert) con: transacciones activas, deadlines de la semana,
 * documentos pendientes, y el mejor realtor de la semana.
 * 
 * Protegido por CRON_SECRET — solo Vercel Cron puede llamarlo.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { buildEmailHtml } from './_email-brand.js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const resend  = new Resend(process.env.RESEND_API_KEY)

const BROKER_EMAIL = 'zhomesreapp@gmail.com'
const BROKER_NAME  = 'Gilbert Zaldivar'

// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth: solo Vercel Cron con CRON_SECRET
  const secret = req.headers['authorization']?.replace('Bearer ', '').trim()
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const now    = new Date()
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // ── 1. Traer datos de Supabase ────────────────────────────
    const [txRes, eventsRes, docsRes] = await Promise.all([
      supabase
        .from('tc_transactions')
        .select('id, address, status, closing_date, client_name, realtor_name, price')
        .in('status', ['active', 'under_contract', 'pending'])
        .order('closing_date', { ascending: true }),

      supabase
        .from('tc_events')
        .select('transaction_id, event_type, created_at, tc_transactions(address)')
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('tc_documents')
        .select('id, document_name, status, transaction_id, tc_transactions(address, realtor_name)')
        .in('status', ['uploaded', 'pending_review', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const transactions = txRes.data || []
    const events       = eventsRes.data || []
    const pendingDocs  = docsRes.data || []

    // Deadlines en los próximos 7 días
    const upcomingDeadlines = transactions.filter(tx => {
      if (!tx.closing_date) return false
      const closing = new Date(tx.closing_date)
      return closing >= now && closing <= sevenDaysAhead
    })

    // Conteo por realtor (de eventos de esta semana)
    const realtorActivity = {}
    events.forEach(e => {
      const name = e.tc_transactions?.address || 'Unknown'
      realtorActivity[name] = (realtorActivity[name] || 0) + 1
    })
    const topRealtor = Object.entries(realtorActivity)
      .sort((a, b) => b[1] - a[1])[0]

    // ── 2. Generar briefing con GPT-4o ───────────────────────
    const dataSnapshot = {
      totalActive: transactions.length,
      upcomingClosings: upcomingDeadlines.map(tx => ({
        address: tx.address,
        client: tx.client_name,
        realtor: tx.realtor_name,
        closingDate: tx.closing_date,
        price: tx.price ? `$${Number(tx.price).toLocaleString()}` : 'N/A',
        daysLeft: Math.ceil((new Date(tx.closing_date) - now) / (1000 * 60 * 60 * 24))
      })),
      pendingDocuments: pendingDocs.slice(0, 5).map(d => ({
        name: d.document_name,
        status: d.status,
        address: d.tc_transactions?.address,
        realtor: d.tc_transactions?.realtor_name
      })),
      weeklyEventCount: events.length,
      topActiveProperty: topRealtor ? topRealtor[0] : 'N/A',
    }

    const prompt = `Eres el asistente ejecutivo de ${BROKER_NAME}, broker de ZHomes Real Estate en Louisville, KY.
    
Genera un briefing ejecutivo semanal en ESPAÑOL para el correo del lunes por la mañana.
Usa el siguiente snapshot de datos reales:

${JSON.stringify(dataSnapshot, null, 2)}

El briefing debe:
1. Empezar con un saludo cálido y profesional
2. Resumir el estado del pipeline (transacciones activas, cierres próximos)  
3. Destacar los deadlines urgentes de esta semana con fechas específicas
4. Mencionar documentos pendientes de revisión
5. Una frase motivacional corta al final

Formato: párrafos cortos, profesional, en español. Sin listas largas — usa prosa ejecutiva.
Máximo 300 palabras.`

    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const briefingText = aiRes.choices[0]?.message?.content || 'No se pudo generar el briefing.'

    // ── 3. Construir email HTML ───────────────────────────────
    const weekStr = now.toLocaleDateString('es-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/New_York'
    })

    const statsRows = [
      { label: 'Transacciones Activas', value: transactions.length },
      { label: 'Cierres Esta Semana', value: upcomingDeadlines.length },
      { label: 'Documentos Pendientes', value: pendingDocs.length },
      { label: 'Eventos (últimos 7 días)', value: events.length },
    ]

    const statsHtml = statsRows.map(s => `
      <div style="display:inline-block;text-align:center;padding:16px 24px;margin:8px;background:#f8f8f8;border-radius:12px;min-width:120px;">
        <div style="font-size:28px;font-weight:700;color:#E31E24;">${s.value}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px;">${s.label}</div>
      </div>
    `).join('')

    const deadlineHtml = upcomingDeadlines.length > 0
      ? `<h3 style="color:#E31E24;margin-top:24px;">⚠️ Cierres Esta Semana</h3>
         <table style="width:100%;border-collapse:collapse;">
           <thead><tr style="background:#f8f8f8;">
             <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">Propiedad</th>
             <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">Cliente</th>
             <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">Cierre</th>
             <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6B7280;">Días</th>
           </tr></thead>
           <tbody>
             ${upcomingDeadlines.map(tx => `
               <tr style="border-bottom:1px solid #f0f0f0;">
                 <td style="padding:8px 12px;font-size:13px;">${tx.address || 'N/A'}</td>
                 <td style="padding:8px 12px;font-size:13px;">${tx.client_name || 'N/A'}</td>
                 <td style="padding:8px 12px;font-size:13px;">${tx.closing_date || 'N/A'}</td>
                 <td style="padding:8px 12px;font-size:13px;font-weight:bold;color:${
                   Math.ceil((new Date(tx.closing_date) - now) / (1000 * 60 * 60 * 24)) <= 3 ? '#E31E24' : '#10B981'
                 };">${Math.ceil((new Date(tx.closing_date) - now) / (1000 * 60 * 60 * 24))} días</td>
               </tr>`).join('')}
           </tbody>
         </table>`
      : '<p style="color:#6B7280;font-style:italic;">No hay cierres programados esta semana.</p>'

    const bodyHtml = `
      <h2 style="color:#1a1a2e;margin:0 0 4px;">Briefing Semanal del Lunes</h2>
      <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">${weekStr}</p>
      
      <div style="text-align:center;margin-bottom:24px;">
        ${statsHtml}
      </div>
      
      <div style="border-left:4px solid #E31E24;padding:16px 20px;background:#fff9f9;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#E31E24;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Resumen IA de la Semana</h3>
        <div style="font-size:15px;line-height:1.6;color:#374151;white-space:pre-line;">${briefingText}</div>
      </div>
      
      ${deadlineHtml}
      
      ${pendingDocs.length > 0 ? `
        <h3 style="color:#1a1a2e;margin-top:24px;">📄 Documentos Pendientes (${pendingDocs.length})</h3>
        ${pendingDocs.slice(0, 5).map(d => `
          <div style="padding:10px 14px;margin:6px 0;background:#f8f8f8;border-radius:8px;display:flex;justify-content:space-between;">
            <span style="font-size:13px;">${d.document_name} — <em>${d.tc_transactions?.address || 'N/A'}</em></span>
            <span style="font-size:12px;color:${d.status === 'rejected' ? '#E31E24' : '#F59E0B'};font-weight:600;">${d.status}</span>
          </div>`).join('')}
      ` : ''}
    `

    const emailHtml = buildEmailHtml(`Briefing Semanal — ${weekStr}`, bodyHtml)

    // ── 4. Enviar email ───────────────────────────────────────
    await resend.emails.send({
      from: 'ZHomes <noreply@zhomesreapp.com>',
      to:   [BROKER_EMAIL],
      subject: `📊 Tu Briefing del Lunes — ${transactions.length} transacciones activas`,
      html:  emailHtml,
    })

    return res.status(200).json({
      sent: true,
      transactions: transactions.length,
      deadlines: upcomingDeadlines.length,
      pendingDocs: pendingDocs.length,
    })

  } catch (err) {
    console.error('[weekly-briefing]', err)
    return res.status(500).json({ error: err.message })
  }
}
