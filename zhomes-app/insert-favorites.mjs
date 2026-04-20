import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const targetUserId = 'f558e16d-7dbb-4cf9-baec-e74d5311b06f'; // info.twoitsolutions@gmail.com
  const sourceUserId = '9fb2fc6e-9cde-4914-913c-5d2a3866f537';

  const { data: favs, error } = await supabase.from('user_favorites').select('*').eq('user_id', sourceUserId).limit(3);
  if (error || !favs || favs.length === 0) {
    console.error('Error fetching source favorites or none found:', error);
    return;
  }

  const newFavs = favs.map(f => {
    return {
      user_id: targetUserId,
      property_id: f.property_id,
      property_data: f.property_data,
      collection_name: f.collection_name
    };
  });

  const { data: inserted, error: insertError } = await supabase.from('user_favorites').insert(newFavs).select();
  if (insertError) {
    console.error('Error inserting:', insertError);
  } else {
    console.log(`Successfully assigned ${inserted.length} favorites to ${targetUserId}`);
  }
}
run();
