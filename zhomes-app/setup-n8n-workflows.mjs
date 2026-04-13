/**
 * setup-n8n-workflows.mjs
 * 
 * Crea los 3 workflows de email en N8N via REST API.
 * Requiere N8N_API_KEY en .env.local (obtener desde N8N Settings → API Keys)
 * 
 * Uso: node setup-n8n-workflows.mjs
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

const N8N_BASE = 'https://n8n-production-cfe9c.up.railway.app'
const N8N_API_KEY = envVars['N8N_API_KEY']
const RESEND_API_KEY = envVars['RESEND_API_KEY']

if (!N8N_API_KEY) {
  console.error(`
❌ N8N_API_KEY no encontrada en .env.local

Para obtenerla:
1. Abre https://n8n-production-cfe9c.up.railway.app
2. Settings (menú inferior izquierdo) → API
3. Click "Create an API key"
4. Copia la key y agrégala al .env.local:
   N8N_API_KEY=tu_key_aqui

Luego ejecuta de nuevo: node setup-n8n-workflows.mjs
  `)
  process.exit(1)
}

// ─── Definición de los workflows ─────────────────────────────────────────────

function makeWorkflow(name, webhookPath) {
  return {
    name,
    active: true,
    nodes: [
      {
        id: `webhook-${webhookPath}`,
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          httpMethod: "POST",
          path: webhookPath,
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: `http-${webhookPath}`,
        name: "Send Email via Resend",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [500, 300],
        parameters: {
          method: "POST",
          url: "https://api.resend.com/emails",
          authentication: "genericCredentialType",
          genericAuthType: "httpHeaderAuth",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: `Bearer ${RESEND_API_KEY}`
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: `={
  "from": "ZHomes TC <onboarding@resend.dev>",
  "to": [{{ $json.to }}],
  "subject": "{{ $json.subject }}",
  "html": "{{ $json.html }}"
}`,
          options: {}
        }
      },
      {
        id: `respond-${webhookPath}`,
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [750, 300],
        parameters: {
          respondWith: "json",
          responseBody: `={
  "success": true,
  "id": "{{ $json.id }}",
  "email_type": "{{ $('Webhook').item.json.type }}"
}`
        }
      }
    ],
    connections: {
      "Webhook": {
        main: [[{
          node: "Send Email via Resend",
          type: "main",
          index: 0
        }]]
      },
      "Send Email via Resend": {
        main: [[{
          node: "Respond to Webhook",
          type: "main",
          index: 0
        }]]
      }
    },
    settings: {
      executionOrder: "v1"
    },
    tags: ["zhomes", "tc", "emails"]
  }
}

const WORKFLOWS = [
  { name: "TC - Broker Email Alerts",  path: "tc-broker-email" },
  { name: "TC - Realtor Email Alerts", path: "tc-realtor-email" },
  { name: "TC - Client Email Alerts",  path: "tc-client-email" },
]

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function n8nRequest(method, endpoint, body) {
  const res = await fetch(`${N8N_BASE}/api/v1${endpoint}`, {
    method,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`N8N ${method} ${endpoint} → ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function getExistingWorkflows() {
  const data = await n8nRequest('GET', '/workflows?limit=50')
  return data.data || []
}

async function createOrUpdateWorkflow(wf) {
  const existing = await getExistingWorkflows()
  const found = existing.find(w => w.name === wf.name)

  if (found) {
    console.log(`   ⚡ Actualizando workflow existente: "${wf.name}" (ID: ${found.id})`)
    const updated = await n8nRequest('PATCH', `/workflows/${found.id}`, wf)
    // Activar
    await n8nRequest('POST', `/workflows/${found.id}/activate`)
    return updated.id || found.id
  } else {
    console.log(`   📦 Creando nuevo workflow: "${wf.name}"`)
    const created = await n8nRequest('POST', '/workflows', wf)
    // Activar
    await n8nRequest('POST', `/workflows/${created.id}/activate`)
    return created.id
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 ZHomes N8N Workflow Setup\n${'═'.repeat(50)}\n`)
  console.log(`📡 N8N: ${N8N_BASE}`)
  console.log(`📧 Resend: ${RESEND_API_KEY?.slice(0,12)}...\n`)

  const results = []

  for (const wf of WORKFLOWS) {
    try {
      const id = await createOrUpdateWorkflow(makeWorkflow(wf.name, wf.path))
      const url = `${N8N_BASE}/webhook/${wf.path}`
      results.push({ name: wf.name, id, url, ok: true })
      console.log(`   ✅ Activado: ${url}\n`)
    } catch (err) {
      console.error(`   ❌ Error en "${wf.name}": ${err.message}\n`)
      results.push({ name: wf.name, ok: false, error: err.message })
    }
  }

  console.log('═'.repeat(50))
  console.log('\n📋 Resumen de Webhooks:\n')
  for (const r of results) {
    if (r.ok) {
      console.log(`  ✅ ${r.name}`)
      console.log(`     → ${r.url}`)
    } else {
      console.log(`  ❌ ${r.name}: ${r.error}`)
    }
  }

  const allOk = results.every(r => r.ok)
  if (allOk) {
    console.log(`\n✨ ¡Todos los workflows están activos! Agrega al .env.local:`)
    console.log(``)
    console.log(`N8N_TC_BROKER_EMAIL_URL=${N8N_BASE}/webhook/tc-broker-email`)
    console.log(`N8N_TC_REALTOR_EMAIL_URL=${N8N_BASE}/webhook/tc-realtor-email`)
    console.log(`N8N_TC_CLIENT_EMAIL_URL=${N8N_BASE}/webhook/tc-client-email`)
  }
  console.log()
}

main().catch(err => {
  console.error('Error fatal:', err.message)
  process.exit(1)
})
