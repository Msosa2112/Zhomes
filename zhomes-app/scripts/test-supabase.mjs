import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://elhqcwpqbnxafaepmswl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4'
);

console.log('Testing zhomes_agents insert...');

const row = { id: 'test_001', full_name: 'Test Agent', sync_timestamp: new Date().toISOString() };
const result = await supabase.from('zhomes_agents').upsert([row], { onConflict: 'id' });

console.log('Status:', result.status);
console.log('Error:', JSON.stringify(result.error, null, 2));
console.log('Data:', result.data);

if (!result.error) {
  console.log('\nSUCCESS! Table is writable.');
  // Clean up test row
  await supabase.from('zhomes_agents').delete().eq('id', 'test_001');
  console.log('Test row cleaned up.');
} else {
  console.log('\nFAILED. Full error object:');
  console.log('  code:', result.error.code);
  console.log('  message:', result.error.message);
  console.log('  details:', result.error.details);
  console.log('  hint:', result.error.hint);
}
