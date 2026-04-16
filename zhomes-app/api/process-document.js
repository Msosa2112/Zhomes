import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js"; // Standard import

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
    const { filePath, fileName, transactionId, documentId } = req.body;
    
    if (!filePath || !fileName || !transactionId) {
      return res.status(400).json({ error: "Missing required fields (filePath, fileName, transactionId)" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // We must use the service role key to bypass RLS for inserting into these backend tables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 
    
    if (!supabaseUrl || !supabaseKey) {
       return res.status(500).json({ error: "Supabase configuration missing in environment" });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Download file from Supabase Storage and Text Extraction
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('tc_documents')
      .download(filePath);
      
    if (downloadError) {
      console.error("Supabase storage download error:", downloadError);
      return res.status(500).json({ error: "Could not download file from storage", details: downloadError.message });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";
    try {
      if (fileName.toLowerCase().endsWith(".pdf")) {
        const parsed = await pdfParse(buffer);
        text = parsed.text || "";
      } else {
        text = buffer.toString("utf-8"); // Assume plaintext/XML for non-pdf if applicable
      }
    } catch (parseError) {
      console.warn("PDF parsing failed (corrupt or scanned):", parseError);
      text = "";
    }

    // Clean up excessive whitespace
    text = text.replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ');

    if (!text || text.trim().length < 50) {
      console.log(`Document ${fileName} has no readable text. Falling back to manual review status.`);
      if (documentId) {
        // Fallback to manual review if the AI cannot read the text
        await supabase
          .from('tc_documents')
          .update({ 
            ai_feedback: "El documento es una imagen escaneada o un archivo protegido que la Inteligencia Artificial no pudo procesar automáticamente. Se requiere verificación humana.",
            status: 'reviewing'
          })
          .eq('id', documentId);
      }
      return res.status(200).json({ 
        success: true, 
        message: "No readable text extracted. Document flagged for manual review.",
        status: "reviewing"
      });
    }

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

    // 5. Proactive AI Extraction and Validation
    let aiResult = { status: 'approved', feedback: 'Document processed' };
    if (documentId) {
      try {
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { 
              role: "system", 
              content: "Eres la IA asistente de una agencia de Bienes Raíces (ZHomes AI) auditando documentos.\nEvalúa el texto del documento para determinar si es relevante para una transacción inmobiliaria (contratos, discloures, facturas de escrow, etc.).\nSi ES VÁLIDO o parece legítimo: decide 'approved', luego extrae fechas límite, dinero y riesgos, resumiendo en viñetas simples y amables.\nSi ES MALA BASURA o totalmente irrelevante (ej: recetas, poemas, imágenes sin sentido): decide 'rejected' y explica por qué.\n\nDevuelve ESTRICTAMENTE JSON con la siguiente estructura:\n{\n  \"status\": \"approved\" | \"rejected\",\n  \"feedback\": \"Resumen amable (si es aprobado) o razón del rechazo de forma formal.\"\n}" 
            },
            { role: "user", content: `A continuación el texto del documento:\n\n${text.slice(0, 60000)}` }
          ]
        });

        const jsonContent = summaryResponse.choices[0].message.content;
        aiResult = JSON.parse(jsonContent);

        const finalStatus = aiResult.status === 'rejected' ? 'rejected' : 'approved';

        if (finalStatus === 'approved') {
          // Aprobamos el documento automáticamente
          await supabase
            .from('tc_documents')
            .update({ 
              ai_feedback: aiResult.feedback,
              status: 'approved'
            })
            .eq('id', documentId);
            
          // Mensaje automático al chat informando de la aprobación
          await supabase.from('tc_messages').insert({
            transaction_id: transactionId,
            sender_name:    'ZHomes AI',
            sender_role:    'system',
            content:        `✨ Verificado y Aprobado Automáticamente:\n\n${aiResult.feedback}`,
            message_type:   'document_update',
          });
          
          await supabase.from('tc_events').insert({
            transaction_id: transactionId,
            event_type:     'document_reviewed',
            description:    `Documento aprobado automáticamente por ZHomes AI`,
            is_alert:       false,
          });

          // Trigger Automático de Resend Email
          if (process.env.RESEND_API_KEY) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'ZHomes TC <tc@zhomesapp.com>',
                  to: 'msosave@gmail.com',
                  subject: `Documento Aprobado: ${fileName}`,
                  html: `
                    <div style="font-family: sans-serif; color: #333;">
                      <h2>¡Excelente noticia!</h2>
                      <p>Nuestro equipo y sistema de Inteligencia Artificial han procesado y aprobado exitosamente tu documento:</p>
                      <p><strong>${fileName}</strong></p>
                      <p><strong>Notas de nuestro sistema:</strong></p>
                      <div>${aiResult.feedback.replace(/\n/g, '<br />')}</div>
                      <br />
                      <p>Puedes acceder a tu panel en <a href="https://zhomesapp.com/tc-room">ZHomes Deal Room</a>.</p>
                    </div>
                  `
                })
              });
              console.log("Resend automated email sent successfully.");
            } catch (emailErr) {
              console.error("Resend API failed inside process-document:", emailErr);
            }
          }
        } else {
          // Documento rechazado por la IA (Basura o irrelevante)
          await supabase
            .from('tc_documents')
            .update({ 
              rejection_reason: aiResult.feedback,
              status: 'rejected'
            })
            .eq('id', documentId);
            
          await supabase.from('tc_messages').insert({
            transaction_id: transactionId,
            sender_name:    'ZHomes AI',
            sender_role:    'system',
            content:        `⚠️ Documento Rechazado:\n\n${aiResult.feedback}`,
            message_type:   'document_update',
          });
          
          await supabase.from('tc_events').insert({
            transaction_id: transactionId,
            event_type:     'document_reviewed',
            description:    `Documento rechazado automáticamente por irrelevancia.`,
            is_alert:       true,
          });
        }
      } catch (aiError) {
        console.error("AI Evaluation failed, falling back to manual review:", aiError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Documento procesado exitosamente",
      chunksInserted: insertedCount,
      ai_evaluation: aiResult
    });

  } catch (err) {
    console.error("Process Document Fatal Error:", err);
    res.status(500).json({ error: "Document processing failed", details: err.message });
  }
}
