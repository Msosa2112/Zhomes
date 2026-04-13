/**
 * api/tc-db-webhook.js — Receptor de Database Webhooks de Supabase
 *
 * Se dispara en INSERT/UPDATE sobre la tabla tc_transactions.
 * Traduce el evento de BD a triggers de email nativos (vía /api/emails).
 * - INSERT: client_welcome, rector_transaction_assigned (si ya viene)
 * - UPDATE: realtor_transaction_assigned (si cambia), client_status_update (si cambia status)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  // Validar credenciales (en Supabase Webhook hay que agregar header: Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[TC DB Webhook] Request no autorizado');
    return res.status(401).json({ error: 'Unauthorized '});
  }

  const { type, record, old_record } = req.body;
  if (!record) return res.status(400).json({ error: 'Falta record en webhook_payload' });

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'zhomesapp.com';
  const apiEmails = `${protocol}://${host}/api/emails`;

  const sendEmail = async (emailType, to, data) => {
    try {
      console.log(`[TC DB Webhook] Disparando ${emailType} a ${to}`);
      await fetch(apiEmails, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: emailType, to, data })
      });
    } catch(e) {
      console.error(`[TC DB Webhook] Error sendEmail ${emailType}:`, e.message);
    }
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ── 1. CREACIÓN (INSERT) ──────────────────────────────────────────────────
    if (type === 'INSERT') {
      // 1a. Bienvenida al Cliente
      if (record.client_email) {
        
        let realtorName = 'Tu Agente Asignado';
        if (record.realtor_id) {
          const { data: rd } = await supabase.auth.admin.getUserById(record.realtor_id);
          if (rd?.user?.user_metadata?.first_name) {
            realtorName = rd.user.user_metadata.first_name + ' ' + (rd.user.user_metadata.last_name || '');
          }
        }

        await sendEmail('client_welcome', record.client_email, {
          clientName: record.client_name || 'Cliente',
          realtorName: realtorName,
          appUrl: 'https://zhomesapp.com'
        });
      }
      
      // 1b. Transacción asignada al Realtor (si se le asignó al crearse)
      if (record.realtor_id) {
         const { data: realtorData } = await supabase.auth.admin.getUserById(record.realtor_id);
         const realtorEmail = realtorData?.user?.email;
         if (realtorEmail) {
            await sendEmail('realtor_transaction_assigned', realtorEmail, {
              realtorName: realtorData.user.user_metadata?.first_name || 'Agente',
              address: record.address,
              clientName: record.client_name || 'Client',
              closingDate: record.closing_date,
              price: record.price,
              appUrl: 'https://zhomesapp.com'
            });
         }
      }
    }

    // ── 2. ACTUALIZACIÓN (UPDATE) ─────────────────────────────────────────────
    if (type === 'UPDATE' && old_record) {
      
      // 2a. Cambio o primera asignación de Realtor
      if (record.realtor_id && record.realtor_id !== old_record.realtor_id) {
         const { data: realtorData } = await supabase.auth.admin.getUserById(record.realtor_id);
         const realtorEmail = realtorData?.user?.email;
         if (realtorEmail) {
            await sendEmail('realtor_transaction_assigned', realtorEmail, {
              realtorName: realtorData.user.user_metadata?.first_name || 'Agente',
              address: record.address,
              clientName: record.client_name || 'Cliente',
              closingDate: record.closing_date,
              price: record.price,
              appUrl: 'https://zhomesapp.com'
            });
         }
      }

      // 2b. Cambio de estado de la transacción -> Notificar al cliente
      if (record.status && record.status !== old_record.status && record.client_email) {
         await sendEmail('client_status_update', record.client_email, {
           clientName: record.client_name || 'Cliente',
           address: record.address,
           oldStatus: old_record.status,
           newStatus: record.status
         });
      }
    }

    return res.status(200).json({ success: true, message: 'Eventos de webhook procesados correctamente' });
  } catch (err) {
    console.error('[TC DB Webhook] Error General:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
