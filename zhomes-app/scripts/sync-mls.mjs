/**
 * Spark MLS → Supabase Sync Script (Full)
 * 
 * Syncs properties, agents, and office data from Spark API into Supabase.
 * Uses SUPABASE_SERVICE_KEY (service_role) to bypass RLS for writing.
 * 
 * Usage: node scripts/sync-mls.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
try {
  const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)=\"?([^\"]*)\"?$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
// Prefer service_role key (bypasses RLS) — falls back to anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';
console.log('Using key role:', SUPABASE_KEY.includes('service_role') ? 'service_role ✅' : 'anon (write policies required)');

const SPARK_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

const TOKENS = {
  broker: '6ojczz7todkepnsvryhw7m8ka',
  idx: 'ayj1thvzmwsmpbn1ami7c8z85'
};

// ── Generic Spark fetch ──
async function sparkFetch(token, path, params = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `${SPARK_BASE}/${path}${searchParams ? '?' + searchParams : ''}`;
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-SparkApi-User-Agent': 'ZhomesApp/1.0'
    }
  });
  if (!res.ok) throw new Error(`Spark ${res.status} @ ${path}: ${await res.text().then(t => t.substring(0, 150))}`);
  return res.json();
}

// ── Transform Spark property to Supabase row ──
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
    lot_size_unit: raw.LotSizeUnits || 'Acres',
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
    buyer_office_mls_id: raw.BuyerOfficeMlsId || null,
    subdivision: raw.SubdivisionName || null,
    architectural_style: raw.ArchitecturalStyle || null,
    construction: raw.ConstructionMaterials || null,
    cooling: raw.Cooling || null,
    heating: raw.Heating || null,
    roof: raw.Roof || null,
    sewer: raw.Sewer || null,
    water_source: raw.WaterSource || null,
    exterior_features: raw.ExteriorFeatures || null,
    patio_features: raw.PatioAndPorchFeatures || null,
    pool_features: raw.PoolFeatures || null,
    parking_features: raw.ParkingFeatures || null,
    basement: raw.Basement || null,
    fireplace_yn: raw.FireplaceYN || false,
    fireplaces_total: Math.round(raw.FireplacesTotal || 0),
    garage_yn: raw.GarageYN || false,
    hoa_yn: raw.AssociationYN || null,
    hoa_fee: raw.AssociationFee || null,
    virtual_tour_url: raw.VirtualTourURLUnbranded || null,
    mls_area: raw.MLSAreaMajor || null,
    directions: raw.Directions || null,
    is_zhomes: String(raw.ListOfficeKey || '') === ZHOMES_OFFICE_KEY,
    spark_source: source,
    sync_timestamp: new Date().toISOString()
  };
}

// ── Upsert for BROKER feed (writes is_zhomes correctly) ──
async function upsertBatch(table, rows) {
  if (rows.length === 0) return;
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert [${table}] ${res.status}: ${err.substring(0, 200)}`);
  }
}

// ── Upsert for IDX feed: never overwrites is_zhomes ──
// Uses onConflict to ignore is_zhomes column via ignoreDuplicates trick:
// We strip is_zhomes from IDX rows before upserting, then re-flag via SQL.
async function upsertBatchIDX(table, rows) {
  if (rows.length === 0) return;
  // Remove is_zhomes from IDX rows so we never overwrite it
  const safeRows = rows.map(({ is_zhomes, ...rest }) => rest);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(safeRows)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsertIDX [${table}] ${res.status}: ${err.substring(0, 200)}`);
  }
}

// ── After IDX sync: re-flag all ZHomes properties by office name ──
async function reflagZHomesProperties() {
  console.log('\n🏷️  Re-flagging ZHomes properties by office name...');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/mls_properties?list_office_name=ilike.*ZHomes*`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ is_zhomes: true })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.warn('  ⚠️  reflag warning:', err.substring(0, 150));
  } else {
    const data = await res.json();
    console.log(`  ✅ Re-flagged ${Array.isArray(data) ? data.length : '?'} ZHomes properties`);
  }
}


// ── Crawl all pages of properties from a single Spark token ──
async function crawlProperties(tokenName, token, maxProperties = Infinity, filter = null, isIDX = false) {
  console.log(`\n🔄 Crawling ${tokenName} feed... (limit: ${maxProperties === Infinity ? 'none' : maxProperties.toLocaleString()})`);
  const upsert = isIDX ? upsertBatchIDX : upsertBatch;
  const allRows = [];
  const seenTokens = new Set();
  let skipToken = null;
  let page = 0;

  while (page < 5000 && allRows.length < maxProperties) {
    try {
      const params = { '$expand': 'Media' };
      if (filter) params['$filter'] = filter;
      if (skipToken) params['$skiptoken'] = skipToken;

      const data = await sparkFetch(token, 'Property', params);
      const results = data.value || [];

      if (results.length === 0) { console.log(`   📭 Empty page. Done.`); break; }

      // Respect the maxProperties cap
      const remaining = maxProperties - allRows.length;
      const rows = results.slice(0, remaining).map(p => transformProperty(p, tokenName));
      allRows.push(...rows);
      page++;

      if (page % 50 === 0 || allRows.length >= maxProperties) {
        console.log(`   📦 Page ${page}: ${allRows.length.toLocaleString()} total`);
      }

      // Batch upsert every 100 rows
      if (allRows.length % 100 < rows.length) {
        await upsert('mls_properties', rows).catch(async () => {
          for (let i = 0; i < rows.length; i += 25) {
            await upsert('mls_properties', rows.slice(i, i + 25)).catch(e =>
              console.error(`   ❌ Chunk failed:`, e.message)
            );
          }
        });
      }

      if (allRows.length >= maxProperties) {
        console.log(`   🏁 Reached limit of ${maxProperties.toLocaleString()} properties. Stopping.`);
        break;
      }

      const nextLink = data['@odata.nextLink'];
      if (!nextLink) break;

      const newSkipToken = new URL(nextLink).searchParams.get('$skiptoken');
      if (!newSkipToken || seenTokens.has(newSkipToken)) { console.log(`   🔁 Pagination loop. Stopping.`); break; }

      seenTokens.add(newSkipToken);
      skipToken = newSkipToken;
      await new Promise(r => setTimeout(r, 100));

    } catch (err) {
      console.error(`   ❌ Error on page ${page}:`, err.message);
      break;
    }
  }

  // Final flush of remaining rows
  if (allRows.length > 0) {
    await upsert('mls_properties', allRows).catch(async () => {
      for (let i = 0; i < allRows.length; i += 50) {
        await upsert('mls_properties', allRows.slice(i, i + 50)).catch(e =>
          console.error(`   ❌ Chunk ${i} failed:`, e.message)
        );
      }
    });
  }

  // After IDX sync: re-mark all ZHomes properties (prevents overwrite)
  if (isIDX) {
    await reflagZHomesProperties();
  }

  console.log(`   ✅ ${tokenName}: ${allRows.length.toLocaleString()} properties synced (${page} pages)`);
  return allRows.length;
}


// ── Sync ZHomes Agents to Supabase ──
async function syncAgents() {
  console.log('\n👥 Syncing ZHomes agents...');
  try {
    const data = await sparkFetch(TOKENS.broker, 'Member', {
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

    if (agents.length > 0) {
      await upsertBatch('zhomes_agents', agents);
      console.log(`   ✅ ${agents.length} agents synced`);
    }

    // Fetch closed deals per agent for stats
    console.log('   📊 Fetching agent stats...');
    for (const agent of agents) {
      try {
        const dealsData = await sparkFetch(TOKENS.broker, 'Property', {
          '$filter': `ListAgentKey eq '${agent.id}' and MlsStatus eq 'Closed'`,
          '$top': '100',
          '$orderby': 'CloseDate desc',
          '$select': 'ListingKey,UnparsedAddress,ClosePrice,CloseDate,City'
        });
        const deals = dealsData.value || [];
        const totalVolume = deals.reduce((s, d) => s + (d.ClosePrice || 0), 0);

        await upsertBatch('zhomes_agents', [{
          id: agent.id,
          total_closed: deals.length,
          total_volume: totalVolume,
          avg_price: deals.length > 0 ? Math.round(totalVolume / deals.length) : 0,
          last_close_date: deals[0]?.CloseDate || null,
          recent_deals: deals.slice(0, 5).map(d => ({
            address: d.UnparsedAddress, price: d.ClosePrice,
            date: d.CloseDate, city: d.City
          })),
          sync_timestamp: new Date().toISOString()
        }]);

        await new Promise(r => setTimeout(r, 150)); // rate limit
      } catch (err) {
        console.warn(`   ⚠️  Stats for agent ${agent.full_name}: ${err.message}`);
      }
    }
    console.log(`   ✅ Agent stats updated`);

  } catch (err) {
    console.error('   ❌ Agent sync failed:', err.message);
  }
}

// ── Sync ZHomes Office to Supabase ──
async function syncOffice() {
  console.log('\n🏢 Syncing ZHomes office...');
  try {
    const office = await sparkFetch(TOKENS.broker, `Office('${ZHOMES_OFFICE_KEY}')`);
    if (office?.OfficeKey) {
      await upsertBatch('zhomes_office', [{
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
      console.log(`   ✅ Office "${office.OfficeName}" synced`);
    }
  } catch (err) {
    console.error('   ❌ Office sync failed:', err.message);
  }
}

// ── Main ──
async function main() {
  const start = Date.now();
  console.log('═══════════════════════════════════════════════');
  console.log('  Spark MLS → Supabase Full Sync');
  console.log(`  ${new Date().toLocaleString('es-US')}`);
  console.log('═══════════════════════════════════════════════');

  let totalProps = 0;

  // 1. Properties (Broker: all ZHomes listings)
  const brokerFilter = `ListOfficeKey eq '${ZHOMES_OFFICE_KEY}'`;
  totalProps += await crawlProperties('broker', TOKENS.broker, Infinity, brokerFilter);

  // 2. Agents + stats
  await syncAgents();

  // 3. Office
  await syncOffice();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  ✅ SYNC COMPLETE`);
  console.log(`  Properties: ${totalProps}`);
  console.log(`  Duration: ${elapsed}s`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
