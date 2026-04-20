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
  const clientId = 'f558e16d-7dbb-4cf9-baec-e74d5311b06f';
  const realtorId = '82468110-7980-4315-9521-dc795212821b'; // damelaletra@gmail.com

  // Get current metadata
  const { data: userResp } = await supabase.auth.admin.getUserById(clientId);
  const user = userResp?.user;
  if(!user) {
    console.log("Client not found");
    return;
  }

  const newMeta = {
    ...user.user_metadata,
    role: 'client',
    realtor_id: realtorId,
    realtor_email: 'damelaletra@gmail.com'
  };

  const { data, error } = await supabase.auth.admin.updateUserById(clientId, {
    user_metadata: newMeta
  });

  if(error) {
    console.error('Error updating metadata:', error);
  } else {
    console.log('Successfully updated client metadata:', data.user.user_metadata);
  }
}

run();
