/**
 * sync-agents-only.mjs
 * Syncs ONLY agents + office to Supabase (skips the slow property crawl).
 * Run once after creating the zhomes_agents / zhomes_office tables.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://elhqcwpqbnxafaepmswl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPARK_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const BROKER_TOKEN = '6ojczz7todkepnsvryhw7m8ka';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

async function sparkFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${SPARK_BASE}/${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${BROKER_TOKEN}`, 'X-SparkApi-User-Agent': 'ZhomesApp/1.0' }
  });
  if (!res.ok) throw new Error(`Spark ${res.status}: ${await res.text().then(t => t.slice(0,150))}`);
  return res.json();
}

async function upsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Supabase [${table}]: ${error.message} | ${error.details || ''}`);
}

async function syncAgents() {
  console.log('\n👥 Fetching ZHomes agents from Spark...');
  const data = await sparkFetch('Member', {
    '$filter': `OfficeKey eq '${ZHOMES_OFFICE_KEY}'`,
    '$select': 'MemberKey,MemberFullName,MemberFirstName,MemberLastName,MemberEmail,MemberPreferredPhone,MemberMobilePhone,MemberOfficePhone,MemberMlsId,MemberStatus,MemberStateLicense,MemberType,MemberLocalType,MemberAddress1,MemberCity,MemberStateOrProvince,MemberPostalCode,OfficeName,OfficeKey,MemberBio'
  });

  const agents = (data.value || []).map(a => ({
    id: a.MemberKey,
    full_name: a.MemberFullName || null,
    first_name: a.MemberFirstName || null,
    last_name: a.MemberLastName || null,
    email: a.MemberEmail || null,
    phone: a.MemberPreferredPhone || a.MemberMobilePhone || a.MemberOfficePhone || null,
    mls_id: a.MemberMlsId || null,
    status: a.MemberStatus || null,
    license: a.MemberStateLicense || null,
    member_type: a.MemberLocalType || a.MemberType || null,
    office_name: a.OfficeName || null,
    office_key: a.OfficeKey || null,
    bio: a.MemberBio || null,
    address: a.MemberAddress1 || null,
    city: a.MemberCity || null,
    state: a.MemberStateOrProvince || null,
    zip: a.MemberPostalCode || null,
    sync_timestamp: new Date().toISOString()
  }));

  if (agents.length === 0) { console.log('   ⚠️  No agents found'); return []; }

  await upsert('zhomes_agents', agents);
  console.log(`   ✅ ${agents.length} agents saved`);

  // Stats per agent
  console.log('   📊 Fetching closed deals per agent...');
  for (const agent of agents) {
    try {
      const deals = await sparkFetch('Property', {
        '$filter': `ListAgentKey eq '${agent.id}' and MlsStatus eq 'Closed'`,
        '$top': '100',
        '$orderby': 'CloseDate desc',
        '$select': 'ClosePrice,CloseDate,UnparsedAddress,City'
      }).then(d => d.value || []);

      const vol = deals.reduce((s, d) => s + (d.ClosePrice || 0), 0);
      await upsert('zhomes_agents', [{
        id: agent.id,
        total_closed: deals.length,
        total_volume: vol,
        avg_price: deals.length ? Math.round(vol / deals.length) : 0,
        last_close_date: deals[0]?.CloseDate || null,
        recent_deals: deals.slice(0, 5).map(d => ({
          address: d.UnparsedAddress, price: d.ClosePrice,
          date: d.CloseDate, city: d.City
        })),
        sync_timestamp: new Date().toISOString()
      }]);

      console.log(`   ✓ ${agent.full_name}: ${deals.length} closed deals, $${vol.toLocaleString()} volume`);
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.warn(`   ⚠️  ${agent.full_name}: ${err.message}`);
    }
  }
  return agents;
}

async function syncOffice() {
  console.log('\n🏢 Fetching ZHomes office...');
  try {
    const office = await sparkFetch(`Office('${ZHOMES_OFFICE_KEY}')`);
    if (!office?.OfficeKey) { console.log('   ⚠️  Office not found'); return; }

    await upsert('zhomes_office', [{
      id: office.OfficeKey,
      name: office.OfficeName || null,
      phone: office.OfficePhone || null,
      fax: office.OfficeFax || null,
      email: office.OfficeEmail || null,
      address: office.OfficeAddress1 || null,
      city: office.OfficeCity || null,
      state: office.OfficeStateOrProvince || null,
      zip: office.OfficePostalCode || null,
      license: office.OfficeCorporateLicense || null,
      broker_key: office.OfficeBrokerKey || null,
      mls_id: office.OfficeMlsId || null,
      status: office.OfficeStatus || null,
      sync_timestamp: new Date().toISOString()
    }]);
    console.log(`   ✅ Office "${office.OfficeName}" saved`);
  } catch (err) {
    console.error('   ❌ Office error:', err.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  ZHomes Agents + Office Sync');
  console.log(`  ${new Date().toLocaleString('es-US')}`);
  console.log('═══════════════════════════════════════════════');
  const agents = await syncAgents();
  await syncOffice();
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  ✅ Done. ${agents.length} agents + office synced.`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
