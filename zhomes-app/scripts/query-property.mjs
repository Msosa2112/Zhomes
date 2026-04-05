/**
 * Spark MLS - Query a specific property by address
 * Usage: node scripts/query-property.mjs
 */

const SPARK_BASE = 'https://replication.sparkapi.com/Version/3/Reso/OData';
const TOKENS = {
  broker: '6ojczz7todkepnsvryhw7m8ka',
  idx: 'ayj1thvzmwsmpbn1ami7c8z85'
};

async function sparkFetch(token, path, params = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `${SPARK_BASE}/${path}${searchParams ? '?' + searchParams : ''}`;
  console.log(`\n🔍 Querying: ${url}\n`);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-SparkApi-User-Agent': 'ZhomesApp/1.0'
    }
  });
  if (!res.ok) throw new Error(`Spark ${res.status}: ${await res.text().substring(0, 300)}`);
  return res.json();
}

// Search for "1311 Scholar St"
const data = await sparkFetch(TOKENS.broker, 'Property', {
  '$filter': "UnparsedAddress eq '1311 Scholar St'",
  '$select': [
    'ListingKey','ListingId','UnparsedAddress','City','StateOrProvince','PostalCode',
    'ListPrice','ClosePrice','StandardStatus','MlsStatus','PropertyType','PropertySubType',
    'BedroomsTotal','BathroomsTotalInteger','LivingArea','LotSizeAcres',
    'YearBuilt','ListingContractDate','CloseDate','DaysOnMarket',
    'PublicRemarks','PrivateRemarks',
    'ListAgentFullName','ListOfficeName',
    'BuyerAgentFullName','BuyerOfficeName',
    'OriginalListPrice','PreviousListPrice',
    'PriceChangeTimestamp','StatusChangeTimestamp',
    'Ownership','TaxAnnualAmount','TaxYear',
    'Zoning','Sewer','WaterSource',
    'Contingency','ContingencyDate',
    'SpecialListingConditions'
  ].join(','),
  '$expand': 'Media',
  '$top': '5'
});

