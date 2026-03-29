/**
 * sync-properties-final.mjs
 * Syncs ZHomes MLS properties from Spark API → Supabase (new project).
 * Filters by ListOfficeKey to get only ZHomes listings.
 * Uses service_role key to bypass RLS.
 */

const SUPABASE_URL = 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';

const SPARK_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';
const TOKENS = {
  broker: '6ojczz7todkepnsvryhw7m8ka',
  idx: 'ayj1thvzmwsmpbn1ami7c8z85'
};

async function sparkFetch(token, path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${SPARK_BASE}/${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'X-SparkApi-User-Agent': 'ZhomesApp/1.0' }
  });
  if (!res.ok) throw new Error(`Spark ${res.status} @ ${path}: ${await res.text().then(t => t.substring(0, 150))}`);
  return res.json();
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
    baths: raw.BathroomsTotalInteger || raw.BathroomsTotalDecimal || 0,
    baths_full: Math.round(raw.BathroomsFull || 0),
    baths_half: Math.round(raw.BathroomsHalf || 0),
    sqft: Math.round(raw.LivingArea || 0),
    lot_size: raw.LotSizeAcres || null,
    year_built: raw.YearBuilt ? Math.round(raw.YearBuilt) : null,
    stories: raw.Stories ? Math.round(raw.Stories) : null,
    garage_spaces: raw.GarageSpaces ? Math.round(raw.GarageSpaces) : null,
    description: raw.PublicRemarks || null,
    primary_photo: photos[0] || null,
    photos: photos.length > 0 ? photos : null,
    list_date: raw.ListDate || null,
    close_date: raw.CloseDate || null,
    on_market_date: raw.OnMarketDate || null,
    list_agent_name: raw.ListAgentFullName || null,
    list_agent_key: raw.ListAgentKey || null,
    list_office_name: raw.ListOfficeName || null,
    list_office_key: raw.ListOfficeKey || null,
    subdivision: raw.SubdivisionName || null,
    fireplace_yn: raw.FireplaceYN || false,
    garage_yn: raw.GarageYN || false,
    hoa_yn: raw.AssociationYN || null,
    hoa_fee: raw.AssociationFee || null,
    virtual_tour_url: raw.VirtualTourURLUnbranded || null,
    cooling: raw.Cooling || null,
    heating: raw.Heating || null,
    pool_features: raw.PoolFeatures || null,
    parking_features: raw.ParkingFeatures || null,
    basement: raw.Basement || null,
    exterior_features: raw.ExteriorFeatures || null,
    is_zhomes: String(raw.ListOfficeKey || '') === ZHOMES_OFFICE_KEY,
    spark_source: source,
    sync_timestamp: new Date().toISOString()
  };
}

// Broker upsert: writes is_zhomes correctly
async function upsertBatch(rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mls_properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert ${res.status}: ${err.substring(0, 300)}`);
  }
}

// IDX upsert: strips is_zhomes to never overwrite broker-set value
async function upsertBatchIDX(rows) {
  if (rows.length === 0) return;
  const safeRows = rows.map(({ is_zhomes, ...rest }) => rest);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mls_properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(safeRows)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsertIDX ${res.status}: ${err.substring(0, 300)}`);
  }
}

// Re-flag all ZHomes properties by office name after IDX run
async function reflagZHomes() {
  console.log('  🏷️  Re-flagging ZHomes by office name...');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/mls_properties?list_office_name=ilike.*ZHomes*`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ is_zhomes: true })
    }
  );
  if (!res.ok) {
    console.warn('  ⚠️  reflag warning:', (await res.text()).substring(0, 150));
  } else {
    const data = await res.json();
    console.log(`  ✅ Re-flagged ${Array.isArray(data) ? data.length : '?'} ZHomes properties`);
  }
}

async function crawlAll() {
  // 1. Broker: all ZHomes listings (active + closed + all statuses)
  console.log('\nCrawling broker feed (ZHomes office filter)...');
  let brokerTotal = 0;
  let skipToken = null;
  const seenTokens = new Set();
  const brokerFilter = `ListOfficeKey eq '${ZHOMES_OFFICE_KEY}'`;

  while (true) {
    try {
      const params = { '$expand': 'Media', '$filter': brokerFilter };
      if (skipToken) params['$skiptoken'] = skipToken;
      const data = await sparkFetch(TOKENS.broker, 'Property', params);
      const results = data.value || [];
      if (results.length === 0) { console.log('  Empty page. Done.'); break; }

      const rows = results.map(p => transformProperty(p, 'broker'));
      await upsertBatch(rows).catch(async () => {
        for (let i = 0; i < rows.length; i += 25) {
          await upsertBatch(rows.slice(i, i + 25)).catch(e => console.error('  Chunk error:', e.message));
        }
      });
      brokerTotal += rows.length;
      console.log(`  Broker: ${brokerTotal} properties synced...`);

      const nextLink = data['@odata.nextLink'];
      if (!nextLink) break;
      const newToken = new URL(nextLink).searchParams.get('$skiptoken');
      if (!newToken || seenTokens.has(newToken)) break;
      seenTokens.add(newToken);
      skipToken = newToken;
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error('  Error:', err.message);
      break;
    }
  }
  console.log(`  Broker done: ${brokerTotal} ZHomes properties`);

  // 2. IDX: broader MLS listings (up to 5000)
  console.log('\nCrawling IDX feed (all active listings, up to 5000)...');
  let idxTotal = 0;
  skipToken = null;
  seenTokens.clear();

  while (idxTotal < 5000) {
    try {
      const params = { '$expand': 'Media', '$filter': "MlsStatus eq 'Active'" };
      if (skipToken) params['$skiptoken'] = skipToken;
      const data = await sparkFetch(TOKENS.idx, 'Property', params);
      const results = data.value || [];
      if (results.length === 0) { console.log('  Empty page. Done.'); break; }

      const remaining = 5000 - idxTotal;
      const rows = results.slice(0, remaining).map(p => transformProperty(p, 'idx'));
      // Use IDX-safe upsert that does NOT overwrite is_zhomes
      await upsertBatchIDX(rows).catch(async () => {
        for (let i = 0; i < rows.length; i += 25) {
          await upsertBatchIDX(rows.slice(i, i + 25)).catch(e => console.error('  Chunk error:', e.message));
        }
      });
      idxTotal += rows.length;
      if (idxTotal % 500 === 0) console.log(`  IDX: ${idxTotal} properties synced...`);

      if (idxTotal >= 5000) break;

      const nextLink = data['@odata.nextLink'];
      if (!nextLink) break;
      const newToken = new URL(nextLink).searchParams.get('$skiptoken');
      if (!newToken || seenTokens.has(newToken)) break;
      seenTokens.add(newToken);
      skipToken = newToken;
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error('  Error:', err.message);
      break;
    }
  }
  console.log(`  IDX done: ${idxTotal} MLS properties`);

  // Re-flag ZHomes after IDX (IDX may have new ZHomes listings without is_zhomes)
  await reflagZHomes();

  return brokerTotal + idxTotal;
}

async function main() {
  const start = Date.now();
  console.log('============================================');
  console.log('  Spark MLS -> Supabase Property Sync');
  console.log('  Project: bnbvzcllyfmzuhnjltxg');
  console.log('  Key: service_role');
  console.log(`  ${new Date().toLocaleString()}`);
  console.log('============================================');

  const total = await crawlAll();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('\n============================================');
  console.log(`  DONE. ${total} total properties synced`);
  console.log(`  Time: ${elapsed}s`);
  console.log('============================================\n');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
