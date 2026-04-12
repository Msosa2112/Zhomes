// api/qstash-trigger.js
// Vercel Serverless Function — Disparador liviano del MLS Sync
//
// Este endpoint es llamado por Vercel Cron (terriblemente limitado a 10-60s).
// En vez de correr el sync aquí, encola un mensaje en QStash que llamará
// a /api/sync con reintentos garantizados. Ejecución: < 500ms.
//
// Flujo:
//   Vercel Cron ──► /api/qstash-trigger ──► QStash ──► /api/sync (con reintentos)

import { Client } from '@upstash/qstash';

const QSTASH_TOKEN  = process.env.QSTASH_TOKEN;
const CRON_SECRET   = process.env.CRON_SECRET;

// La URL pública de tu app en Vercel, ej: https://zhomes-app.vercel.app
// Configúrala en Vercel Dashboard → Settings → Environment Variables
const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.APP_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Seguridad: solo Vercel Cron o llamadas con CRON_SECRET
  const authHeader  = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron'];

  if (!isVercelCron && CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!QSTASH_TOKEN) {
    console.warn('[QStash Trigger] QSTASH_TOKEN no configurado — ejecutando sync directo como fallback');
    // Fallback: redirigir a sync directamente si QStash no está configurado
    return res.status(200).json({
      queued: false,
      reason: 'QSTASH_TOKEN not configured — add it to Vercel env vars',
      fallback: 'Call /api/sync directly'
    });
  }

  if (!APP_URL) {
    return res.status(500).json({
      error: 'APP_URL not configured — set VERCEL_PROJECT_PRODUCTION_URL or APP_URL in environment'
    });
  }

  try {
    const client = new Client({ token: QSTASH_TOKEN });

    // Publicar el mensaje a QStash que llamará a /api/sync
    // QStash intentará entregarlo con reintentos exponenciales si falla
    const result = await client.publishJSON({
      url: `${APP_URL}/api/sync`,
      body: { trigger: 'qstash-cron' },
      headers: {
        // Enviamos el CRON_SECRET para que /api/sync nos autentique
        ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
        'x-triggered-by': 'qstash-trigger',
      },
      retries: 3,           // 3 reintentos en caso de falla
      timeout: 300,         // 5 minutos de timeout por intento
    });

    console.log(`[QStash Trigger] Mensaje encolado exitosamente. ID: ${result.messageId}`);

    return res.status(200).json({
      queued: true,
      messageId: result.messageId,
      targetUrl: `${APP_URL}/api/sync`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[QStash Trigger] Error al encolar:', err.message);
    return res.status(500).json({
      queued: false,
      error: err.message,
    });
  }
}
