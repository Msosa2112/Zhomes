const fs = require('fs');

try {
  const filepath = 'C:/Users/15026/.gemini/antigravity/brain/908cac47-a251-43f7-993f-4138f449fada/.system_generated/steps/1298/output.txt';
  const fileContent = fs.readFileSync(filepath, 'utf8');
  
  // Parse the whole result first
  const parsedFile = JSON.parse(fileContent);
  const resultStr = parsedFile.result;
  
  // Extract JSON string inside <untrusted-data...
  const match = resultStr.match(/\[.*\]/s);
  if (!match) throw new Error("Could not find array in string");
  
  const data = JSON.parse(match[0]);

  const mockProperties = data.map(row => {
    let images = [];
    try {
      images = JSON.parse(row.photos || '[]');
    } catch(e) {}
    
    return {
      id: row.id,
      address: row.unparsed_address || 'Sin Dirección',
      price: parseInt(row.current_price_public || 0),
      image: images[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
      images: images,
      beds: parseInt(row.beds_total || 0),
      baths: parseInt(row.baths_total || 0),
      sqft: Number(row.building_area_total || 0),
      type: (row.property_type_label || '').toLowerCase().includes('condo') ? 'apartamento' : 'casa',
      description: row.public_remarks || 'Hermosa propiedad recién ingresada.',
      lat: Number(row.latitude || 38.15),
      lng: Number(row.longitude || -85.7),
      exclusive: Math.random() > 0.8,
      city: 'Louisville, KY'
    };
  });

  const targetFile = 'c:/TRABAJO/ZHOMES/app/code/zhomes-app/src/data/mockData.js';
  let mockDataJs = fs.readFileSync(targetFile, 'utf8');
  const replacement = `export const MOCK_PROPERTIES = ${JSON.stringify(mockProperties, null, 4)};`;

  let startMatch = mockDataJs.indexOf('export const MOCK_PROPERTIES = [');
  let endMatch = mockDataJs.indexOf('// Usuarios demo para login');
  
  if (startMatch !== -1 && endMatch !== -1) {
    let newFile = mockDataJs.slice(0, startMatch) + replacement + '\n\n' + mockDataJs.slice(endMatch);
    fs.writeFileSync(targetFile, newFile);
    console.log(`Updated mockData.js with ${mockProperties.length} items from Supabase!`);
  } else {
    console.log("Could not find boundaries.");
  }

} catch(err) {
  console.error("Error generation mock:", err);
}
