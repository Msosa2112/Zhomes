/**
 * Spark MLS → Supabase Sync Script
 * 
 * Crawls both Spark tokens (Broker + IDX) and upserts
 * all property data into the Supabase mls_properties table.
 * 
 * Usage: node scripts/sync-mls.mjs
 */

const SUPABASE_URL = 'https://elhqcwpqbnxafaepmswl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4';
const SPARK_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const ZHOMES_OFFICE_KEY = '20141212170001416260000000';

const TOKENS = {
  broker: '6ojczz7todkepnsvryhw7m8ka',
  idx: 'ayj1thvzmwsmpbn1ami7c8z85'
};

const SELECT_FIELDS = [
  'ListingKey','ListingId','UnparsedAddress','City','StateOrProvince','PostalCode',
  'CountyOrParish','Latitude','Longitude','ListPrice','ClosePrice','OriginalListPrice',
  'MlsStatus','PropertyType','PropertySubType','BedroomsTotal','BathroomsTotalInteger',
  'BathroomsFull','BathroomsHalf','LivingArea','LotSizeAcres','LotSizeUnits',
  'YearBuilt','Stories','GarageSpaces','PublicRemarks','ListDate','CloseDate',
  'OnMarketDate','ListAgentFullName','ListAgentKey','ListOfficeName','ListOfficeKey',
  'BuyerOfficeMlsId','SubdivisionName','ArchitecturalStyle','ConstructionMaterials',
  'Cooling','Heating','Roof','Sewer','WaterSource','ExteriorFeatures',
  'PatioAndPorchFeatures','PoolFeatures','ParkingFeatures','Basement',
  'FireplaceYN','FireplacesTotal','GarageYN','AssociationYN','AssociationFee',
  'VirtualTourURLUnbranded','MLSAreaMajor','Directions'
].join(',');

// ── Fetch a single page from Spark ──
async function fetchSparkPage(token, skipToken = null) {
  let url = `${SPARK_BASE}/Property?$expand=Media`;
  if (skipToken) url += `&$skiptoken=${skipToken}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-SparkApi-User-Agent': 'ZhomesApp/1.0'
    }
  });
  
  if (!res.ok) throw new Error(`Spark ${res.status}: ${res.statusText}`);
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

// ── Upsert batch into Supabase ──
async function upsertBatch(rows) {
  if (rows.length === 0) return;
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mls_properties`, {
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
    throw new Error(`Supabase upsert error ${res.status}: ${err}`);
  }
}

// ── Crawl all pages from a single Spark token ──
async function crawlToken(tokenName, token) {
  console.log(`\n🔄 Crawling ${tokenName} feed...`);
  const allRows = [];
  const seenTokens = new Set();
  let skipToken = null;
  let page = 0;

  while (page < 5000) { // Safety limit
    try {
      const data = await fetchSparkPage(token, skipToken);
      const results = data.value || [];
      
      if (results.length === 0) {
        console.log(`   📭 Empty page, done.`);
        break;
      }

      const rows = results.map(p => transformProperty(p, tokenName));
      allRows.push(...rows);
      page++;
      
      if (page % 50 === 0) {
        console.log(`   📦 Page ${page}: ${allRows.length} total properties`);
      }

      // Batch upsert every 100 rows
      if (allRows.length % 100 < 10 && allRows.length > 0) {
        const batch = allRows.slice(-results.length);
        await upsertBatch(batch);
      }

      // Check next page
      const nextLink = data['@odata.nextLink'];
      if (!nextLink) break;

      const nextUrl = new URL(nextLink);
      const newSkipToken = nextUrl.searchParams.get('$skiptoken');
      
      if (!newSkipToken || seenTokens.has(newSkipToken)) {
        console.log(`   🔁 Pagination loop detected at page ${page}, stopping.`);
        break;
      }
      
      seenTokens.add(newSkipToken);
      skipToken = newSkipToken;
      
      // Rate limiting: 100ms between requests
      await new Promise(r => setTimeout(r, 100));
      
    } catch (err) {
      console.error(`   ❌ Error on page ${page}:`, err.message);
      break;
    }
  }

  // Final upsert for remaining rows
  try {
    await upsertBatch(allRows);
  } catch (err) {
    // Upsert in smaller batches if full batch fails
    console.log(`   ⚠️ Full batch failed, upserting in chunks of 50...`);
    for (let i = 0; i < allRows.length; i += 50) {
      const chunk = allRows.slice(i, i + 50);
      try {
        await upsertBatch(chunk);
      } catch (e) {
        console.error(`   ❌ Chunk ${i}-${i+50} failed:`, e.message);
      }
    }
  }

  console.log(`   ✅ ${tokenName}: ${allRows.length} properties synced (${page} pages)`);
  return allRows.length;
}

// ── Main ──
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Spark MLS → Supabase Sync');
  console.log('═══════════════════════════════════════');
  
  let total = 0;
  
  // Crawl Broker feed (ZHomes data with working $filter)  
  total += await crawlToken('broker', TOKENS.broker);
  
  // Crawl IDX feed (all MLS data)
  total += await crawlToken('idx', TOKENS.idx);
  
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  ✅ SYNC COMPLETE: ${total} properties`);
  console.log(`═══════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
