import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const config = {
  maxDuration: 60,
};

// ─────────────────────────────────────────────────────────────
// Helper: detectar el media_type según extensión
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
// Helper: subir PDF a OpenAI Files API y retornar file_id
// ─────────────────────────────────────────────────────────────
async function uploadPdfToOpenAI(buffer, fileName, apiKey) {
  // Use native Node 18 FormData + Blob (no external packages needed)
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const form = new FormData();
  form.append('file', blob, fileName);
  form.append('purpose', 'assistants');

  const response = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
      // Do NOT set Content-Type here - fetch sets it automatically with boundary
    },
    body: form
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Files API upload failed: ${err}`);
  }

  const data = await response.json();
  return data.id; // file_id
}

// ─────────────────────────────────────────────────────────────
// Helper: eliminar archivo de OpenAI Files API (limpieza)
// ─────────────────────────────────────────────────────────────
async function deleteOpenAIFile(fileId, apiKey) {
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
  } catch (e) {
    console.warn("Could not delete OpenAI file:", e.message);
  }
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

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openai       = new OpenAI({ apiKey: openaiApiKey });
    const supabaseUrl  = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey  = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    const supabase   = createClient(supabaseUrl, supabaseKey);
    const mediaType  = getMediaType(fileName);

    // ── 1. Tipo de archivo no soportado ──────────────────────
    if (!mediaType) {
      if (documentId) {
        await supabase.from('tc_documents').update({
          ai_feedback: `Tipo de archivo no compatible: "${fileName}". Solo se aceptan PDF, JPG, PNG o WEBP.`,
          status: 'rejected'
        }).eq('id', documentId);
        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI', sender_role: 'system',
          content: `❌ Documento Rechazado: El tipo de archivo "${fileName}" no es compatible. Suba un PDF, JPG o PNG.`,
          message_type: 'document_update',
        });
      }
      return res.status(200).json({ success: true, status: "rejected", message: "Unsupported file type" });
    }

    // ── 2. Descargar el archivo de Supabase Storage ───────────
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('tc_documents')
      .download(filePath);

    if (downloadError) {
      console.error("Storage download error:", downloadError);
      return res.status(500).json({ error: "Could not download file", details: downloadError.message });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    // ── 3. Obtener contexto del tipo de documento ─────────────
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

    const systemPrompt = `Eres la IA QA y auditora de la agencia de Bienes Raíces ZHomes.
El agente inmobiliario ha subido este archivo como parte del checklist de cierre de una transacción.
${docContext}
INSTRUCCIONES:
- Analiza el contenido real del documento con todo detalle.
- Si NO cumple las REGLAS ESTRICTAS, devuelve status "rejected" explicando el motivo exacto.
- Si SÍ cumple, devuelve status "approved" con un resumen de: fechas límite, montos (purchase price, earnest money, comisiones, etc.) y riesgos relevantes, en viñetas claras en español.
- Solo si el archivo es genuinamente ilegible o corrupto, devuelve status "reviewing".

