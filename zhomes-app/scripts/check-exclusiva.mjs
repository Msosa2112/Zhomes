import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('mls_properties').select('id,address,status,is_zhomes').in('status', ['Exclusiva', 'Off Market']);
  fs.writeFileSync('output-exclusiva.txt', JSON.stringify(data, null, 2));
}
check();
