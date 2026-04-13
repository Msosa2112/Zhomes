import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'damelaletra@gmail.com';
    console.log(`Buscando usuario ${email}...`);
    
    // As in Supabase 2.x, admin api is at supabase.auth.admin
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error list users:', userError);
        return;
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
        console.error('Usuario no encontrado en Supabase Auth.');
        return;
    }
    
    console.log('Usuario encontrado:', user.id);

    // Update metadata role
    console.log('Actualizando metadata.role a "realtor"...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'realtor' }
    });
    if (updateError) {
        console.error('Error actualizando metadata:', updateError);
        return;
    }
    console.log('Role actualizado a realtor en metadata.');

    // Check zhomes_agents
    console.log('Comprobando / Insertando en zhomes_agents...');
    const { data: agentData, error: agentError } = await supabase
        .from('zhomes_agents')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (agentError && agentError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error chequeando agente:', agentError);
        return;
    }

    if (!agentData) {
        console.log('El agente no existe en zhomes_agents. Insertando...');
        const { error: insertError } = await supabase.from('zhomes_agents').insert({
            id: user.id,
            first_name: 'Damelaletra',
            last_name: 'Realtor',
            status: 'Active',
            email: email
        });
        if (insertError) {
            console.error('Error insertando en zhomes_agents:', insertError);
            return;
        }
        console.log('Agente insertado y activado.');
    } else {
        console.log('Agente encontrado. Actualizando status a "Active"...');
        const { error: updateAgentError } = await supabase.from('zhomes_agents').update({ status: 'Active' }).eq('id', user.id);
        if (updateAgentError) {
            console.error('Error actualizando zhomes_agents:', updateAgentError);
            return;
        }
        console.log('Estatus de agente actualizado.');
    }

    console.log('==== SCRIPT FINALIZADO CON ÉXITO ====');
}

run();
