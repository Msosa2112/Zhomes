import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Autenticación interna
  const authHeader = req.headers['authorization'];
  if (authHeader !== 'Bearer zhomes_internal_webhook_secret_123') {
      return res.status(401).json({ error: 'Unauthorized' });
  }

  const { document_id } = req.body;
  if (!document_id) return res.status(400).json({ error: 'Missing document_id' });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Obtener el documento
    const { data: doc } = await supabase.from('tc_documents').select('*').eq('id', document_id).single();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.file_url) return res.status(400).json({ error: 'No file URL attached' });
    if (!doc.ai_guidelines) return res.status(400).json({ error: 'No AI guidelines defined' });

    // 2. Obtener la transacción / Address para mas contexto
    const { data: tx } = await supabase.from('tc_transactions').select('address, client_name').eq('id', doc.transaction_id).single();

    // 3. Generar Signed URL transitoria
    const { data: signedData, error: signedError } = await supabase.storage
      .from('tc_documents')
      .createSignedUrl(doc.file_url, 60); // 1 minuto de expiracion
    
    if (signedError || !signedData) throw new Error('Could not get signed URL');

    // 4. Pedir a OpenAI
    const systemPrompt = `Eres ZHomes AI, un auditor de Transaction Coordinators. Tu tarea es analizar este documento de bienes raíces.
Transacción / Propiedad: ${tx?.address || 'N/A'}
Cliente Reportado: ${tx?.client_name || 'N/A'}
Categoría del Doc: ${doc.name}

Tu objetivo es validar que el documento cumple estrictamente con estas reglas (Guidelines):
"${doc.ai_guidelines}"

Devuelve un objeto JSON estructurado exactamente así, sin markdown ni backticks extra:
{
  "is_valid": true|false,
  "feedback": "Tu razonamiento claro de 1-2 oraciones explicando por qué se aprobó o rechazó. Sé directo y profesional."
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            { type: "text", text: "Por favor analiza la siguiente imagen:" },
            { type: "image_url", image_url: { url: signedData.signedUrl } }
          ]
        }
      ],
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(response.choices[0].message.content);
    const finalStatus = aiResult.is_valid ? 'approved' : 'rejected';

    // 5. Actualizar la DB
    await supabase.from('tc_documents').update({
      status: finalStatus,
      ai_feedback: aiResult.feedback,
    }).eq('id', document_id);

    // 6. Registrar en el log de eventos
    const { data: { user } } = await supabase.auth.getUser(); // might be null from API 
    await supabase.from('tc_events').insert({
      transaction_id: doc.transaction_id,
      event_type:     'document_status_changed',
      description:    `ZHomes AI QA: ${finalStatus === 'approved' ? 'Aprobó' : 'Rechazó'} "${doc.name}" automáticamente.`,
      is_alert:       !aiResult.is_valid
    });

    return res.status(200).json({ success: true, aiResult });

  } catch (error) {
    console.error('[AI QA Error]', error);
    // Si falla la IA, devolvemos a "uploaded" para revisión humana
    await supabase.from('tc_documents').update({
      status: 'uploaded',
      ai_feedback: 'El escaneo IA falló. Requiere revisión manual.'
    }).eq('id', document_id);
    
    return res.status(500).json({ error: error.message });
  }
}
