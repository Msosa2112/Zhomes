import 'dotenv/config';
import twilio from 'twilio';

async function sendTest() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !apiKey || !apiSecret) {
    console.error('Faltan credenciales en .env');
    process.exit(1);
  }

  const client = twilio(apiKey, apiSecret, { accountSid });
  const to = '+15026587853';

  console.log('Enviando mensaje de prueba a:', to);
  
  try {
    const message = await client.messages.create({
      body: 'ZHomes: Este es un mensaje de prueba PING del sistema SMS. Confirmando conexión con la API de Twilio. Reply STOP to opt out.',
      to,
      messagingServiceSid,
    });
    
    console.log('¡Éxito! Mensaje enviado. SID:', message.sid);
    console.log('Estado:', message.status);
  } catch(e) {
    console.error('Error enviando SMS:', e.message);
  }
}

sendTest();
