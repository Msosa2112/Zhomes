const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer manual el .env para Node (ya que Vite usa import.meta)
const envStr = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
envStr.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = line.substring(line.indexOf('=') + 1).replace(/"/g, '').trim();
    }
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(url, key);

async function run() {
    console.log("Creando Realtor...");
    const { data: rData, error: rErr } = await supabase.auth.signUp({
        email: 'realtor@zhomes.com',
        password: 'password123',
        options: {
            data: {
                role: 'realtor',
                name: 'Realtor Testing'
            }
        }
    });

    if (rErr) console.log("Error Realtor:", rErr.message);
    else console.log("Realtor creado exitosamente.");

    console.log("Creando Broker...");
    const { data: bData, error: bErr } = await supabase.auth.signUp({
        email: 'broker@zhomes.com', // Asumo que querias uno broker y uno realtor
        password: 'password123',
        options: {
            data: {
                role: 'broker',
                name: 'Broker Testing'
            }
        }
    });

    if (bErr) console.log("Error Broker:", bErr.message);
    else console.log("Broker creado exitosamente.");
}

run();
