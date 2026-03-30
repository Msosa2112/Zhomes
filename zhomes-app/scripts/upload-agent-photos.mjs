/**
 * upload-agent-photos.mjs
 * 
 * Sube las fotos de perfil de cada agente a Supabase Storage
 * y actualiza la columna photo_url en zhomes_agents.
 *
 * Uso: node scripts/upload-agent-photos.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually ──
try {
  const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)="?([^"]*)"?$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';

const AGENTS_DIR = resolve(__dirname, '../public/assets/agents');
const BUCKET = 'agents';

// ── Helpers ──

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    }
  });
  return res;
}

async function ensureBucketExists() {
  // Check if bucket exists
  const listRes = await supabaseRequest('/storage/v1/bucket');
  const buckets = await listRes.json();
  const exists = Array.isArray(buckets) && buckets.some(b => b.name === BUCKET);

  if (!exists) {
    console.log(`📦 Creating bucket "${BUCKET}"...`);
    const createRes = await supabaseRequest('/storage/v1/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    if (!createRes.ok) {
      const txt = await createRes.text();
      // Ignore "already exists" errors
      if (!txt.includes('already exists')) {
        throw new Error(`Failed to create bucket: ${txt}`);
      }
    }
    console.log(`   ✅ Bucket "${BUCKET}" created (public)`);
  } else {
    console.log(`   ✅ Bucket "${BUCKET}" already exists`);
  }
}

async function uploadPhoto(agentFolderName, filePath) {
  const fileBuffer = readFileSync(filePath);
  const storagePath = `${agentFolderName}/perfil.png`;

  const uploadRes = await supabaseRequest(
    `/storage/v1/object/${BUCKET}/${encodeURIComponent(storagePath)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'x-upsert': 'true',   // overwrite if exists
      },
      body: fileBuffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Upload failed for "${agentFolderName}": ${err.substring(0, 200)}`);
  }

  // Return public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(storagePath)}`;
}

async function updateAgentPhotoUrl(agentName, photoUrl) {
  // Try exact match first, then partial match (ILIKE)
  const res = await supabaseRequest(
    `/rest/v1/zhomes_agents?full_name=ilike.*${encodeURIComponent(agentName)}*`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ photo_url: photoUrl }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DB update failed for "${agentName}": ${err.substring(0, 200)}`);
  }

  const updated = await res.json();
  return Array.isArray(updated) ? updated.length : 0;
}

// ── Main ──
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  ZHomes Agent Photos → Supabase Storage');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Check/create bucket
  await ensureBucketExists();
  console.log('');

  // 2. Check if zhomes_agents has photo_url column; if not, add it
  console.log('🔧 Ensuring photo_url column exists in zhomes_agents...');
  const colCheck = await supabaseRequest('/rest/v1/zhomes_agents?limit=1');
  const sample = await colCheck.json();
  if (Array.isArray(sample) && sample.length > 0 && !('photo_url' in sample[0])) {
    console.log('   ⚠️  photo_url column missing — adding via SQL...');
    // Use the SQL API to add the column
    const sqlRes = await supabaseRequest('/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: 'ALTER TABLE zhomes_agents ADD COLUMN IF NOT EXISTS photo_url TEXT;' })
    });
    if (!sqlRes.ok) {
      console.warn('   ⚠️  Could not add column automatically. Please run this SQL in Supabase:');
      console.warn('   ALTER TABLE zhomes_agents ADD COLUMN IF NOT EXISTS photo_url TEXT;');
    } else {
      console.log('   ✅ Column photo_url added');
    }
  } else {
    console.log('   ✅ Column photo_url already exists');
  }
  console.log('');

  // 3. Process each agent folder
  const agentFolders = readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`📁 Found ${agentFolders.length} agent folders\n`);

  let uploaded = 0;
  let updated = 0;
  let failed = 0;

  for (const folderName of agentFolders) {
    const perfilPath = join(AGENTS_DIR, folderName, 'perfil.png');

    if (!existsSync(perfilPath)) {
      console.log(`⚠️  ${folderName} — no perfil.png, skipping`);
      failed++;
      continue;
    }

    try {
      process.stdout.write(`⬆️  Uploading ${folderName}...`);
      const photoUrl = await uploadPhoto(folderName, perfilPath);
      uploaded++;
      process.stdout.write(' uploaded ✓  ');

      // Update DB — use first + last name from folder name
      const rowsUpdated = await updateAgentPhotoUrl(folderName, photoUrl);
      updated += rowsUpdated;

      if (rowsUpdated > 0) {
        console.log(`DB updated (${rowsUpdated} row) ✅`);
      } else {
        console.log(`⚠️  No matching agent in DB for "${folderName}"`);
      }
    } catch (err) {
      console.log(`\n   ❌ ${err.message}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  ✅ Photos uploaded : ${uploaded}`);
  console.log(`  ✅ DB rows updated : ${updated}`);
  console.log(`  ❌ Skipped/Failed  : ${failed}`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
