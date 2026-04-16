import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const config = {
  maxDuration: 60,
};

// ─────────────────────────────────────────────────────────────
// Helper: determina el media_type correcto según la extensión
// ─────────────────────────────────────────────────────────────
function getMediaType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  const map = {
    pdf:  'application/pdf',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    gif:  'image/gif',
    tiff: 'image/tiff',
    tif:  'image/tiff',
  };
  return map[ext] || null;
}

// ─────────────────────────────────────────────────────────────
// Helper: construye el mensaje correcto para OpenAI según tipo
// ─────────────────────────────────────────────────────────────
function buildOpenAIMessage(fileName, base64Data, mediaType, docContext) {
  const systemPrompt = `Eres la IA QA y auditora de la agencia de Bienes Raíces ZHomes.
El agente inmobiliario ha subido este archivo como parte del checklist de cierre de una transacción.
${docContext}
INSTRUCCIONES ESTRICTAS:
- Analiza el contenido REAL del archivo. Puedes ver texto, imágenes, formularios, tablas, firmas, sellos, etc.
- Si el archivo NO cumple las REGLAS ESTRICTAS del tipo de documento esperado, devuelve status "rejected" con el motivo exacto.
- Si el archivo SÍ cumple las reglas, devuelve status "approved" con un resumen de: fechas límite, montos (purchase price, earnest money, comisiones, etc.) y riesgos encontrados, en viñetas claras.
- Si el archivo es completamente ilegible, corrupto o imposible de analizar, devuelve status "reviewing" con una nota breve.

Devuelve ESTRICTAMENTE este JSON (sin markdown, sin texto extra):
{
  "status": "approved" | "rejected" | "reviewing",
  "feedback": "Resumen en español con viñetas (si aprobado) | Motivo formal del rechazo | Nota de revisión manual"
}`;

  const isPdf = mediaType === 'application/pdf';
  const isImage = mediaType && mediaType.startsWith('image/');

  if (isPdf) {
    return {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: fileName,
                file_data: `data:${mediaType};base64,${base64Data}`,
              }
            },
            {
              type: "text",
              text: "Analiza este documento PDF según las instrucciones del sistema. Devuelve solo el JSON solicitado."
            }
          ]
        }
      ]
    };
  }

  if (isImage) {
    return {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Data}`,
                detail: "high"
              }
            },
            {
              type: "text",
              text: "Analiza esta imagen de documento según las instrucciones del sistema. Devuelve solo el JSON solicitado."
            }
          ]
        }
      ]
    };
  }

  // Fallback: texto plano (ej. .txt, .xml)
  return {
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analiza este contenido de documento:\n\n${Buffer.from(base64Data, 'base64').toString('utf-8').slice(0, 60000)}`
      }
    ]
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filePath, fileName, transactionId, documentId } = req.body;

    if (!filePath || !fileName || !transactionId) {
      return res.status(400).json({ error: "Missing required fields (filePath, fileName, transactionId)" });
    }

    const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. Descargar el archivo desde Supabase Storage ────────
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('tc_documents')
      .download(filePath);

    if (downloadError) {
      console.error("Storage download error:", downloadError);
      return res.status(500).json({ error: "Could not download file", details: downloadError.message });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const base64Data  = buffer.toString('base64');
    const mediaType   = getMediaType(fileName);

    // ── 2. Obtener el contexto específico del tipo de documento ──
    let docContext = "";
    if (documentId) {
      const { data: tcDoc } = await supabase
        .from('tc_documents')
        .select('name, ai_guidelines')
        .eq('id', documentId)
        .single();

      if (tcDoc) {
        docContext = `Tipo de documento esperado: "${tcDoc.name}".\n`;
        if (tcDoc.ai_guidelines) {
          docContext += `REGLAS ESTRICTAS DE VALIDACIÓN:\n${tcDoc.ai_guidelines}\n`;
        }
      }
    }

    // ── 3. Intentar extracción de texto (solo para PDFs con capa de texto) ──
    let extractedText = "";
    if (mediaType === 'application/pdf') {
      try {
        const parsed = await pdfParse(buffer);
        extractedText = (parsed.text || "").replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ').trim();
        console.log(`pdf-parse extracted ${extractedText.length} characters.`);
      } catch (parseErr) {
        console.warn("pdf-parse failed (scanned or protected PDF):", parseErr.message);
      }
    }

    // ── 4. Decidir estrategia de análisis IA ──
    // Si el PDF tiene suficiente texto extraído, mandamos el texto (más barato).
    // En CUALQUIER otro caso (escaneado, imagen, protegido, texto insuficiente),
    // mandamos el archivo completo via Vision/Native PDF para máxima cobertura.
    let aiInput;
    const TEXT_THRESHOLD = 200; // mínimo de chars para confiar en la extracción de texto

    if (mediaType === 'application/pdf' && extractedText.length >= TEXT_THRESHOLD) {
      // Modo eficiente: solo texto
      console.log("Strategy: text extraction (sufficient text found)");
      const systemPrompt = `Eres la IA QA y auditora de la agencia de Bienes Raíces ZHomes.
El agente inmobiliario ha subido este archivo como parte del checklist de cierre de una transacción.
${docContext}
INSTRUCCIONES ESTRICTAS:
- Analiza el contenido del documento.
- Si NO cumple las REGLAS ESTRICTAS, devuelve status "rejected" con el motivo.
- Si SÍ cumple, devuelve status "approved" con viñetas de fechas, montos y riesgos.
- Si es imposible determinarlo, devuelve status "reviewing".

Devuelve ESTRICTAMENTE este JSON:
{
  "status": "approved" | "rejected" | "reviewing",
  "feedback": "..."
}`;
      aiInput = {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: `Texto del documento:\n\n${extractedText.slice(0, 80000)}` }
        ]
      };
    } else {
      // Modo visión: mandamos el archivo completo (PDF nativo o Image)
      console.log(`Strategy: vision/native (${mediaType || 'unknown type'})`);

      if (!mediaType) {
        // Tipo de archivo no soportado
        console.warn("Unsupported file type:", fileName);
        if (documentId) {
          await supabase.from('tc_documents').update({
            ai_feedback: "Tipo de archivo no reconocido. Solo se aceptan PDFs, JPG, PNG y WEBP.",
            status: 'rejected'
          }).eq('id', documentId);
          await supabase.from('tc_messages').insert({
            transaction_id: transactionId,
            sender_name: 'ZHomes AI',
            sender_role: 'system',
            content: `⚠️ Documento Rechazado: El tipo de archivo "${fileName}" no es compatible. Por favor suba un PDF, JPG o PNG.`,
            message_type: 'document_update',
          });
        }
        return res.status(200).json({ success: true, status: "rejected", message: "Unsupported file type" });
      }

      const { messages } = buildOpenAIMessage(fileName, base64Data, mediaType, docContext);
      aiInput = {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages
      };
    }

    // ── 5. Llamar a OpenAI ──
    let aiResult = { status: 'reviewing', feedback: 'No se pudo procesar el documento.' };
    try {
      const aiResponse = await openai.chat.completions.create(aiInput);
      const rawContent = aiResponse.choices[0].message.content;
      console.log("OpenAI raw response:", rawContent);
      aiResult = JSON.parse(rawContent);
    } catch (aiError) {
      console.error("OpenAI call failed:", aiError);
    }

    // Normalizar el status por si la IA devuelve algo inesperado
    const validStatuses = ['approved', 'rejected', 'reviewing'];
    if (!validStatuses.includes(aiResult.status)) {
      aiResult.status = 'reviewing';
    }

    // ── 6. Actualizar la DB y notificar según el resultado ──
    if (documentId) {
      if (aiResult.status === 'approved') {
        await supabase.from('tc_documents').update({
          ai_feedback: aiResult.feedback,
          status: 'approved'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI',
          sender_role: 'system',
          content: `✅ Documento Aprobado Automáticamente:\n\n${aiResult.feedback}`,
          message_type: 'document_update',
        });

        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: 'Documento aprobado automáticamente por ZHomes AI',
          is_alert: false,
        });

        // Email de confirmación via Resend
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
                subject: `✅ Documento Aprobado: ${fileName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #fff; margin: 0; font-size: 20px;">ZHomes AI — Documento Aprobado</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                      <p style="font-size: 16px;">El siguiente documento ha sido <strong style="color: #16a34a;">aprobado automáticamente</strong> por nuestro sistema de IA:</p>
                      <p style="background: #fff; border: 1px solid #e2e8f0; border-radius:6px; padding: 12px; font-weight: bold;">${fileName}</p>
                      <h3 style="color: #0f172a;">Resumen del documento:</h3>
                      <div style="background: #fff; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 4px;">
                        ${aiResult.feedback.replace(/\n/g, '<br />')}
                      </div>
                      <br/>
                      <a href="https://zhomesapp.com/tc-room" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ver en ZHomes Deal Room →</a>
                    </div>
                  </div>
                `
              })
            });
            console.log("Approval email sent via Resend.");
          } catch (emailErr) {
            console.error("Resend email failed:", emailErr);
          }
        }

      } else if (aiResult.status === 'rejected') {
        await supabase.from('tc_documents').update({
          rejection_reason: aiResult.feedback,
          status: 'rejected'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI',
          sender_role: 'system',
          content: `❌ Documento Rechazado:\n\n${aiResult.feedback}`,
          message_type: 'document_update',
        });

        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: 'Documento rechazado automáticamente por ZHomes AI.',
          is_alert: true,
        });

      } else {
        // reviewing — no se pudo determinar, se escala a revisión manual
        await supabase.from('tc_documents').update({
          ai_feedback: aiResult.feedback,
          status: 'reviewing'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI',
          sender_role: 'system',
          content: `🔎 Revisión Manual Requerida:\n\n${aiResult.feedback}`,
          message_type: 'document_update',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Documento procesado exitosamente",
      ai_evaluation: aiResult
    });

  } catch (err) {
    console.error("Process Document Fatal Error:", err);
    res.status(500).json({ error: "Document processing failed", details: err.message });
  }
}
