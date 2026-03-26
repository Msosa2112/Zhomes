import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

import { MOCK_PROPERTIES } from '../src/data/mockData.js';

async function seed() {
    console.log("Generating 300 properties for Supabase seed...");
    // Create 300 variations of mock data with jittered locations in Louisville
    const formattedProps = [];
    
    for (let i = 0; i < 300; i++) {
        const base = MOCK_PROPERTIES[i % MOCK_PROPERTIES.length];
        
        // Jitter lat/lng by about ~5 miles max
        const latJitter = (Math.random() - 0.5) * 0.15;
        const lngJitter = (Math.random() - 0.5) * 0.15;
        
        formattedProps.push({
            id: String(i + 100000), // unique id
            address: `${i} ${base.address}`,
            price: base.price + Math.floor((Math.random() - 0.5) * 50000),
            primary_photo: base.image,
            photos: [{ MediaURL: base.image }],
            beds: base.beds + Math.floor(Math.random() * 3),
            baths: base.baths + Math.floor(Math.random() * 2),
            sqft: base.sqft + Math.floor(Math.random() * 500),
            property_type: 'Residential',
            description: base.title || 'Beautiful updated home in great location.',
            latitude: Number(base.lat) + latJitter,
            longitude: Number(base.lng) + lngJitter,
            exclusive: base.exclusive || false,
            city: 'Louisville',
            status: Math.random() > 0.8 ? 'OffMarket' : 'Active'
        });
    }

    console.log("Inserting properties into Supabase 'listings' table...");
    for (let i = 0; i < formattedProps.length; i += 100) {
        const chunk = formattedProps.slice(i, i + 100);
        const { error } = await supabase.from('listings').upsert(chunk, { onConflict: 'id' });
        if (error) {
            console.error("Error inserting chunk:", error.message);
        } else {
            console.log(`Inserted chunk ${i/100 + 1}`);
        }
    }
    console.log("Seeding complete.");
}

seed();
