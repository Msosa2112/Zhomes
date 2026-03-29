import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bnbvzcllyfmzuhnjltxg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w'
);

const { count: agentsCount } = await supabase.from('zhomes_agents').select('*', { count: 'exact', head: true });
const { count: officeCount } = await supabase.from('zhomes_office').select('*', { count: 'exact', head: true });
const { data: sample } = await supabase.from('zhomes_agents').select('full_name,status,total_closed,total_volume').limit(10);

console.log('=== Supabase Results (new project) ===');
console.log('zhomes_agents:', agentsCount, 'rows');
console.log('zhomes_office:', officeCount, 'rows');
console.log('\nSample agents:');
sample?.forEach(a => console.log(` - ${a.full_name} | ${a.status} | ${a.total_closed} closed | $${(a.total_volume || 0).toLocaleString()}`));
