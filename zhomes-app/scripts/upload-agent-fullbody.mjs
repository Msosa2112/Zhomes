/**
 * upload-agent-fullbody.mjs
 * Sube las fotos de cuerpo completo (Photoroom) al Storage de Supabase
 * y actualiza photo_url en zhomes_agents.
 * 
 * Uso: node scripts/upload-agent-fullbody.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"\r\n]*)"?/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {}

const SUPABASE_URL = 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';
const BUCKET = 'agents';
const ASSETS_DIR = resolve(__dirname, '../public/assets/agents');

const h = (extra = {}) => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  ...extra,
});

// Map: folder name -> fullbody photo filename
const FULLBODY_MAP = {
  'Alan Hernandez':      'Imagen de WhatsApp 2025-08-09 a las 22.48.44_d20393ff-Photoroom.png',
  'Celia Hernandez':     'Imagen de WhatsApp 2025-08-09 a las 22.48.44_9b9c15e4-Photoroom.png',
  'Dario Hernandez':     'H40A6413-Photoroom.png',
  'Ernesto Cougil':      'H40A6422-Photoroom.png',
  'Gilbert Zaldivar':    'Gilbert Zaldivar HQ.png',
  'Jessica Hernandez':   'Jessica Hernandez.png',
  'Judith Gonzalez':     'Imagen de WhatsApp 2025-11-08 a las 12.55.35_4541512b-Photoroom.png',
  'Leidys Herrera':      '_DSC0060-Photoroom.png',
  'Lisbeisy Echeverria': 'H40A6181-Photoroom.png',
  'Maria Mendez':        'H40A6104-Photoroom.png',
  'Mariam Rodriguez':    'H40A6148-Photoroom.png',
  'Maylin Rodriguez':    'Imagen de WhatsApp 2025-03-28 a las 00.25.51_e36cac97-Photoroom.png',
  'Miriam Castano':      'Miriam Castano.png',
  'Pavel Reyes':         'Imagen de WhatsApp 2025-08-09 a las 22.48.44_931d2466-Photoroom.png',
  'Rocio Martinez':      'H40A6352-Photoroom.png',
  'Ronney Aguiar':       'Imagen de WhatsApp 2025-08-09 a las 22.48.44_06ed62ca-Photoroom.png',
  'Sidalg Nieves':       'Imagen de WhatsApp 2025-08-09 a las 22.48.44_d02bf26b-Photoroom.png',
  'Yeimy Ortiz':         'H40A6214-Photoroom.png',
  'Yurisbel Garcia':     'H40A6136-Photoroom.png',
  'Yusleidy Perez':      'H40A6121-Photoroom.png',
};

async function uploadFile(folder, filename) {
  const localPath = join(ASSETS_DIR, folder, filename);
  if (!existsSync(localPath)) {
    return { ok: false, reason: 'file not found: ' + localPath };
  }

  const fileData = readFileSync(localPath);
  // Store as agents/{folder}/fullbody.png for consistency
  const storagePath = `${folder}/fullbody.png`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(folder)}/fullbody.png`,
    {
      method: 'POST',
      headers: {
        ...h({ 'Content-Type': 'image/png' }),
        'x-upsert': 'true',
      },
      body: fileData,
    }
  );

  if (res.ok || res.status === 200) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(folder)}/fullbody.png`;
    return { ok: true, url: publicUrl };
  }

  const txt = await res.text();
  return { ok: false, reason: `${res.status}: ${txt.substring(0, 100)}` };
}

async function getAgents() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/zhomes_agents?select=id,full_name,first_name,last_name`, {
    headers: h(),
  });
  return r.json();
}

function findAgent(folder, agents) {
  const fl = folder.toLowerCase();
  const words = fl.split(' ');
  return agents.find(a => {
    const n = (a.full_name || '').toLowerCase();
    return words.every(w => n.includes(w));
  }) || agents.find(a => {
    const n = (a.full_name || '').toLowerCase();
    return n.includes(words[0]) && n.includes(words[words.length - 1]);
  }) || null;
}

async function updatePhotoUrl(agentId, url) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/zhomes_agents?id=eq.${agentId}`, {
    method: 'PATCH',
    headers: { ...h({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }) },
    body: JSON.stringify({ photo_url: url }),
  });
  return r.ok || r.status === 204;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ZHomes → Upload Full-Body Photos to Supabase');
  console.log('═══════════════════════════════════════════════════\n');

  const agents = await getAgents();
  console.log(`📋 ${agents.length} agents in DB\n`);

  let uploaded = 0, updated = 0, failed = 0;

  for (const [folder, filename] of Object.entries(FULLBODY_MAP)) {
    process.stdout.write(`📸 ${folder.padEnd(22)} | `);

    // 1. Upload to Storage
    const upload = await uploadFile(folder, filename);
    if (!upload.ok) {
      console.log(`❌ Upload failed: ${upload.reason}`);
      failed++;
      continue;
    }
    uploaded++;
    process.stdout.write(`✅ uploaded | `);

    // 2. Find agent in DB
    const agent = findAgent(folder, agents);
    if (!agent) {
      console.log(`⚠️  no DB match`);
      continue;
    }

    // 3. Update photo_url
    const ok = await updatePhotoUrl(agent.id, upload.url);
    if (ok) {
      console.log(`✅ DB updated → ${agent.full_name}`);
      updated++;
    } else {
      console.log(`❌ DB update failed`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ✅ Uploaded : ${uploaded}`);
  console.log(`  ✅ DB links : ${updated}`);
  console.log(`  ❌ Failed   : ${failed}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
