import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Optimize runtime limit for this serverless function (max for Hobby is 10s usually, but Pro allows up to 60s)
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Configured for POST only
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, fileName, transactionId } = req.body;
    
    if (!fileBase64 || !fileName || !transactionId) {
      return res.status(400).json({ error: "Missing required fields (fileBase64, fileName, transactionId)" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // We must use the service role key to bypass RLS for inserting into these backend tables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 
    
    if (!supabaseUrl || !supabaseKey) {
       return res.status(500).json({ error: "Supabase configuration missing in environment" });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Text Extraction
    let text = "";
    const buffer = Buffer.from(fileBase64, "base64");
    
    if (fileName.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString("utf-8"); // Assume plaintext for non-pdf
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract readable text from document" });
    }

    // Clean up excessive whitespace
    text = text.replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ');

    // 2. Setup the deal_document record in database
    const { data: docData, error: docError } = await supabase
      .from('deal_documents')
      .insert({ transaction_id: transactionId, file_name: fileName })
      .select('id')
      .single();

    if (docError) {
      console.error("Deal Document Insert Error:", docError);
      return res.status(500).json({ error: "Failed to create document record", details: docError.message });
    }

    const dealDocumentId = docData.id;

    // 3. Simple Text Chunking: 1500 characters with 200 character overlap
    const chunkSize = 1500;
    const overlap = 200;
    const chunks = [];
    let i = 0;
    
    while (i < text.length) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push(chunk);
      i += (chunkSize - overlap);
    }

    // 4. Generate Embeddings and Insert
    let insertedCount = 0;
    for (const content of chunks) {
      // Skip chunks that are too small to carry meaning
      if (content.trim().length < 50) continue; 

      try {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: content,
        });
        const embedding = embeddingResponse.data[0].embedding;

        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            deal_document_id: dealDocumentId,
            content: content,
            embedding: embedding
          });
        
        if (chunkError) {
           console.error("Chunk Insert Error:", chunkError);
        } else {
           insertedCount++;
        }
      } catch (embErr) {
        console.error("Embedding generation failed for a chunk:", embErr);
      }
    }

    // 5. Proactive AI Extraction (Extracción Automática de Fechas y Dinero)
    let extractedSummary = null;
    const documentId = req.body.documentId; // passed from frontend if available
    if (documentId) {
      try {
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Eres la IA asistente de una agencia de Bienes Raíces (ZHomes AI). Analiza el siguiente documento de tu cliente. Extrae todas las fechas de pago, límites de inspección, montos en dinero (earnest money, precio de compra, etc.) y cualquier factor de riesgo crítico. Resume en viñetas simples y amables, listas para reenviar al cliente." },
            { role: "user", content: `A continuación el texto del documento:\n\n${text.slice(0, 60000)}` }
          ]
        });
        extractedSummary = summaryResponse.choices[0].message.content;

        // Guardamos este resumen brillante preparado y APROBAMOS el documento automáticamente
        await supabase
          .from('tc_documents')
          .update({ 
            ai_feedback: extractedSummary,
            status: 'approved'
          })
          .eq('id', documentId);
          
        // Inyectamos un mensaje automático al chat informando de la aprobación
        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name:    'ZHomes AI',
          sender_role:    'system',
          content:        `✨ Verificado y Aprobado Automáticamente:\n\n${extractedSummary}`,
          message_type:   'document_update',
        });
        
        // Lo dejamos en el log interno
        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type:     'document_reviewed',
          description:    `Documento aprobado automáticamente por ZHomes AI`,
          is_alert:       false,
        });
          
      } catch (summaryErr) {
        console.error("No se pudo generar extraer el reumen de IA:", summaryErr);
      }
    }

    return res.status(200).json({ 
      success: true, 
      dealDocumentId, 
      chunksProcessed: insertedCount,
      summary: extractedSummary,
      message: "Document successfully processed and indexed for AI querying."
    });

  } catch (err) {
    console.error("Process Document Fatal Error:", err);
    res.status(500).json({ error: "Document processing failed", details: err.message });
  }
}