if (!data.value || data.value.length === 0) {
  console.log('❌ No property found with exact address. Trying partial match...\n');
  
  // Try partial match with UnparsedAddress contains
  const data2 = await sparkFetch(TOKENS.broker, 'Property', {
    '$filter': "contains(UnparsedAddress, '1311 Scholar')",
    '$select': [
      'ListingKey','ListingId','UnparsedAddress','City','StateOrProvince',
      'ListPrice','ClosePrice','StandardStatus','MlsStatus',
      'OriginalListPrice','PreviousListPrice','PriceChangeTimestamp',
      'SpecialListingConditions','PublicRemarks','PrivateRemarks',
      'YearBuilt','LivingArea','BedroomsTotal','BathroomsTotalInteger',
      'ListAgentFullName','ListOfficeName','DaysOnMarket','TaxAnnualAmount'
    ].join(','),
    '$top': '5'
  });

  if (!data2.value || data2.value.length === 0) {
    console.log('❌ Still not found. Trying IDX token...\n');
    const data3 = await sparkFetch(TOKENS.idx, 'Property', {
      '$filter': "contains(UnparsedAddress, '1311 Scholar')",
      '$select': 'ListingKey,ListingId,UnparsedAddress,City,ListPrice,StandardStatus,MlsStatus,OriginalListPrice,SpecialListingConditions,PublicRemarks,YearBuilt,LivingArea,DaysOnMarket',
      '$top': '5'
    });
    console.log(JSON.stringify(data3.value, null, 2));
  } else {
    console.log(`✅ Found ${data2.value.length} result(s):\n`);
    for (const p of data2.value) {
      console.log('═══════════════════════════════════════════');
      console.log(`📍 Address:           ${p.UnparsedAddress}, ${p.City}, ${p.StateOrProvince}`);
      console.log(`💰 List Price:        $${p.ListPrice?.toLocaleString()}`);
      console.log(`💰 Original Price:    $${p.OriginalListPrice?.toLocaleString()}`);
      console.log(`💰 Previous Price:    $${p.PreviousListPrice?.toLocaleString()}`);
      console.log(`💰 Close Price:       $${p.ClosePrice?.toLocaleString()}`);
      console.log(`📊 Status:            ${p.StandardStatus} / ${p.MlsStatus}`);
      console.log(`🏠 Type:              ${p.PropertyType} - ${p.PropertySubType}`);
      console.log(`🛏️  Beds/Baths:       ${p.BedroomsTotal} bd / ${p.BathroomsTotalInteger} ba`);
      console.log(`📐 Sq Ft:             ${p.LivingArea}`);
      console.log(`📅 Year Built:        ${p.YearBuilt}`);
      console.log(`📅 Days on Market:    ${p.DaysOnMarket}`);
      console.log(`🔖 Special Conditions:${p.SpecialListingConditions}`);
      console.log(`💸 Tax Annual:        $${p.TaxAnnualAmount}`);
      console.log(`👤 Listing Agent:     ${p.ListAgentFullName} @ ${p.ListOfficeName}`);
      console.log(`📝 Public Remarks:\n   ${p.PublicRemarks}`);
      if (p.PrivateRemarks) console.log(`🔒 Private Remarks:\n   ${p.PrivateRemarks}`);
      console.log(`\n🔑 ListingKey: ${p.ListingKey} | ID: ${p.ListingId}`);
    }
  }
} else {
  console.log(`✅ Found ${data.value.length} result(s):\n`);
  for (const p of data.value) {
    console.log('═══════════════════════════════════════════');
    console.log(`📍 Address:            ${p.UnparsedAddress}, ${p.City}, ${p.StateOrProvince} ${p.PostalCode}`);
    console.log(`💰 List Price:         $${p.ListPrice?.toLocaleString()}`);
    console.log(`💰 Original Price:     $${p.OriginalListPrice?.toLocaleString()}`);
    console.log(`💰 Previous Price:     $${p.PreviousListPrice?.toLocaleString()}`);
    console.log(`💰 Close Price:        $${p.ClosePrice?.toLocaleString()}`);
    console.log(`📊 Status:             ${p.StandardStatus} / ${p.MlsStatus}`);
    console.log(`🏠 Type:               ${p.PropertyType} - ${p.PropertySubType}`);
    console.log(`🛏️  Beds/Baths:        ${p.BedroomsTotal} bd / ${p.BathroomsTotalInteger} ba`);
    console.log(`📐 Sq Ft:              ${p.LivingArea}`);
    console.log(`📅 Year Built:         ${p.YearBuilt}`);
    console.log(`📅 Days on Market:     ${p.DaysOnMarket}`);
    console.log(`📅 Listed:             ${p.ListingContractDate}`);
    console.log(`📅 Closed:             ${p.CloseDate}`);
    console.log(`📅 Price Change:       ${p.PriceChangeTimestamp}`);
    console.log(`📅 Status Change:      ${p.StatusChangeTimestamp}`);
    console.log(`🔖 Special Conditions: ${p.SpecialListingConditions}`);
    console.log(`📋 Contingency:        ${p.Contingency} (until ${p.ContingencyDate})`);
    console.log(`💸 Tax Annual:         $${p.TaxAnnualAmount} (${p.TaxYear})`);
    console.log(`🏛️  Zoning:            ${p.Zoning}`);
    console.log(`💧 Water/Sewer:        ${p.WaterSource} / ${p.Sewer}`);
    console.log(`🏢 Ownership:          ${p.Ownership}`);
    console.log(`👤 Listing Agent:      ${p.ListAgentFullName} @ ${p.ListOfficeName}`);
    console.log(`👤 Buyer Agent:        ${p.BuyerAgentFullName} @ ${p.BuyerOfficeName}`);
    console.log(`📝 Public Remarks:\n   ${p.PublicRemarks}`);
    if (p.PrivateRemarks) console.log(`🔒 Private Remarks:\n   ${p.PrivateRemarks}`);
    console.log(`📸 Photos:             ${p.Media?.length || 0} images`);
    console.log(`\n🔑 ListingKey: ${p.ListingKey} | ID: ${p.ListingId}`);
  }
}
