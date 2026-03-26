import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://elhqcwpqbnxafaepmswl.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
    { email: 'broker@zhomes.com', password: 'Password123!', metadata: { role: 'broker' } },
    { email: 'realtor@zhomes.com', password: 'Password123!', metadata: { role: 'realtor' } },
    { email: 'client@zhomes.com', password: 'Password123!', metadata: { role: 'client' } }
];

async function createUsers() {
    for (const user of users) {
        console.log(`Intentando registrar: ${user.email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: user.metadata
            }
        });

        if (error) {
            console.error(`Error con ${user.email}:`, error.message);
        } else {
            console.log(`Exitoso para ${user.email}! User ID: ${data.user?.id}`);
        }
    }
}

createUsers();
