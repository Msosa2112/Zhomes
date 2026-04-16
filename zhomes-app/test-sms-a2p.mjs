import { config } from 'dotenv'
config({ path: '.env' })

import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken  = process.env.TWILIO_AUTH_TOKEN
const apiKey     = process.env.TWILIO_API_KEY
const apiSecret  = process.env.TWILIO_API_SECRET
const msid       = process.env.TWILIO_MESSAGING_SERVICE_SID
const TO         = '+15026587853'

console.log('─────────────────────────────────────')
console.log('ZHomes A2P SMS Test')
console.log('─────────────────────────────────────')
console.log('Account SID:', accountSid?.slice(0, 10) + '...')
console.log('Messaging Service SID:', msid)
console.log('Destino:', TO)
console.log('')

if (!accountSid || !msid) {
  console.error('❌ Faltan TWILIO_ACCOUNT_SID o TWILIO_MESSAGING_SERVICE_SID en .env.local')
  process.exit(1)
}

// Preferimos API Key si existe, sino Auth Token
const client = (apiKey && apiSecret)
  ? twilio(apiKey, apiSecret, { accountSid })
  : twilio(accountSid, authToken)

try {
  // Test 1: test_ping básico
  console.log('Enviando test_ping via Messaging Service A2P...')
  const msg = await client.messages.create({
    messagingServiceSid: msid,
    to: TO,
    body: 'ZHomes: Sistema activo. Campaña A2P verificada. Reply STOP to opt out.'
  })
  console.log('✅ Enviado!')
  console.log('   SID:    ', msg.sid)
  console.log('   Status: ', msg.status)
  console.log('   From:   ', msg.from || '(asignado por Messaging Service)')
  
} catch (err) {
  console.error('❌ Error:', err.message)
  console.error('   Code:', err.code)
  console.error('   Status:', err.status)
  
  // Diagnóstico según código de error
  if (err.code === 21610) console.error('   → Número en lista STOP/blocklist de Twilio')
  if (err.code === 21614) console.error('   → Número no es SMS-capable')
  if (err.code === 21408) console.error('   → Permiso denegado para este país/región')
  if (err.code === 63038) console.error('   → Messaging Service no tiene números activos asignados')
  if (err.code === 21617) console.error('   → Mensaje demasiado largo')
}
