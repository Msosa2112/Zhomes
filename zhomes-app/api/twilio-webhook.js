import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // CORS handles
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).send('Solo se acepta POST');
  }

  // Twilio envía un POST tipo "application/x-www-form-urlencoded"
  // Vercel lo parsea y lo pone en req.body
  const { From, Body } = req.body || {};

  if (!From || !Body) {
    return res.status(400).send('Faltan datos de Twilio');
  }

  console.log(`[Twilio Webhook] Mensaje recibido de ${From}: ${Body}`);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar a qué transacción(es) pertenece este número
    // (Buscamos transacciones activas de este cliente)
    const { data: txs, error: txError } = await supabase
      .from('tc_transactions')
      .select('id, client_name')
      .eq('client_phone', From)
      // Opcional: .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (txError) throw txError;

    if (!txs || txs.length === 0) {
      console.log(`No se encontró transacción activa para el teléfono: ${From}`);
      // Respondemos a Twilio ok, aunque no lo guardemos, para que no genere error.
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send('<Response></Response>');
    }

    const transactionId = txs[0].id;
    const clientName = txs[0].client_name;

    // 2. Insertar el mensaje en el chat (tc_messages)
    const { error: msgError } = await supabase
      .from('tc_messages')
      .insert([
        {
          transaction_id: transactionId,
          content: Body,
          sender_role: 'client',
          is_internal: false
        }
      ]);

    if (msgError) throw msgError;

    console.log(`Mensaje enrutado a la transacción ${transactionId} de ${clientName}`);

    // 3. Responder con TwiML vacío (Significa: Mensaje procesado, no mandar autorespuesta por SMS)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('[Error Twilio Webhook]', error);
    // Aunque haya error interno nuestro, le devolvemos XML vacío a Twilio para que no repita la llamada
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');
  }
}
