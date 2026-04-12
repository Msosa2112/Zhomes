// api/enqueue-lead.js
// Vercel Serverless Function — Proxy Frontend → QStash
//
// El frontend NO puede llamar a QStash directamente porque el QSTASH_TOKEN
// es secreto. Este proxy recibe la petición del frontend, la valida,
// y la encola en QStash con un delay de 30 minutos apuntando a /api/notify-lead.
//
// Flujo completo:
//   Frontend
//     ──► POST /api/enqueue-lead  (sin auth requerida, el rate limit es QStash)
//     ──► QStash encola con 30min de delay
//     ──► QStash ──► POST /api/notify-lead (firmado, 30min después)
//     ──► notify-lead guarda en Supabase y notifica al agente

import { Client } from '@upstash/qstash';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const CRON_SECRET  = process.env.CRON_SECRET;
const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.APP_URL;

// Delay en segundos. 30 minutos = 1800s
const LEAD_DELAY_SECONDS = 30 * 60;

export default async function handler(req, res) {
  // CORS para llamadas desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { agentKey, propertyId, propertyAddress, action, clientName, timestamp } = req.body || {};

  // Validar campos mínimos
  if (!agentKey || !action) {
    return res.status(400).json({ error: 'agentKey and action are required' });
  }

  // Si QStash no está configurado, registrar y continuar silenciosamente
  if (!QSTASH_TOKEN) {
    console.warn('[Enqueue Lead] QSTASH_TOKEN no configurado — lead no encolado');
    return res.status(200).json({
      enqueued: false,
      reason: 'QStash not configured',
      delayMinutes: 0,
    });
  }

  if (!APP_URL) {
    return res.status(500).json({
      error: 'APP_URL not configured. Set VERCEL_PROJECT_PRODUCTION_URL in Vercel env vars.',
    });
  }

  try {
    const client = new Client({ token: QSTASH_TOKEN });

    const result = await client.publishJSON({
      url: `${APP_URL}/api/notify-lead`,
      delay: LEAD_DELAY_SECONDS,
      body: {
        agentKey,
        propertyId: propertyId || null,
        propertyAddress: propertyAddress || null,
        action,
        clientName: clientName || 'Anonymous',
        timestamp: timestamp || new Date().toISOString(),
      },
      retries: 2,
    });

    const delayMinutes = Math.round(LEAD_DELAY_SECONDS / 60);
    console.log(`[Enqueue Lead] ✔ Lead encolado — Agente: ${agentKey} | Acción: ${action} | Delay: ${delayMinutes}min | ID: ${result.messageId}`);

    return res.status(200).json({
      enqueued: true,
      messageId: result.messageId,
      delayMinutes,
      targetUrl: `${APP_URL}/api/notify-lead`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Enqueue Lead] Error al encolar en QStash:', err.message);
    return res.status(500).json({
      enqueued: false,
      error: err.message,
    });
  }
}
