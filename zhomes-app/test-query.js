import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('tc_transactions')
    .select('*, tc_documents(*), tc_messages(*), tc_events(*)')
    .limit(1)
    .order('sort_order', { foreignTable: 'tc_documents', ascending: true })
    .order('created_at', { foreignTable: 'tc_messages', ascending: true })
    .order('created_at', { foreignTable: 'tc_events', ascending: false });
  console.log(error || 'Success: ' + data[0]?.id);
}
test();
