// api/notify-lead.js
// Vercel Serverless Function — Receptor de Notificaciones de Leads
//
// QStash llama a este endpoint cuando la cola de leads está lista para entregar.
// Verifica la firma de QStash y procesa la notificación al agente.
//
// Flujo del lead:
//   Usuario hace swipe/guarda propiedad
//     ──► leadNotificationService.js encola en QStash con delay 30min
//     ──► QStash espera 30min
//     ──► QStash llama a /api/notify-lead con firma
//     ──► Este endpoint notifica al agente (log + email futuro)

import { Receiver } from '@upstash/qstash';
import { createClient } from '@supabase/supabase-js';

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY    = process.env.QSTASH_NEXT_SIGNING_KEY;
const SUPABASE_URL  = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Verificar firma QStash ────────────────────────────────────────────────
  // Esto garantiza que la llamada viene de QStash, no de alguien externo.
  if (QSTASH_CURRENT_SIGNING_KEY && QSTASH_NEXT_SIGNING_KEY) {
    try {
      const receiver = new Receiver({
        currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey:    QSTASH_NEXT_SIGNING_KEY,
      });

      // Reconstruir el body raw para verificar la firma HMAC
      const rawBody = await getRawBody(req);
      const isValid = await receiver.verify({
        signature: req.headers['upstash-signature'],
        body: rawBody,
        url: `https://${req.headers.host}/api/notify-lead`,
      });

      if (!isValid) {
        console.warn('[QStash Notify] Firma inválida — request rechazado');
        return res.status(401).json({ error: 'Invalid QStash signature' });
      }
    } catch (err) {
      console.error('[QStash Notify] Error verificando firma:', err.message);
      return res.status(401).json({ error: 'Signature verification failed', details: err.message });
    }
  } else {
    // En desarrollo local sin llaves de QStash, aceptar el header de bypass
    const bypass = req.headers['x-dev-bypass'];
    if (bypass !== process.env.CRON_SECRET) {
      console.warn('[QStash Notify] Sin llaves QStash configuradas y sin bypass válido');
      return res.status(403).json({ error: 'QStash signing keys not configured' });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { agentKey, clientName, propertyAddress, action, propertyId, timestamp } = payload;

  if (!agentKey || !action) {
    return res.status(400).json({ error: 'agentKey and action are required' });
  }

  const receivedAt = new Date().toISOString();
  const enqueueTime = timestamp ? new Date(timestamp) : null;
  const delayMinutes = enqueueTime
    ? Math.round((new Date() - enqueueTime) / 60000)
    : null;

  console.log(`[QStash Notify] Lead procesado — Agente: ${agentKey} | Acción: ${action} | Delay: ${delayMinutes}min`);

  // ── Guardar notificación en Supabase ──────────────────────────────────────
  let saved = false;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error } = await supabase.from('lead_notifications').upsert([{
        agent_key:        agentKey,
        client_name:      clientName || 'Anonymous',
        property_id:      propertyId || null,
        property_address: propertyAddress || null,
        action:           action,
        delivered_at:     receivedAt,
        delay_minutes:    delayMinutes,
        status:           'delivered',
      }], { onConflict: 'agent_key,property_id,action' });

      if (error) {
        // La tabla puede no existir aún — loggear pero no fallar
        console.warn('[QStash Notify] Supabase upsert warning:', error.message);
      } else {
        saved = true;

        // Enviar email al broker
        try {
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const host = req.headers.host || 'zhomesapp.com';
          fetch(`${protocol}://${host}/api/emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'broker_new_lead',
              to: 'zhomesreapp@gmail.com',
              data: {
                agentName: agentKey,
                clientName: clientName || 'Desconocido',
                propertyAddress: propertyAddress || 'Propiedad desconocida',
                action: action,
                timestamp: receivedAt
              }
            })
          }).catch(e => console.error('[Notify Lead] Error enviando email broker:', e.message));
        } catch(e) {}
      }
    } catch (err) {
      console.warn('[QStash Notify] Supabase error (no crítico):', err.message);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return res.status(200).json({
    processed: true,
    saved,
    agentKey,
    action,
    receivedAt,
    delayMinutes,
    message: `Lead notification for agent ${agentKey} processed successfully`,
  });
}

// Helper: leer body raw para verificación de firma HMAC
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    // Si el body ya fue parseado por Vercel, reconstruirlo
    if (req.body) {
      const str = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      return resolve(str);
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}
