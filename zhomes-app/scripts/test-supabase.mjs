import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://elhqcwpqbnxafaepmswl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Quick check: is the table visible via PostgREST?
console.log('--- Checking table visibility via PostgREST ---');
const swaggerRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
});
const swagger = await swaggerRes.json();
const paths = Object.keys(swagger.paths || {});
const zhomesVisible = paths.filter(p => p.includes('zhomes') || p.includes('mls_prop'));
console.log('Visible ZHomes tables:', zhomesVisible.length ? zhomesVisible.join(', ') : 'NONE');

// 2. Test upsert into zhomes_agents
console.log('\n--- Testing zhomes_agents insert ---');
const row = { id: 'test_001', full_name: 'Test Agent', sync_timestamp: new Date().toISOString() };
const result = await supabase.from('zhomes_agents').upsert([row], { onConflict: 'id' });

console.log('Status:', result.status);
console.log('Error:', JSON.stringify(result.error, null, 2));

if (!result.error) {
  console.log('\n✅ SUCCESS! Table is writable. Running agent sync now...');
  await supabase.from('zhomes_agents').delete().eq('id', 'test_001');
} else {
  console.log('\n❌ FAILED. Check the error details above.');
}
