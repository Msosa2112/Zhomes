export default async function handler(req, res) {
  // CORS handles
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo se acepta POST' });

  // Supabase manda su payload estándar en req.body
  const payload = req.body;
  if (!payload || !payload.table || !payload.type || !payload.record) {
      return res.status(400).json({ error: 'Malfomed Supabase Webhook Payload' })
  }

  const { table, type, record } = payload;
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://zhomesapp.com'

  console.log(`[Webhook] Evento recibido: ${type} en tabla ${table}`, record);

  try {
      // EVENTO: Subida de Documento
      if (table === 'tc_documents' && (type === 'INSERT' || type === 'UPDATE')) {
          
          if (!record.file_url) {
              return res.status(200).json({ message: 'Documento sin archivo cargado, ignorando.' });
          }

          // Aquí asumo que traemos info extra a través de consultas a Supabase
          // pero para ser eficientes, mandaremos a la api de SMS y correos los eventos crudos usando fetch interno.
          // Ej. Si el uploader_role === 'client'
          // Pero la tabla tc_documents solo tiene transaction_id.
          
          // Por simplicidad de la prueba, disparamos a un endpoint interno o twilio.
          
          // ... LÓGICA DE RECUPERACIÓN (Supabase lookup) pendiente ...
          // if (clientAction) {
          //    await fetch(`${baseUrl}/api/sms`, { ...body: 'El cliente ha cargado un documento' });
          //    await fetch(`${baseUrl}/api/emails`, { ...body: 'Email al realtor' });
          // }

          console.log(`[Webhook] Disparador de tc_documents procesado`);
          return res.status(200).json({ success: true, processed: 'tc_documents' });
      }

      // EVENTO: Cambio de estado de Transacción
      if (table === 'tc_transactions' && type === 'UPDATE') {
          // ... Logica cuando cambia contrato o status ...
          console.log(`[Webhook] Disparador de tc_transactions procesado`);
          return res.status(200).json({ success: true, processed: 'tc_transactions' });
      }

      return res.status(200).json({ message: 'Evento ignorado por el router.' });

  } catch (err) {
      console.error('[Webhook] Error crítico procesando:', err.message);
      return res.status(500).json({ error: err.message });
  }
}
