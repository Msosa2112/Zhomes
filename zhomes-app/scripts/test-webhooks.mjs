import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bnbvzcllyfmzuhnjltxg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnZ6Y2xseWZtenVobmpsdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMTk4NywiZXhwIjoyMDkwMjA3OTg3fQ.b_0mHIW7lFeI2icy2LJRbelJWGd5HkC0mtzOK8HKF3w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('1. Creating Client User...');
    const clientEmail = `client_${Date.now()}@example.com`;
    const { data: clientUser, error: clientError } = await supabase.auth.admin.createUser({
        email: clientEmail,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { role: 'client', full_name: 'Test Client' }
    });
    
    if (clientError) {
        console.error('Error creating client user:', clientError);
        return;
    }
    const clientId = clientUser.user.id;
    console.log(`✅ Client User Created: ${clientEmail} (ID: ${clientId})`);

    console.log('\n2. Creating Agent User...');
    const agentEmail = `agent_${Date.now()}@example.com`;
    const { data: agentUser, error: agentError } = await supabase.auth.admin.createUser({
        email: agentEmail,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { role: 'realtor', full_name: 'Test Agent' }
    });

    if (agentError) {
        console.error('Error creating agent user:', agentError);
        return;
    }
    const agentId = agentUser.user.id;
    console.log(`✅ Agent User Created: ${agentEmail} (ID: ${agentId})`);

    console.log('\n3. Triggering webhook: realtor-activated');
    // First insert as pending_approval
    let res = await supabase.from('zhomes_agents').insert({
        id: agentId,
        email: agentEmail,
        full_name: 'Test Agent',
        status: 'pending_approval'
    });
    if (res.error) console.error('Error inserting agent:', res.error);
    
    // Now update to Active
    res = await supabase.from('zhomes_agents').update({ status: 'Active' }).eq('id', agentId);
    if (res.error) console.error('Error updating agent:', res.error);
    else console.log('✅ Triggered realtor-activated!');

    console.log('\n4. Triggering webhook: zhomes-bookings-events');
    const booking = {
        realtor_id: agentId,
        client_user_id: clientId,
        client_name: 'Test Client',
        client_phone: '555-0000',
        booking_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00:00',
        status: 'confirmed'
    };
    res = await supabase.from('bookings').insert(booking);
    if (res.error) console.error('Error inserting booking:', res.error);
    else console.log('✅ Triggered zhomes-bookings-events!');

    console.log('\n5. Triggering webhook: zhomes-crm-leads-events');
    // Insert new lead
    const lead = {
        name: 'Test Lead',
        stage: 'new',
        created_by: agentId
    };
    const leadRes = await supabase.from('crm_leads').insert(lead).select('id').single();
    if (leadRes.error) {
        console.error('Error inserting CRM lead:', leadRes.error);
    } else {
        const leadId = leadRes.data.id;
        // Update stage to preapproved
        res = await supabase.from('crm_leads').update({ stage: 'preapproved' }).eq('id', leadId);
        if (res.error) console.error('Error updating CRM lead:', res.error);
        else console.log('✅ Triggered zhomes-crm-leads-events!');
    }
    
    console.log('\nAll done! Please check the n8n webhook logs.');
}

main();
