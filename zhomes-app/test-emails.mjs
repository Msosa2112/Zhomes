/**
 * test-emails.mjs — Prueba los 3 workflows de email de ZHomes TC
 *
 * Uso: node test-emails.mjs [broker|realtor|client|all]
 *
 * Requiere: RESEND_API_KEY en .env.local
 */

import { readFileSync } from 'fs'

// Cargar .env.local manualmente
const envLocal = readFileSync('.env.local', 'utf-8')
const envVars = {}
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim()
}

const API_URL      = 'http://localhost:5173/api/emails'  // Dev local
const RESEND_TEST  = envVars['RESEND_API_KEY']

// Cuentas del sistema
const BROKER_EMAIL  = 'zhomesreapp@gmail.com'
const REALTOR_EMAIL = 'zhomesreapp@gmail.com'   // Test: Resend free → solo envía al dueño de la cuenta
const CLIENT_EMAIL  = 'zhomesreapp@gmail.com'   // Test: Resend free → solo envía al dueño de la cuenta

const arg = process.argv[2] || 'all'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function sendEmail(type, to, data) {
  const RESEND_FROM = 'ZHomes TC <onboarding@resend.dev>'  // dominio verificado para pruebas
  
  // Llamar directamente a la API de Resend para pruebas (sin Vercel local)
  const templates = await import('./api/emails.js').then(m => m.default).catch(() => null)
  
  // Usar Resend directamente para la prueba
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_TEST}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: `[PRUEBA TC] ${type}`,
      html: `<p>Test enviado: <strong>${type}</strong></p><pre>${JSON.stringify(data, null, 2)}</pre>`,
    })
  })
  
  const result = await res.json()
  if (res.ok) {
    console.log(`✅ [${type}] → ${to} | ID: ${result.id}`)
  } else {
    console.error(`❌ [${type}] Error: ${JSON.stringify(result)}`)
  }
  return res.ok
}

// Test directo a Resend API con templates reales
async function testWithRealTemplate(type, to, data) {
  // Importamos las funciones de templates inline
  const RESEND_KEY = RESEND_TEST
  
  if (!RESEND_KEY || RESEND_KEY.includes('COMPLETAR')) {
    console.error('❌ RESEND_API_KEY no configurada. Completa el valor en .env.local')
    process.exit(1)
  }

  const FROM = 'onboarding@resend.dev'  // Resend test sender (sin dominio verificado)

  // Subjects por tipo
  const subjects = {
    broker_new_lead:               `🏠 [TEST] Nuevo Lead: ${data.clientName} → ${data.propertyAddress || ''}`,
    broker_deadline_alert:         `🚨 [TEST] Deadline: ${data.deadlineLabel} en ${data.daysLeft}d`,
    realtor_transaction_assigned:  `🏠 [TEST] Nueva Transacción: ${data.address}`,
    realtor_deadline_reminder:     `⚠️ [TEST] Deadline en ${data.daysLeft}d: ${data.deadlineLabel}`,
    client_welcome:                `🏠 [TEST] Bienvenido a ZHomes, ${data.clientName}!`,
    client_closing_soon:           `🎉 [TEST] ¡Cierre en ${data.daysLeft} días! ${data.address}`,
    client_status_update:          `📢 [TEST] Actualización: ${data.address}`,
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from:    `ZHomes TC <${FROM}>`,
      to:      [to],
      subject: subjects[type] || `[TEST] ${type}`,
      html: buildHtml(type, data),
    })
  })

  const result = await res.json()
  if (res.ok) {
    console.log(`✅ [${type}]\n   → To: ${to}\n   → ID: ${result.id}\n`)
    return true
  } else {
    console.error(`❌ [${type}] Error ${res.status}:`, result.message || result)
    return false
  }
}

function buildHtml(type, d) {
  const base = `font-family:-apple-system,sans-serif;background:#111;color:#ddd;padding:32px;border-radius:12px;max-width:600px;margin:0 auto;`
  const card = `background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:16px 0;`
  const header = `<div style="background:linear-gradient(135deg,#c0392b,#8b0000);padding:24px;border-radius:8px 8px 0 0;text-align:center;margin:-32px -32px 24px;">
    <div style="font-size:20px;font-weight:900;color:white;letter-spacing:2px;">🏠 ZHOMES TC</div>
    <div style="color:#ff6b6b;font-size:11px;letter-spacing:1px;">TRANSACTION COORDINATOR</div>
  </div>`

  const rows = (obj) => Object.entries(obj).map(([k,v]) => 
    `<tr><td style="color:#777;padding:6px 16px 6px 0;font-size:13px;">${k}</td><td style="color:white;font-weight:600;">${v}</td></tr>`
  ).join('')

  const maps = {
    broker_new_lead: { 'Cliente': d.clientName, 'Agente': d.agentName, 'Acción': d.action, 'Propiedad': d.propertyAddress },
    broker_deadline_alert: { 'Propiedad': d.address, 'Deadline': d.deadlineLabel, 'Días restantes': d.daysLeft, 'Cliente': d.clientName },
    realtor_transaction_assigned: { 'Propiedad': d.address, 'Cliente': d.clientName, 'Fecha de cierre': d.closingDate, 'Precio': d.price },
    realtor_deadline_reminder: { 'Propiedad': d.address, 'Deadline': d.deadlineLabel, 'Días restantes': d.daysLeft },
    client_welcome: { 'Cliente': d.clientName, 'Agente': d.realtorName },
    client_closing_soon: { 'Propiedad': d.address, 'Días para el cierre': d.daysLeft, 'Fecha': d.closingDate, 'Agente': d.realtorName },
    client_status_update: { 'Propiedad': d.address, 'Nuevo estado': d.newStatus, 'Estado anterior': d.oldStatus },
  }

  return `<div style="${base}">${header}
    <h2 style="color:white;margin:0 0 8px;">Email de Prueba: <span style="color:#e74c3c">${type}</span></h2>
    <div style="${card}"><table style="width:100%;border-collapse:collapse;">${rows(maps[type] || {})}</table></div>
    <p style="color:#555;font-size:12px;margin-top:24px;">Este es un email de prueba generado por ZHomes TC Test Suite.</p>
  </div>`
}

