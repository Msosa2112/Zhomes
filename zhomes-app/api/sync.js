/**
 * api/sync.js — Vercel Serverless Function
 * 
 * Triggered by Vercel Cron Jobs at 6am and 6pm EST.
 * Runs the full MLS → Supabase sync without touching the app.
 * 
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */

const SUPABASE_URL = 'https://elhqcwpqbnxafaepmswl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SPARK_BASE   = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

const TOKENS = {
  broker: process.env.SPARK_BROKER_TOKEN || '6ojczz7todkepnsvryhw7m8ka',
  idx:    process.env.SPARK_IDX_TOKEN    || 'ayj1thvzmwsmpbn1ami7c8z85'
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

async function crawlFeed(tokenName, token, maxProperties = Infinity) {
  let total = 0, skipToken = null, page = 0, seenTokens = new Set();

  while (page < 5000 && total < maxProperties) {
    const params = { '$expand': 'Media' };
    if (skipToken) params['$skiptoken'] = skipToken;

    const data = await sparkFetch(token, 'Property', params);
    const results = data.value || [];
    if (!results.length) break;

    const remaining = maxProperties - total;
    const rows = results.slice(0, remaining).map(p => transformProperty(p, tokenName));
    await supabaseUpsert('mls_properties', rows).catch(async () => {
      for (let i = 0; i < rows.length; i += 25)
        await supabaseUpsert('mls_properties', rows.slice(i, i + 25)).catch(() => {});
    });

    total += rows.length;
    page++;
    if (total >= maxProperties) break;

    const nextLink = data['@odata.nextLink'];
    if (!nextLink) break;
    const newToken = new URL(nextLink).searchParams.get('$skiptoken');
    if (!newToken || seenTokens.has(newToken)) break;
    seenTokens.add(newToken);
    skipToken = newToken;
    await sleep(100);
  }
  return total;
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

// ── Vercel Handler ──
export default async function handler(req, res) {
  // Security: only allow Vercel Cron or requests with CRON_SECRET
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const start = Date.now();
  const log = [];

  try {
    log.push('Starting MLS sync...');
    
    const brokerTotal = await crawlFeed('broker', TOKENS.broker);
    log.push(`Broker feed: ${brokerTotal} properties`);
    
    const idxTotal = await crawlFeed('idx', TOKENS.idx, 10_000);
    log.push(`IDX feed: ${idxTotal} properties (limit 10k)`);
    
    const agentCount = await syncAgents();
    log.push(`Agents: ${agentCount} synced`);
    
    await syncOffice();
    log.push('Office: synced');

    const elapsed = Math.round((Date.now() - start) / 1000);
    log.push(`Done in ${elapsed}s`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_seconds: elapsed,
      log
    });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ success: false, error: err.message, log });
  }
}
