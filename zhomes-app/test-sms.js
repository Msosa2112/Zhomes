import { config } from 'dotenv';
config({ path: '.env' });

import twilio from 'twilio';

async function sendTest() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const myPersonalNumber = '+15026587853';

  if (!accountSid || !authToken || !twilioNumber) {
    console.error('Faltan credenciales en .env');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  console.log('Enviando SMS de prueba a:', myPersonalNumber);
  console.log('Usando número de Twilio:', twilioNumber);

  try {
    const message = await client.messages.create({
      body: '¡Hola Miguel! Este es un mensaje de prueba automático desde tu código ZHomes, usando tu nuevo número local de Twilio. ¿Llegó?',
      from: twilioNumber,
      to: myPersonalNumber
    });
    
    console.log('\n✅ ¡Mensaje enviado con éxito a la red de Twilio!');
    console.log('Message SID (ID de seguimiento):', message.sid);
    console.log('Status en Twilio:', message.status);
    
  } catch (error) {
    console.error('\n❌ Error enviando mensaje:');
    console.error(error.message);
  }
}

sendTest();
