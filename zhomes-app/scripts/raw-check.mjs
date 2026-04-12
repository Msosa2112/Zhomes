// scripts/raw-check.mjs
import 'dotenv/config';
const CRON = process.env.CRON_SECRET;

const tests = [
  { label: 'qstash-trigger', method: 'GET', url: 'https://zhomesapp.com/api/qstash-trigger',
    headers: { 'Authorization': `Bearer ${CRON}`, 'x-vercel-cron': '1' } },
  { label: 'commute-cache',  method: 'GET', url: 'https://zhomesapp.com/api/commute-cache?origin=test&dest=test',
    headers: {} },
  { label: 'enqueue-lead',   method: 'POST', url: 'https://zhomesapp.com/api/enqueue-lead',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentKey: 'TEST', action: 'swiped_right' }) },
];

for (const t of tests) {
  const r = await fetch(t.url, { method: t.method, headers: t.headers, body: t.body });
  const text = await r.text();
  console.log(`\n=== ${t.label} | HTTP ${r.status} ===`);
  console.log(text.slice(0, 400));
}
