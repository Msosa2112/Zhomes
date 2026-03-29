import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing standard Supabase credentials. Ensure .env.local exists.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectZHomes() {
  const { data, error, count } = await supabase
    .from('mls_properties')
    .select('id, address, status, is_zhomes', { count: 'exact' })
    .eq('is_zhomes', true);

  if (error) {
    fs.writeFileSync('output.txt', "Error: " + error.message);
  } else {
    let out = "ZHomes count (is_zhomes: true): " + count + "\n";
    data.forEach(d => {
      out += `- ${d.status} | ${d.address} | ${d.id}\n`;
    });
    fs.writeFileSync('output.txt', out);
  }
}

inspectZHomes();