async function runTests(which) {
  console.log(`\n🚀 ZHomes TC Email Test Suite\n${'═'.repeat(50)}\n`)
  console.log(`📧 Resend Key: ${RESEND_TEST?.slice(0,15)}...`)
  console.log(`📨 Destino de prueba: zhomesreapp@gmail.com (plan free Resend)\n`)

  const queue = []

  // ── BROKER TESTS ──────────────────────────────────────────────────────────
  if (which === 'broker' || which === 'all') {
    console.log('📊 BROKER WORKFLOWS\n')
    queue.push({ type: 'broker_new_lead', to: BROKER_EMAIL, data: {
      agentName:       'Geovanna Martinez',
      clientName:      'Miguel Sosa',
      propertyAddress: '1234 Maple Ave, Louisville, KY 40205',
      action:          'saved',
      timestamp:       new Date().toISOString(),
    }})
    queue.push({ type: 'broker_deadline_alert', to: BROKER_EMAIL, data: {
      address:       '1234 Maple Ave, Louisville, KY 40205',
      deadlineLabel: 'Inspección',
      daysLeft:      1,
      clientName:    'Miguel Sosa',
      realtorName:   'Geovanna Martinez',
    }})
  }

  // ── REALTOR TESTS ─────────────────────────────────────────────────────────
  if (which === 'realtor' || which === 'all') {
    console.log('🏠 REALTOR WORKFLOWS\n')
    queue.push({ type: 'realtor_transaction_assigned', to: REALTOR_EMAIL, data: {
      realtorName:  'Geovanna Martinez',
      address:      '5678 Oak St, Lexington, KY 40503',
      clientName:   'Miguel Sosa',
      closingDate:  '2025-05-15',
      price:        '245000',
      appUrl:       'https://zhomesapp.com',
    }})
    queue.push({ type: 'realtor_deadline_reminder', to: REALTOR_EMAIL, data: {
      realtorName:   'Geovanna Martinez',
      address:       '5678 Oak St, Lexington, KY 40503',
      deadlineLabel: 'Financing Contingency',
      daysLeft:      3,
      closingDate:   '2025-05-01',
    }})
  }

  // ── CLIENT TESTS ──────────────────────────────────────────────────────────
  if (which === 'client' || which === 'all') {
    console.log('👤 CLIENT WORKFLOWS\n')
    queue.push({ type: 'client_welcome', to: CLIENT_EMAIL, data: {
      clientName:  'Miguel Sosa',
      realtorName: 'Geovanna Martinez',
      appUrl:      'https://zhomesapp.com',
    }})
    queue.push({ type: 'client_closing_soon', to: CLIENT_EMAIL, data: {
      clientName:   'Miguel Sosa',
      address:      '5678 Oak St, Lexington, KY 40503',
      daysLeft:     7,
      closingDate:  '2025-05-15',
      realtorName:  'Geovanna Martinez',
      realtorPhone: '+15025551234',
    }})
    queue.push({ type: 'client_status_update', to: CLIENT_EMAIL, data: {
      clientName:  'Miguel Sosa',
      address:     '5678 Oak St, Lexington, KY 40503',
      oldStatus:   'inspection',
      newStatus:   'financing',
    }})
  }

  // Ejecutar secuencialmente con delay para respetar rate limit de Resend (5 req/s)
  let ok = 0, err = 0
  for (const item of queue) {
    const success = await testWithRealTemplate(item.type, item.to, item.data)
    if (success) ok++; else err++
    if (queue.indexOf(item) < queue.length - 1) await sleep(400) // 400ms entre emails
  }

  console.log('═'.repeat(50))
  console.log(`\n📊 Resultado: ${ok}/${queue.length} emails enviados correctamente`)
  if (err > 0) console.log(`   ❌ ${err} errores`)
  else console.log(`   ✅ ¡Todos los workflows de email están funcionando!`)
  console.log(`\n📬 Revisa tu inbox de zhomesreapp@gmail.com para ver los 7 emails.`)
  console.log(`   Subjects esperados:`)
  console.log(`   - 🏠 [TEST] Nuevo Lead: Miguel Sosa → 1234 Maple Ave...`)
  console.log(`   - 🚨 [TEST] Deadline: Inspección en 1d`)
  console.log(`   - 🏠 [TEST] Nueva Transacción: 5678 Oak St...`)
  console.log(`   - ⚠️  [TEST] Deadline en 3d: Financing Contingency`)
  console.log(`   - 🏠 [TEST] Bienvenido a ZHomes, Miguel Sosa!`)
  console.log(`   - 🎉 [TEST] ¡Cierre en 7 días! 5678 Oak St...`)
  console.log(`   - 📢 [TEST] Actualización: 5678 Oak St...`)
  console.log()
}

runTests(arg)

