import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SPARK_API_KEY = 'ayj1thvzmwsmpbn1ami7c8z85';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; 

if (!SPARK_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables (Spark or Supabase keys).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncListings() {
  console.log('--- Starting Spark API to Supabase Sync ---');
  console.log('Fetching top 100 properties from Spark API...');

  const sparkUrl = 'https://replication.sparkapi.com/Version/3/Reso/OData/Property?$top=100&$filter=StandardStatus eq \'Active\'';

  try {
    const response = await fetch(sparkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SPARK_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Spark API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const properties = data.value;

    if (!properties || properties.length === 0) {
      console.log('No properties found from Spark API.');
      return;
    }

    console.log(`Downloaded ${properties.length} properties. Mapping data...`);

    const formattedListings = properties.map(prop => {
      // Tomamos la primera foto del array Media si existe
      const media = prop.Media || [];
      const primaryPhotoUrl = media.length > 0 ? media[0].MediaURL : 'https://placehold.co/600x400/111/fff?text=No+Photo';

      return {
        id: prop.ListingId || prop.ListingKey,
        price: prop.ListPrice || 0,
        city: prop.City || 'Unknown',
        address: prop.UnparsedAddress || prop.StreetName || 'Address Hidden',
        beds: prop.BedroomsTotal || 0,
        baths: prop.BathroomsTotalInteger || prop.BathroomsFull || 0,
        sqft: prop.LivingArea || 0,
        property_type: prop.PropertyType || 'Residential',
        description: prop.PublicRemarks || '',
        status: prop.StandardStatus || 'Active',
        primary_photo: primaryPhotoUrl,
        photos: media,
        latitude: prop.Latitude || null,
        longitude: prop.Longitude || null,
        raw_data: prop, // Guarda todo el JSON original por si acaso
        updated_at: new Date().toISOString()
      };
    });

    console.log('Saving to Supabase `listings` table...');

    const { error } = await supabase
      .from('listings')
      .upsert(formattedListings, { onConflict: 'id' });

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log(`✅ Success! Synced ${formattedListings.length} listings to Supabase.`);
    }

  } catch (error) {
    console.error('------- FATAL ERROR -------');
    console.error(error.stack || error);
    fs.writeFileSync('node_error.log', error.stack || String(error));
  }
}

syncListings().catch(err => {
  console.error('Unhandled top-level error:', err.stack || err);
  fs.writeFileSync('node_error.log', err.stack || String(err));
});
