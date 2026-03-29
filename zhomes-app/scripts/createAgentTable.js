import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createTable() {
    const url = new URL(process.env.VITE_SUPABASE_URL);
    const ref = url.hostname.split('.')[0];
    
    const sqlFile1 = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260328_zhomes_agent_tables.sql'), 'utf-8');
    
    // Add GRANT statements so anon can insert to these tables
    const q = `
        ${sqlFile1}
        
        GRANT ALL ON TABLE public.zhomes_agents TO anon;
        GRANT ALL ON TABLE public.zhomes_agents TO authenticated;
        GRANT ALL ON TABLE public.zhomes_agents TO service_role;
        CREATE POLICY "anon_all_agents" ON public.zhomes_agents FOR ALL USING (true) WITH CHECK (true);

        GRANT ALL ON TABLE public.zhomes_office TO anon;
        GRANT ALL ON TABLE public.zhomes_office TO authenticated;
        GRANT ALL ON TABLE public.zhomes_office TO service_role;
        CREATE POLICY "anon_all_office" ON public.zhomes_office FOR ALL USING (true) WITH CHECK (true);

        NOTIFY pgrst, 'reload schema';
    `;
    
    try {
        const res = await fetch('https://api.supabase.com/v1/projects/' + ref + '/query', {
            method: 'POST',
            headers: {
                // Same management API token used successfully in createTable.js
                'Authorization': 'Bearer sbp_7a7400e19f6c5561ac045c4d7043d5d8458fe136',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: q })
        });
        const data = await res.json();
        console.dir(data, { depth: null });
    } catch (err) {
        console.error("Error defining table:", err);
    }
}

createTable();
