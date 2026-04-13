import fetch from 'node-fetch';

const APP_URL = 'https://zhomesapp.com';

async function testAutomatedFlows() {
  console.log(`\n🚀 Iniciando Prueba de Flujos Nativos TC (Emails) en: ${APP_URL}`);

  console.log(`\n--- 1. Prueba: Cliente (Bienvenida) ---`);
  // Simulando que Supabase lanza un INSERT en tc_transactions
  const clientPayload = {
    type: 'INSERT',
    record: {
      client_name: 'Miguel Sosa (Prueba)',
      client_email: 'miguesosagarcia@gmail.com', // El user pidió usar este email para cliente
      address: '123 Test Ave, Client City',
      closing_date: '2026-05-01'
    }
  };
  
  try {
    const res = await fetch(`${APP_URL}/api/tc-db-webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer f653517a21965e70df5f14fcd300cd74b653209f2da95fd1daaafbeaf893ae4fc`
      },
      body: JSON.stringify(clientPayload)
    });
    console.log('✅ Cliente Welcome - Status:', res.status, await res.text());
  } catch(e) {
    console.error('❌ Error Cliente:', e.message);
  }

  console.log(`\n--- 2. Prueba: Realtor (Transacción Asignada) ---`);
  // Para realtor_id necesitaríamos uno real, pero llamaremos a /api/emails directo 
  // para verificar el template, ya que no conocemos el ID exacto aquí.
  try {
    const res = await fetch(`${APP_URL}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'realtor_transaction_assigned',
        to: 'damelaletra@gmail.com', // El email del realtor que pidió el usuario
        data: {
          realtorName: 'Agente Prueba',
          address: '456 Realtor Blvd',
          clientName: 'Miguel Sosa',
          closingDate: '2026-05-15',
          price: 350000,
          appUrl: 'https://zhomesapp.com'
        }
      })
    });
    console.log('✅ Realtor Assigned - Status:', res.status, await res.text());
  } catch(e) {
    console.error('❌ Error Realtor:', e.message);
  }

  console.log(`\n--- 3. Prueba: Broker (Nuevo Lead) ---`);
  try {
    const res = await fetch(`${APP_URL}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'broker_new_lead',
        to: 'zhomesreapp@gmail.com',
        data: {
          agentName: 'Zillow',
          clientName: 'Nuevo Lead Interesado',
          propertyAddress: '789 Broker Lane',
          action: 'Contact Request',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log('✅ Broker Lead - Status:', res.status, await res.text());
  } catch(e) {
    console.error('❌ Error Broker:', e.message);
  }

  console.log('\n🏁 Pruebas Finalizadas');
  console.log('⚠️ NOTA: Si en consola aparece error o que Resend bloquea los envíos a miguesosagarcia@gmail.com');
  console.log('   es porque tu cuenta de Resend (Plan Gratuito) requiere verificar el dominio zhomesreapp.com');
  console.log('   para poder enviar emails a otras personas distintas de ti mismo.');
}

testAutomatedFlows();
