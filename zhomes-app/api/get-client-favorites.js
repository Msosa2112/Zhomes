export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // 1. Get user by email
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;

        const targetUser = usersData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!targetUser) {
            return res.status(404).json({ error: 'Client not found', favorites: [] });
        }

        // 2. Fetch their favorites
        const { data: favs, error: favsError } = await supabase
            .from('user_favorites')
            .select('property_data')
            .eq('user_id', targetUser.id);
            
        if (favsError) throw favsError;

        return res.status(200).json({ favorites: favs.map(f => f.property_data) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
