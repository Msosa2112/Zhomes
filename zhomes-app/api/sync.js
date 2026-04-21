/**
 * api/sync.js — Vercel Serverless Function
 * 
 * Triggered by Vercel Cron Jobs at 6am and 6pm EST.
 * Runs the full MLS → Supabase sync without touching the app.
 * 
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */

import { Client } from '@upstash/qstash';

export const maxDuration = 60; // Allow 60s execution limit on Vercel

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SPARK_BASE   = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.APP_URL;
const qstashClient = QSTASH_TOKEN ? new Client({ token: QSTASH_TOKEN }) : null;

const TOKENS = {
  broker: process.env.SPARK_BROKER_TOKEN || process.env.VITE_SPARK_API_KEY,
  idx:    process.env.SPARK_IDX_TOKEN    || process.env.VITE_SPARK_API_KEY
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sparkFetch(token, path, params = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `${SPARK_BASE}/${path}${searchParams ? '?' + searchParams : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'X-SparkApi-User-Agent': 'ZhomesApp/1.0' }
  });
  if (!res.ok) throw new Error(`Spark ${res.status}`);
  return res.json();
}

async function supabaseUpsert(table, rows) {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`Supabase [${table}] ${res.status}: ${await res.text().then(t=>t.slice(0,100))}`);
}

function transformProperty(raw, source) {
  const photos = (raw.Media || []).map(m => m.MediaURL).filter(Boolean);
  return {
    id: raw.ListingKey,
    listing_id: raw.ListingId || null,
    address: raw.UnparsedAddress || '',
    city: raw.City || null,
    state: raw.StateOrProvince || 'KY',
    zip: raw.PostalCode || null,
    county: raw.CountyOrParish || null,
    lat: raw.Latitude || null,
    lng: raw.Longitude || null,
    price: raw.ListPrice ? Math.round(raw.ListPrice) : null,
    close_price: raw.ClosePrice ? Math.round(raw.ClosePrice) : null,
    original_price: raw.OriginalListPrice ? Math.round(raw.OriginalListPrice) : null,
    status: raw.MlsStatus || 'Active',
    property_type: raw.PropertyType || null,
    property_subtype: raw.PropertySubType || null,
    beds: Math.round(raw.BedroomsTotal || 0),
    baths: raw.BathroomsTotalInteger || 0,
    sqft: Math.round(raw.LivingArea || 0),
    description: raw.PublicRemarks || null,
    primary_photo: photos[0] || null,
    photos: photos.length > 0 ? photos : null,
    list_date: raw.ListDate || null,
    close_date: raw.CloseDate || null,
    list_agent_name: raw.ListAgentFullName || null,
    list_agent_key: raw.ListAgentKey || null,
    list_office_key: raw.ListOfficeKey || null,
    subdivision: raw.SubdivisionName || null,
    year_built: raw.YearBuilt ? Math.round(raw.YearBuilt) : null,
    lot_size: raw.LotSizeAcres || null,
    garage_yn: raw.GarageYN || false,
    fireplace_yn: raw.FireplaceYN || false,
    hoa_yn: raw.AssociationYN || null,
    hoa_fee: raw.AssociationFee || null,
    virtual_tour_url: raw.VirtualTourURLUnbranded || null,
    is_zhomes: String(raw.ListOfficeKey || '') === ZHOMES_OFFICE_KEY,
    spark_source: source,
    sync_timestamp: new Date().toISOString()
  };
}

async function processFeedPage(tokenName, token, skipToken = null, customFilter = null) {
  const params = { '$expand': 'Media' };
  if (customFilter) params['$filter'] = customFilter;
  if (skipToken) params['$skiptoken'] = skipToken;

  const data = await sparkFetch(token, 'Property', params);
  const results = data.value || [];
  
  if (results.length > 0) {
    const rows = results.map(p => transformProperty(p, tokenName));
    await supabaseUpsert('mls_properties', rows).catch(async () => {
      // Chunk insertions internally if bulk fails
      for (let i = 0; i < rows.length; i += 25)
        await supabaseUpsert('mls_properties', rows.slice(i, i + 25)).catch(() => {});
    });
  }

  const nextLink = data['@odata.nextLink'];
  let newSkipToken = null;
  if (nextLink) {
    newSkipToken = new URL(nextLink).searchParams.get('$skiptoken');
  }

  return { rowsProcessed: results.length, nextSkipToken: newSkipToken };
}

async function syncAgents() {
  const data = await sparkFetch(TOKENS.broker, 'Member', {
    '$filter': `OfficeKey eq '${ZHOMES_OFFICE_KEY}'`,
    '$select': 'MemberKey,MemberFullName,MemberFirstName,MemberLastName,MemberEmail,MemberPreferredPhone,MemberMobilePhone,MemberMlsId,MemberStatus,MemberStateLicense,MemberType,MemberLocalType,MemberAddress1,MemberCity,MemberStateOrProvince,MemberPostalCode,OfficeName,OfficeKey,MemberBio'
  });
  const agents = (data.value || []).map(a => ({
    id: a.MemberKey,
    full_name: a.MemberFullName || null, first_name: a.MemberFirstName || null,
    last_name: a.MemberLastName || null, email: a.MemberEmail || null,
    phone: a.MemberPreferredPhone || a.MemberMobilePhone || null,
    mls_id: a.MemberMlsId || null, status: a.MemberStatus || null,
    license: a.MemberStateLicense || null, member_type: a.MemberLocalType || a.MemberType || null,
    office_name: a.OfficeName || null, office_key: a.OfficeKey || null, bio: a.MemberBio || null,
    city: a.MemberCity || null, state: a.MemberStateOrProvince || null,
    sync_timestamp: new Date().toISOString()
  }));
  if (agents.length) await supabaseUpsert('zhomes_agents', agents);

  // Agent stats (1 call per agent)
  for (const agent of agents) {
    const deals = await sparkFetch(TOKENS.broker, 'Property', {
      '$filter': `ListAgentKey eq '${agent.id}' and MlsStatus eq 'Closed'`,
      '$top': '100', '$orderby': 'CloseDate desc',
      '$select': 'ClosePrice,CloseDate,UnparsedAddress,City'
    }).then(d => d.value || []).catch(() => []);

    const vol = deals.reduce((s, d) => s + (d.ClosePrice || 0), 0);
    await supabaseUpsert('zhomes_agents', [{
      id: agent.id, total_closed: deals.length, total_volume: vol,
      avg_price: deals.length ? Math.round(vol / deals.length) : 0,
      last_close_date: deals[0]?.CloseDate || null,
      recent_deals: deals.slice(0, 5).map(d => ({ address: d.UnparsedAddress, price: d.ClosePrice, date: d.CloseDate, city: d.City })),
      sync_timestamp: new Date().toISOString()
    }]).catch(() => {});
    await sleep(150);
  }
  return agents.length;
}

async function syncOffice() {
  const office = await sparkFetch(TOKENS.broker, `Office('${ZHOMES_OFFICE_KEY}')`).catch(() => null);
  if (!office?.OfficeKey) return;
  await supabaseUpsert('zhomes_office', [{
    id: office.OfficeKey, name: office.OfficeName || null, phone: office.OfficePhone || null,
    fax: office.OfficeFax || null, email: office.OfficeEmail || null,
    address: office.OfficeAddress1 || null, city: office.OfficeCity || null,
    state: office.OfficeStateOrProvince || null, zip: office.OfficePostalCode || null,
    license: office.OfficeCorporateLicense || null, broker_key: office.OfficeBrokerKey || null,
    mls_id: office.OfficeMlsId || null, status: office.OfficeStatus || null,
    sync_timestamp: new Date().toISOString()
  }]);
}

// ── Sync Logging Helpers ──
async function createSyncLog(triggeredBy = 'cron') {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sync_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: 'running', triggered_by: triggeredBy })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.id || null;
  } catch { return null; }
}

async function updateSyncLog(logId, updates) {
  if (!logId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sync_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ ...updates, completed_at: new Date().toISOString() })
    });
  } catch { /* non-critical */ }
}

// ── Vercel Handler ──
export default async function handler(req, res) {
  // Parsing HTTP requests including potential JSON from upstash
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (!req.headers['x-vercel-cron']) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  let body = {};
  if (req.method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch(e) {}
  }

  // The Chunked Job State Machine
  const state = body.state || {
    step: 'broker',
    skipToken: null,
    stats: { broker: 0, idx: 0, agents: 0 },
    logId: null,
    startTime: Date.now()
  };

  const activeFilter = "MlsStatus eq 'Active' or MlsStatus eq 'Active Under Contract' or MlsStatus eq 'Pending'";

  // Create logging session if this is the very first chunk
  if (!state.logId) {
    const triggeredBy = req.query.trigger || (req.headers['x-vercel-cron'] ? 'cron' : 'qstash');
    state.logId = await createSyncLog(triggeredBy);
    if (state.logId) {
      await updateSyncLog(state.logId, { details: { message: 'Started chunked sync natively' } });
    }
  }

  // Helper to hand over the baton to the next QStash request
  async function enqueueNext(nextState) {
    if (!qstashClient) throw new Error("QSTASH_TOKEN missing, cannot chain execution.");
    if (!APP_URL) throw new Error("APP_URL or VERCEL_PROJECT_PRODUCTION_URL missing, cannot chain execution.");
    
    await qstashClient.publishJSON({
      url: `${APP_URL}/api/sync`,
      body: { state: nextState },
      headers: {
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
        'x-triggered-by': 'qstash-chain'
      },
      retries: 3,
      timeout: 300 // Max upstash timeout per request instance
    });
  }

  try {
    if (state.step === 'broker') {
      const { rowsProcessed, nextSkipToken } = await processFeedPage('broker', TOKENS.broker, state.skipToken, activeFilter);
      state.stats.broker += rowsProcessed;
      
      if (nextSkipToken) {
        // Enqueue the next page
        state.skipToken = nextSkipToken;
        await enqueueNext(state);
      } else {
        // Enqueue the next step
        state.step = 'idx';
        state.skipToken = null;
        await enqueueNext(state);
      }
    } 
    else if (state.step === 'idx') {
      const { rowsProcessed, nextSkipToken } = await processFeedPage('idx', TOKENS.idx, state.skipToken, activeFilter);
      state.stats.idx += rowsProcessed;
      
      if (nextSkipToken && state.stats.idx < 10000) {
        state.skipToken = nextSkipToken;
        await enqueueNext(state);
      } else {
        state.step = 'agents';
        state.skipToken = null;
        await enqueueNext(state);
      }
    }
    else if (state.step === 'agents') {
      const agentCount = await syncAgents();
      state.stats.agents = agentCount;
      
      state.step = 'office';
      state.skipToken = null;
      await enqueueNext(state);
    }
    else if (state.step === 'office') {
      await syncOffice();
      
      // End of pipeline!
      const elapsedSeconds = Math.round((Date.now() - (state.startTime || Date.now())) / 1000);
      
      await updateSyncLog(state.logId, {
        status: 'success',
        duration_seconds: elapsedSeconds,
        properties_upserted: state.stats.broker + state.stats.idx,
        agents_upserted: state.stats.agents,
        office_updated: true,
        details: { message: 'Sync pipeline completed successfully!', final_stats: state.stats }
      });
      return res.status(200).json({ success: true, message: 'Sync pipeline completed!', state });
    }

    // Acknowledge the current chunk execution gracefully
    return res.status(200).json({ success: true, message: `Chunk ${state.step} executed successfully. Next phase queued.`, state });

  } catch (err) {
    console.error(`Chunk error at step ${state.step}:`, err);
    await updateSyncLog(state.logId, {
      status: 'failed',
      error_message: err.message,
      details: { step_failed: state.step, state, error: err.stack }
    });
    return res.status(500).json({ success: false, error: err.message, state });
  }
}
