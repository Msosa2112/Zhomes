import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createTable() {
    const url = new URL(process.env.VITE_SUPABASE_URL);
    const ref = url.hostname.split('.')[0];
    
    // Create 'listings' table in Supabase
    const q = `
        GRANT ALL ON TABLE public.listings TO anon;
        GRANT ALL ON TABLE public.listings TO authenticated;
        GRANT ALL ON TABLE public.listings TO service_role;
        NOTIFY pgrst, 'reload schema';
    `;
    
    try {
        const res = await fetch('https://api.supabase.com/v1/projects/' + ref + '/query', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer sbp_7a7400e19f6c5561ac045c4d7043d5d8458fe136',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: q })
        });
        const data = await res.json();
        console.log("Create Table Response:", data);
    } catch (err) {
        console.error("Error defining table:", err);
    }
}

createTable();
