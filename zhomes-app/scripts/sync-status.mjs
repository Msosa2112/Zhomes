// scripts/sync-status.mjs — lee credenciales del .env, no las hardcodea
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Faltan variables SUPABASE_URL / SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const s = createClient(url, key)

const [p, a, o] = await Promise.all([
  s.from('mls_properties').select('status'),
  s.from('zhomes_agents').select('id'),
  s.from('zhomes_office').select('name'),
])

const counts = {}
;(p.data || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })

console.log('\n=== Supabase Status ===')
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(' ', k + ':', v))
console.log('  Agents:', a.data?.length || 0)
console.log('  Office:', o.data?.[0]?.name || 'not synced')
console.log('======================\n')