Devuelve ESTRICTAMENTE este JSON (sin markdown ni texto extra):
{
  "status": "approved" | "rejected" | "reviewing",
  "feedback": "..."
}`;

    // ── 4. Elegir estrategia según tipo y contenido ───────────
    let aiMessages = [];
    const TEXT_THRESHOLD = 200;

    if (mediaType === 'application/pdf') {
      // Intentar extraer texto primero (rápido y barato)
      let extractedText = "";
      try {
        const parsed = await pdfParse(buffer);
        extractedText = (parsed.text || "").replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ').trim();
        console.log(`pdf-parse: extracted ${extractedText.length} chars`);
      } catch (e) {
        console.warn("pdf-parse failed:", e.message);
      }

      if (extractedText.length >= TEXT_THRESHOLD) {
        // PDF con texto → modo texto (barato)
        console.log("Strategy: text-only");
        aiMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Texto extraído del documento:\n\n${extractedText.slice(0, 80000)}` }
        ];
      } else {
        // PDF escaneado/protegido → subir a OpenAI Files API y usar file_id
        console.log("Strategy: OpenAI Files API (scanned/protected PDF)");
        let fileId = null;
        try {
          fileId = await uploadPdfToOpenAI(buffer, fileName, openaiApiKey);
          console.log("Uploaded to OpenAI Files API, file_id:", fileId);

          aiMessages = [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analiza el siguiente documento PDF. Devuelve solo el JSON solicitado."
                },
                {
                  type: "file",
                  file: { file_id: fileId }
                }
              ]
            }
          ];
        } catch (uploadErr) {
          console.error("OpenAI Files upload failed:", uploadErr.message);
          // Último recurso: marcar como reviewing
          if (documentId) {
            await supabase.from('tc_documents').update({
              ai_feedback: "El documento es un PDF escaneado o protegido que no pudo ser procesado automáticamente. Use Adobe Scan o CamScanner con OCR para generar un PDF con texto.",
              status: 'reviewing'
            }).eq('id', documentId);
            await supabase.from('tc_messages').insert({
              transaction_id: transactionId,
              sender_name: 'ZHomes AI', sender_role: 'system',
              content: "🔎 Revisión Manual Requerida: El PDF parece estar escaneado o protegido y no pudo ser leído automáticamente. Por favor, use una app de escaneo con OCR (Adobe Scan, CamScanner) y suba un nuevo PDF.",
              message_type: 'document_update',
            });
          }
          return res.status(200).json({ success: true, status: "reviewing", message: "Scanned PDF could not be uploaded for analysis" });
        }

        // Limpiar el archivo de OpenAI después de usar
        if (fileId) {
          await deleteOpenAIFile(fileId, openaiApiKey);
        }
      }

    } else if (mediaType.startsWith('image/')) {
      // Imagen directa (foto del celular, JPG, PNG)
      console.log("Strategy: Vision (image)");
      const base64 = buffer.toString('base64');
      aiMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" }
            },
            {
              type: "text",
              text: "Analiza esta imagen del documento. Devuelve solo el JSON solicitado."
            }
          ]
        }
      ];
    }

    // ── 5. Llamar a OpenAI ────────────────────────────────────
    let aiResult = { status: 'reviewing', feedback: 'No se pudo procesar el documento automáticamente.' };
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: aiMessages
      });
      const rawContent = aiResponse.choices[0].message.content;
      console.log("OpenAI response:", rawContent);
      const parsed = JSON.parse(rawContent);
      if (['approved', 'rejected', 'reviewing'].includes(parsed.status)) {
        aiResult = parsed;
      }
    } catch (aiError) {
      console.error("OpenAI call failed:", aiError.message);
    }

    // ── 6. Actualizar DB y notificar ──────────────────────────
    if (documentId) {
      if (aiResult.status === 'approved') {
        await supabase.from('tc_documents').update({
          ai_feedback: aiResult.feedback,
          status: 'approved'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI', sender_role: 'system',
          content: `✅ Documento Aprobado Automáticamente:\n\n${aiResult.feedback}`,
          message_type: 'document_update',
        });

        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: 'Documento aprobado automáticamente por ZHomes AI',
          is_alert: false,
        });

        // Email de confirmación
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
                      <p>El siguiente documento ha sido <strong style="color: #16a34a;">aprobado automáticamente</strong>:</p>
                      <p style="background: #fff; border: 1px solid #e2e8f0; border-radius:6px; padding: 12px; font-weight: bold;">${fileName}</p>
                      <h3>Resumen del documento:</h3>
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
            console.log("Approval email sent.");
          } catch (emailErr) {
            console.error("Resend failed:", emailErr.message);
          }
        }

      } else if (aiResult.status === 'rejected') {
        await supabase.from('tc_documents').update({
          rejection_reason: aiResult.feedback,
          status: 'rejected'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI', sender_role: 'system',
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
        // reviewing
        await supabase.from('tc_documents').update({
          ai_feedback: aiResult.feedback,
          status: 'reviewing'
        }).eq('id', documentId);

        await supabase.from('tc_messages').insert({
          transaction_id: transactionId,
          sender_name: 'ZHomes AI', sender_role: 'system',
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
