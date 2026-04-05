const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envStr = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
envStr.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = line.substring(line.indexOf('=') + 1).replace(/"/g, '').trim();
    }
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['SUPABASE_SERVICE_KEY']; // <- KEY DE ADMIN PARA SALTAR RESTRICCIONES

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    console.log("Forzando confirmaciones y creando cuentas restriñidas...");

    // 1. Obtener los usuarios actuales para confirmar el realtor
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr) {
        console.error("Error leyendo usuarios:", usersErr.message);
    } else {
        const realtor = usersData.users.find(u => u.email === 'realtor@zhomes.com');
        if (realtor) {
            const { error: confErr } = await supabase.auth.admin.updateUserById(realtor.id, { email_confirm: true });
            if (confErr) console.error("Error confirmando Realtor:", confErr.message);
            else console.log("Realtor@zhomes.com CONFIRMADO exitosamente.");
        }
    }

    // 2. Crear al broker desde la consola de Admin (Bypass email y limits)
    console.log("Añadiendo Broker forzosamente...");
    const { data: bData, error: bErr } = await supabase.auth.admin.createUser({
        email: 'broker@zhomes.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'broker', name: 'Broker Testing' }
    });

    if (bErr) console.log("Aviso Broker:", bErr.message);
    else console.log("Broker@zhomes.com creado y CONFIRMADO exitosamente.");
}

run();
