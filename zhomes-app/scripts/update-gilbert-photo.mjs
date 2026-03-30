import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';

const file = readFileSync(resolve(__dirname, '../public/assets/agents/Gilbert Zaldivar/Gilbert Zaldivar.png'));

const res = await fetch(
  `${SUPABASE_URL}/storage/v1/object/agents/${encodeURIComponent('Gilbert Zaldivar')}/fullbody.png`,
  {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: file,
  }
);

console.log(res.ok ? '✅ Gilbert photo updated' : `❌ ${res.status}: ${await res.text()}`);
