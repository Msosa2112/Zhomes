/**
 * add-photo-url-column.mjs
 * 
 * Agrega la columna photo_url a zhomes_agents usando
 * la Supabase Database Management API.
 * 
 * Luego, actualiza todos los agentes con sus foto URLs del Storage.
 *
 * Uso: node scripts/add-photo-url-column.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)="?([^"]*)"?$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

// Supabase project ref (part of the URL)
const PROJECT_REF = 'bnbvzcllyfmzuhnjltxg';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';

const BUCKET = 'agents';

const AGENT_NAMES = [
  'Alan Hernandez',
  'Celia Hernandez',
  'Dario Hernandez',
  'Ernesto Cougil',
  'Gilbert Zaldivar',
  'Jessica Hernandez',
  'Judith Gonzalez',
  'Leidys Herrera',
  'Lisbeisy Echeverria',
  'Maria Mendez',
  'Mariam Rodriguez',
  'Maylin Rodriguez',
  'Miriam Castano',
  'Pavel Reyes',
  'Rocio Martinez',
  'Ronney Aguiar',
  'Sidalg Nieves',
  'Yeimy Ortiz',
  'Yurisbel Garcia',
  'Yusleidy Perez',
];

function h(extra = {}) {
  return {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

// Use Supabase's pg-meta endpoint to run SQL
async function runSQL(sql) {
  // Method 1: pg-meta API (available via Management API but requires access token)
  // Method 2: Use a stored procedure / RPC workaround
  // Method 3: Use the REST API with a direct column update via upsert

  // Best approach for service_role: execute via pg-meta internal endpoint
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/`,
    {
      method: 'GET',
      headers: h()
    }
  );
  
  // Try the pg endpoint via Supabase's internal API
  const pgRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // This requires a Supabase platform access token, not project service key
    },
    body: JSON.stringify({ query: sql })
  });
  
  return pgRes;
}

// Alternative: Try inserting a fake row with photo_url to see if column exists
// If it fails with "column does not exist", we know we need to add it
async function checkColumnExists() {
  // Fetch a row and check if photo_url key is present
  const res = await fetch(`${SUPABASE_URL}/rest/v1/zhomes_agents?limit=1`, {
    headers: h({ 'Accept': 'application/json' })
  });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return 'photo_url' in data[0];
  }
  return null; // unknown
}

// Direct PATCH approach — will fail if no column, and we can detect
async function tryPatchWithPhotoUrl(agentId, photoUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/zhomes_agents?id=eq.${agentId}`, {
    method: 'PATCH',
    headers: h({ 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ photo_url: photoUrl })
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function getAllAgents() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/zhomes_agents?select=id,full_name&order=full_name`, {
    headers: h()
  });
  return res.json();
}

// Find best match between folder name and DB full_name
function findBestMatch(folderName, agents) {
  const fn = folderName.toLowerCase();
  // Exact match
  let match = agents.find(a => a.full_name?.toLowerCase() === fn);
  if (match) return match;
  // Contains all words
  const words = fn.split(' ');
  match = agents.find(a => {
    const name = a.full_name?.toLowerCase() || '';
    return words.every(w => name.includes(w));
  });
  if (match) return match;
  // Partial (last name match + first letter)
  const lastName = words[words.length - 1];
  const firstName = words[0];
  match = agents.find(a => {
    const name = a.full_name?.toLowerCase() || '';
    return name.includes(lastName) && name.includes(firstName[0]);
  });
  return match || null;
}

function buildPhotoUrl(folderName) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(folderName)}/perfil.png`;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  ZHomes → Link Agent Photos to DB');
  console.log('═══════════════════════════════════════════════\n');

  // Step 1: Check if column exists
  const colExists = await checkColumnExists();
  
  if (colExists === false) {
    console.log('❌ Column photo_url does NOT exist in zhomes_agents!');
    console.log('\nPlease open Supabase dashboard → SQL Editor and run:');
    console.log('───────────────────────────────────────────────────────');
    console.log('ALTER TABLE zhomes_agents ADD COLUMN IF NOT EXISTS photo_url TEXT;');
    console.log('───────────────────────────────────────────────────────');
    console.log('\nThen run: node scripts/update-agent-photo-urls.mjs');
    process.exit(0);
  }

  if (colExists === null) {
    console.log('⚠️  Could not determine column state (table might be empty)');
  } else {
    console.log('✅ Column photo_url exists\n');
  }

  // Step 2: Get all agents from DB
  const agents = await getAllAgents();
  if (!Array.isArray(agents)) {
    console.error('❌ Could not fetch agents:', agents);
    process.exit(1);
  }
  console.log(`📋 Found ${agents.length} agents in database\n`);

  let updated = 0;
  let notFound = 0;
  let failed = 0;

  for (const folderName of AGENT_NAMES) {
    const photoUrl = buildPhotoUrl(folderName);
    const match = findBestMatch(folderName, agents);

    process.stdout.write(`📸 ${folderName.padEnd(25)} → `);

    if (!match) {
      console.log(`⚠️  No DB match found`);
      notFound++;
      continue;
    }

    const result = await tryPatchWithPhotoUrl(match.id, photoUrl);

    if (result.ok || result.status === 204) {
      console.log(`✅ ${match.full_name}`);
      updated++;
    } else {
      // Check if column missing
      if (result.body.includes('photo_url') || result.body.includes('schema cache')) {
        console.log(`❌ Column photo_url missing! Run ALTER TABLE first.`);
        console.log('\n► SQL to run in Supabase:');
        console.log('  ALTER TABLE zhomes_agents ADD COLUMN IF NOT EXISTS photo_url TEXT;');
        process.exit(1);
      }
      console.log(`❌ ${result.body.substring(0, 80)}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 80));
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  ✅ Updated  : ${updated}`);
  console.log(`  ⚠️  Not found: ${notFound}`);
  console.log(`  ❌ Failed   : ${failed}`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
