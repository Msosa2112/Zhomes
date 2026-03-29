/**
 * ZHomes - Status Refresh Script
 * 
 * Queries Supabase for all property IDs (ListingKey),
 * fetches their current MlsStatus from Spark in batches,
 * and updates Supabase only where the status changed.
 * 
 * Usage: node scripts/refresh-status.mjs
 */

const SUPABASE_URL = 'https://elhqcwpqbnxafaepmswl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4'
const SPARK_BASE   = 'https://replication.sparkapi.com/Version/3/Reso/OData'
const TOKENS       = [
  '6ojczz7todkepnsvryhw7m8ka',
  'ayj1thvzmwsmpbn1ami7c8z85'
]

const BATCH        = 50   // ListingKeys per Spark request
const PAUSE_MS     = 150  // ms between requests to respect rate limits

// ── Helpers ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function sparkFetch(token, filter) {
  const url = `${SPARK_BASE}/Property?$filter=${encodeURIComponent(filter)}&$select=ListingKey,MlsStatus,CloseDate,ClosePrice&$top=${BATCH}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-SparkApi-User-Agent': 'ZhomesApp/1.0'
    }
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Spark ${res.status}: ${txt.substring(0, 200)}`)
  }
  const json = await res.json()
  return json.value || []
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  })
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`)
  return res.json()
}

async function supabaseUpdate(id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mls_properties?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(fields)
  })
  if (!res.ok) throw new Error(`Supabase PATCH ${id}: ${res.status}`)
}

// ── Main ──
console.log('═══════════════════════════════════════════════')
console.log('  ZHomes — MLS Status Refresh')
console.log('═══════════════════════════════════════════════')
console.log(`  ${new Date().toLocaleString('es-US')}`)
console.log()

// 1. Get all properties from Supabase (id + current status)
console.log('📋 Fetching properties from Supabase...')
const allProps = await supabaseGet('mls_properties?select=id,status,address&order=status.asc&limit=2000')
console.log(`   Found: ${allProps.length} properties`)

// Build lookup: id → { status, address }
const supMap = {}
for (const p of allProps) supMap[p.id] = p

const ids = Object.keys(supMap)
let changed = 0, errors = 0, checked = 0

// 2. Process in batches of BATCH size
for (let i = 0; i < ids.length; i += BATCH) {
  const chunk = ids.slice(i, i + BATCH)
  
  // Build OData filter: ListingKey in ('k1','k2',...)
  const filter = chunk.map(k => `ListingKey eq '${k}'`).join(' or ')
  
  let sparkResults = []
  let gotResult = false
  
  // Try tokens in order — first one that works wins
  for (const token of TOKENS) {
    try {
      sparkResults = await sparkFetch(token, filter)
      gotResult = true
      break
    } catch (err) {
      console.warn(`   ⚠️  Token failed, trying next: ${err.message.substring(0, 80)}`)
    }
  }
  
  if (!gotResult) {
    console.error(`   ❌ Batch ${i}-${i + BATCH}: all tokens failed, skipping`)
    errors++
    await sleep(PAUSE_MS)
    continue
  }

  // 3. Compare and update mismatches
  for (const sp of sparkResults) {
    const key = sp.ListingKey
    const supaStatus = supMap[key]?.status
    const sparkStatus = sp.MlsStatus
    checked++

    if (supaStatus !== sparkStatus && sparkStatus) {
      const fields = {
        status: sparkStatus,
        sync_timestamp: new Date().toISOString()
      }
      if (sp.CloseDate) fields.close_date = sp.CloseDate
      if (sp.ClosePrice) fields.close_price = Math.round(sp.ClosePrice)

      try {
        await supabaseUpdate(key, fields)
        console.log(`   🔄  ${supMap[key]?.address || key}`)
        console.log(`       ${supaStatus} → ${sparkStatus}${sp.CloseDate ? ' (closed ' + sp.CloseDate + ')' : ''}`)
        changed++
      } catch (err) {
        console.error(`   ❌  Update failed for ${key}: ${err.message}`)
        errors++
      }
    }
  }

  // Progress
  const pct = Math.round(((i + BATCH) / ids.length) * 100)
  process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, ids.length)}/${ids.length} (${pct}%)  `)

  await sleep(PAUSE_MS)
}

console.log('\n')
console.log('═══════════════════════════════════════════════')
console.log(`  ✅ Done! Checked: ${checked} | Updated: ${changed} | Errors: ${errors}`)
console.log('═══════════════════════════════════════════════')
