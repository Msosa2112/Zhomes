/**
 * api/sms.js — ZHomes SMS System vía Twilio
 *
 * Workflows por rol (Ejemplos):
 *   broker  → Alerta urgente de nuevo lead, Recordatorio de deadline
 *   realtor → Notificación de firma pendiente
 *   client  → Confirmación de cita, Recordatorio "mañana es tu cierre"
 *
 * POST /api/sms
 * Body: { type, to, data }
 */

import twilio from 'twilio';

// Se recomiendan las API Keys para mayor seguridad, pero respaldamos con Auth Token si faltan.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Identificador del Messaging Service A2P (MGXXXXX...)
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const backupPhone = process.env.TWILIO_PHONE_NUMBER;

export default async function handler(req, res) {
  // CORS handles
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo se acepta POST' });

  if (!accountSid) {
    console.error('[SMS] TWILIO_ACCOUNT_SID no configurada');
    return res.status(500).json({ error: 'Credenciales de Twilio no configuradas en variables de entorno' });
  }

  const { type, to, data = {} } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'type y to son parámetros requeridos' });
  }

  // Inicializar Cliente Twilio
  let client;
  if (apiKey && apiSecret) {
    client = twilio(apiKey, apiSecret, { accountSid });
  } else {
    client = twilio(accountSid, authToken);
  }

  // Helper para generar el cuerpo del SMS según el 'type'
  let messageBody = '';

  try {
    switch (type) {
      case 'broker_urgent_alert':
        messageBody = `ZHomes Alerta: Deadline crítico mañana para la propiedad en ${data.address || 'tu transacción'}. Revisa el TC Dashboard.`;
        break;

      case 'realtor_new_assignment':
        messageBody = `ZHomes: Se te ha asignado una nueva transacción en ${data.address}. Ingresa al Deal Room para más detalles.`;
        break;

      case 'client_appointment_confirmation':
        messageBody = `ZHomes: Hola, ${data.clientName || 'cliente'}. Tu cita para la propiedad ${data.address} está confirmada para el ${data.date}. Responde HELP para ayuda o STOP para cancelar.`;
        break;

      case 'client_closing_soon':
        messageBody = `ZHomes: Hola, ${data.clientName || 'cliente'}. ¡Tu cierre en ${data.address} es mañana! Asegúrate de tener listos tus cheques y tu ID oficial.`;
        break;
      
      case 'test_ping':
        messageBody = `ZHomes: Este es un mensaje de prueba PING del sistema SMS. Reply STOP to opt out.`;
        break;

      default:
        // Mensaje generico o fallback si nos pasan 'custom' type y un body manual
        if (type === 'custom' && data.message) {
            messageBody = data.message;
        } else {
            return res.status(400).json({ error: \`Tipo de SMS desconocido: \${type}\` });
        }
    }

    // Configurar payload de envío
    const payload = {
      body: messageBody,
      to,
    };

    // Si tenemos Messaging Service A2P usamos eso (La mejor opción)
    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (backupPhone) {
      payload.from = backupPhone;
    } else {
      throw new Error('No hay ' + 'TWILIO_MESSAGING_SERVICE_SID o TWILIO_PHONE_NUMBER configurado');
    }

    // Enviar el mensaje
    const message = await client.messages.create(payload);

    console.log(`[SMS] Enviado exitosamente a \${to} | SID: \${message.sid}`);
    return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });

  } catch (err) {
    console.error('[SMS] Error de Twilio:', err.message);
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
