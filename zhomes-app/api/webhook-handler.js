import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export default async function handler(req, res) {
  // CORS handles
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo se acepta POST' });

  // Autenticación simple para evitar llamadas externas públicas
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer zhomes_internal_webhook_secret_123') {
      return res.status(401).json({ error: 'Unauthorized webhook access' });
  }

  const payload = req.body;
  if (!payload || !payload.table || !payload.type || !payload.record) {
      return res.status(400).json({ error: 'Malformed Payload' });
  }

  const { table, type, record, old_record } = payload;
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://zhomesapp.com';

  console.log(`[Webhook handler] Evento: ${type} en ${table}. ID: ${record.id}`);

  // Funciones helper para notificar
  const notify = async (toPhone, toEmail, subject, title, message) => {
    console.log(`[Webhook Notifier] Notificando a SMS:${toPhone} Email:${toEmail} -> ${subject}`);
    const promises = [];
    if (toPhone) {
        promises.push(fetch(`${baseUrl}/api/sms`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'custom', to: toPhone, data: { message: `ZHomes: ${message}` } })
        }).catch(err => console.error('[SMS Fail]', err)));
    }
    if (toEmail) {
        promises.push(fetch(`${baseUrl}/api/emails`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'custom', to: toEmail, data: { subject, title, message } })
        }).catch(err => console.error('[Email Fail]', err)));
    }
    await Promise.all(promises);
  };

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // HARDCODED BROKER (Puedes cambiarlo por configuración dinámica si deseas)
  const DUMMY_PHONE_FROM_USER_FOR_TESTS = '+15026587853'; // Pedido explícitamente en el historial para pruebas
  const BROKER_PHONE = process.env.BROKER_PHONE || DUMMY_PHONE_FROM_USER_FOR_TESTS;
  const BROKER_EMAIL = 'zhomesreapp@gmail.com'; 

  try {
      // EVENTOS TC_DOCUMENTS
      if (table === 'tc_documents') {
          const isNewUpload = (type === 'INSERT' && record.status === 'uploaded') || 
                              (type === 'UPDATE' && old_record?.status !== 'uploaded' && record.status === 'uploaded');
          
          const isReviewing = type === 'UPDATE' && old_record?.status !== 'reviewing' && record.status === 'reviewing';

          if (isNewUpload || isReviewing) {
              // Obtener la transacción maestra para sacar teléfonos/correos
              const { data: tx } = await supabase.from('tc_transactions').select('*').eq('id', record.transaction_id).single();
              if (!tx) return res.status(404).json({ error: 'Transaction no encontrada' });

              const clientPhone = tx.client_phone;
              const clientEmail = tx.client_email;
              
              // Intentar buscar el Realtor en auth.users
              let realtorPhone = null;
              let realtorEmail = null;
              let realtorName = "Agente ZHomes";
              
              if (tx.realtor_id) {
                  const { data: uData } = await supabase.auth.admin.getUserById(tx.realtor_id);
                  const user = uData?.user;
                  if (user) {
                      realtorEmail = user.email;
                      realtorPhone = user.phone || user.user_metadata?.phone;
                      realtorName = user.user_metadata?.full_name || realtorName;
                  }
              }

              // REGLA 1: Cliente sube Documento (Category personal/contract) -> Notify Realtor
              if (isNewUpload && ['contract', 'personal'].includes(record.category)) {
                  await notify(
                      realtorPhone, realtorEmail,
                      `El cliente ha subido un documento: ${record.name}`,
                      'Nuevo Documento Subido',
                      `Tu cliente ${tx.client_name || 'del deal'} acaba de subir el documento "${record.name}" a la transacción de la propiedad ${tx.address}. Por favor revísalo en el portal.`
                  );
              }

              // REGLA 2: Realtor sube doc Lender/Title -> Notify Client
              if (isNewUpload && ['title', 'financial'].includes(record.category)) {
                  await notify(
                      clientPhone, clientEmail,
                      `Tienes un nuevo documento legal disponible: ${record.name}`,
                      'Documento de Tu Propiedad',
                      `Hola ${tx.client_name || ''}, tu agente ha subido un documento de tipo Legal/Financiero ("${record.name}") para la propiedad ${tx.address}. Puedes acceder a tu portal para revisarlo.`
                  );
              }

              // REGLA 3: Realtor manda docs a revisión del Broker -> Notify Broker
              if (isReviewing) {
                  await notify(
                      BROKER_PHONE, BROKER_EMAIL,
                      `Documento requiere revisión Broker: ${record.name}`,
                      'Revisión Pendiente TC',
                      `El agente ha marcado el documento "${record.name}" para la transacción en ${tx.address} para revisión administrativa.`
                  );
              }

              return res.status(200).json({ success: true, processed: 'tc_documents' });
          }
      }

      // EVENTOS TC_TRANSACTIONS
      if (table === 'tc_transactions' && type === 'UPDATE') {
          const statusChanged = old_record?.status !== record.status;
          
          // Obtener data directamente (ya que estamos en transactions)
          const clientPhone = record.client_phone;
          const clientEmail = record.client_email;
          let realtorPhone = null, realtorEmail = null;
          
          if (record.realtor_id) {
              const { data: uData } = await supabase.auth.admin.getUserById(record.realtor_id);
              if (uData?.user) {
                  realtorEmail = uData.user.email;
                  realtorPhone = uData.user.phone || uData.user.user_metadata?.phone;
              }
          }

          // REGLA 4: Transacción confirmada (Ej: Contrato firmado / Cita aprobada) -> Notify Client
          if (statusChanged && record.status === 'under_contract') {
              await notify(
                  clientPhone, clientEmail,
                  `¡Tu transacción en ${record.address} avanza!`,
                  'Estado de Propiedad Actualizado',
                  `Felicidades! La propiedad en ${record.address} ahora está bajo contrato (Under Contract). Te mantendremos informado de los siguientes pasos.`
              );
              // Podríamos avisar al realtor también
              await notify(
                  realtorPhone, realtorEmail,
                  `Transacción cambió a Under Contract: ${record.address}`,
                  'Actualización de Deal',
                  `La propiedad en ${record.address} que manejas está oficialmente bajo contrato en el sistema TC.`
              );
          }
          
          // OTRAS REGLAS: Se pueden agregar más transiciones de checklist (Ej, inspección aprobada, cierre final).

          return res.status(200).json({ success: true, processed: 'tc_transactions_updates' });
      }

      // Fallback
      return res.status(200).json({ message: 'Evento ignorado por las reglas actuales.' });

  } catch (err) {
      console.error('[Webhook Exception]:', err.message);
      return res.status(500).json({ error: err.message });
  }
}
