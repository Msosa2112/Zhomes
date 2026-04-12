const webhookBaseUrl = 'https://n8n-production-cfe9c.up.railway.app/webhook';

const REALTOR_EMAIL = 'damelaletra@gmail.com';
const ADMIN_EMAIL = 'zhomesreapp@gmail.com';
const CLIENT_EMAIL = 'miguesosagarcia@gmail.com';

async function pingWebhooks() {
    console.log(`Enviando pruebas de webhook a n8n...`);

    // 1. Simular: Realtor Approval (Pendiente) -> Va al admin
    const approvalUrl = `${webhookBaseUrl}/realtor-approval`;
    console.log(`\n[Realtor Approval] -> ${approvalUrl}`);
    const approvalRes = await fetch(approvalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            record: {
                email: REALTOR_EMAIL,
                full_name: 'Agente Damelaletra',
                status: 'pending_approval'
            }
        })
    });
    console.log(approvalRes.ok ? `✅ OK! (Debe llegar aviso a ${ADMIN_EMAIL})` : '❌ Error');

    // 2. Simular: Realtor Activated -> Va al realtor
    const realtorUrl = `${webhookBaseUrl}/realtor-activated`;
    console.log(`\n[Realtor Activated] -> ${realtorUrl}`);
    const realtorRes = await fetch(realtorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            record: {
                id: '123-mock-id',
                email: REALTOR_EMAIL,
                full_name: 'Agente Damelaletra',
                status: 'Active',
                raw_user_meta_data: { first_name: 'Agente' }
            }
        })
    });
    console.log(realtorRes.ok ? `✅ OK! (Debe llegar aviso a ${REALTOR_EMAIL})` : '❌ Error');

    // 3. Simular: Bookings Events -> Va al cliente y realtor
    const bookingUrl = `${webhookBaseUrl}/zhomes-bookings-events`;
    console.log(`\n[Bookings Journey] -> ${bookingUrl}`);
    const bookingRes = await fetch(bookingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'INSERT', // Porque n8n verifica si es insert
            record: {
                id: 'booking-123',
                client_user_id: 'client-123',
                realtor_id: 'realtor-123',
                client_name: 'Miguel Sosa',
                client_email: CLIENT_EMAIL,  
                agent_email: REALTOR_EMAIL, // Añadimos esto para que le llegue a damelaletra
                client_phone: '123-456-7890',
                booking_date: '2026-05-15',
                time_slot: '10:00:00',
                status: 'confirmed'
            }
        })
    });
    console.log(bookingRes.ok ? `✅ OK! (Debe llegar confirmacion a ${CLIENT_EMAIL} y ${REALTOR_EMAIL})` : '❌ Error');

    // 4. Simular: CRM Leads -> Va al cliente
    const crmUrl = `${webhookBaseUrl}/zhomes-crm-leads-events`;
    console.log(`\n[CRM Leads Journey] -> ${crmUrl}`);
    const crmRes = await fetch(crmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'UPDATE', // n8n busca udpates o inserts en el CRM
            record: {
                id: 'lead-123',
                name: 'Miguel Sosa',
                email: CLIENT_EMAIL,
                stage: 'preapproved', // El flujo reacciona a esta etapa de preaprobado
                created_by: 'realtor-123'
            }
        })
    });
    console.log(crmRes.ok ? `✅ OK! (Debe llegar aviso a ${CLIENT_EMAIL})` : '❌ Error');

    console.log('\nPruebas finalizadas. Revisa los correos.');
}

pingWebhooks().catch(console.error);
