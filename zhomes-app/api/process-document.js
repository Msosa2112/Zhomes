import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const config = { maxDuration: 60 };

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

// ─────────────────────────────────────────────────────────────────
// Helper: insertar mensaje en el chat del deal
// ─────────────────────────────────────────────────────────────────
async function postChatMessage(supabase, transactionId, content) {
  await supabase.from('tc_messages').insert({
    transaction_id: transactionId,
    sender_name: 'ZHomes AI',
    sender_role: 'system',
    content,
    message_type: 'document_update',
  });
}

// ─────────────────────────────────────────────────────────────────
// Helper: actualizar estado del documento en la BD
// ─────────────────────────────────────────────────────────────────
async function updateDocStatus(supabase, documentId, status, feedback, rejectionReason) {
  const patch = { status };
  if (feedback)         patch.ai_feedback       = feedback;
  if (rejectionReason)  patch.rejection_reason  = rejectionReason;
  await supabase.from('tc_documents').update(patch).eq('id', documentId);
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filePath, fileName, transactionId, documentId } = req.body;

    if (!filePath || !fileName || !transactionId) {
      return res.status(400).json({ error: "Missing required fields (filePath, fileName, transactionId)" });
    }

    // ── Inicializar clientes ──────────────────────────────────
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("FATAL: OPENAI_API_KEY is not set in environment variables.");
      return res.status(500).json({ error: "OPENAI_API_KEY not configured on server." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    const openai   = new OpenAI({ apiKey: openaiApiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);
    const mediaType = getMediaType(fileName);

    // ── 1. Tipo de archivo no soportado ──────────────────────
    if (!mediaType) {
      if (documentId) {
        await updateDocStatus(supabase, documentId, 'rejected',
          null,
          `Tipo de archivo no compatible: "${fileName}". Solo se aceptan PDF, JPG, PNG o WEBP.`);
        await postChatMessage(supabase, transactionId,
          `❌ Documento Rechazado: El tipo de archivo "${fileName}" no es compatible. Suba un PDF, JPG o PNG.`);
      }
      return res.status(200).json({ success: true, status: "rejected", message: "Unsupported file type" });
    }

    // ── 2. Descargar el archivo de Supabase Storage ───────────
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('tc_documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return res.status(500).json({ error: "Could not download file", details: downloadError?.message });
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

    const systemPrompt = `Eres la IA auditora y coordinadora de transacciones de ZHomes Real Estate.
El agente inmobiliario ha subido este archivo como parte del checklist de cierre de una transacción.
${docContext}
INSTRUCCIONES:
- Analiza el contenido real del documento con detalle.
- Si NO cumple las REGLAS ESTRICTAS, devuelve status "rejected" con el motivo exacto.
- Si SÍ cumple, devuelve status "approved" con un resumen de fechas, montos y riesgos relevantes en viñetas en español.
- Solo si el archivo es genuinamente ilegible o corrupto, devuelve status "reviewing".

Devuelve ESTRICTAMENTE este JSON (sin markdown ni texto extra):
{
  "status": "approved" | "rejected" | "reviewing",
  "feedback": "..."
}`;

    // ── 4. Elegir estrategia según tipo y contenido ───────────
    let aiMessages = [];
    const TEXT_THRESHOLD = 200;
    let strategy = "";

    if (mediaType === 'application/pdf') {
      // Intentar extraer texto primero
      let extractedText = "";
      try {
        const parsed = await pdfParse(buffer);
        extractedText = (parsed.text || "").replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ').trim();
        console.log(`pdf-parse: extracted ${extractedText.length} chars`);
      } catch (e) {
        console.warn("pdf-parse failed:", e.message);
      }

      if (extractedText.length >= TEXT_THRESHOLD) {
        // ✅ PDF con texto → modo texto (barato, confiable)
        strategy = "text-only (gpt-4o-mini)";
        aiMessages = [
          { role: "system", content: systemPrompt },
          { role: "user",   content: `Texto extraído del documento:\n\n${extractedText.slice(0, 80000)}` }
        ];
      } else {
        // 🔄 PDF escaneado/protegido → base64 inline con gpt-4o vision
        strategy = "inline-base64-pdf (gpt-4o)";
        const base64 = buffer.toString('base64');
        // Usar el endpoint de Responses API que soporta PDFs nativamente
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
                file: {
                  filename: fileName,
                  file_data: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ];
      }

    } else if (mediaType.startsWith('image/')) {
      // 🖼️ Imagen directa (foto del celular, JPG, PNG)
      strategy = "vision-base64 (gpt-4o)";
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

    if (aiMessages.length === 0) {
      console.error("No aiMessages built — strategy not determined.");
      return res.status(500).json({ error: "Could not determine processing strategy for file." });
    }

    console.log(`Strategy selected: ${strategy}`);

    // ── 5. Llamar a OpenAI ────────────────────────────────────
    // Usar gpt-4o para imágenes y PDFs escaneados (vision),
    // gpt-4o-mini para texto plano (más barato)
    const model = strategy.startsWith("text-only") ? "gpt-4o-mini" : "gpt-4o";

    let aiResult = { status: 'reviewing', feedback: 'No se pudo procesar el documento automáticamente.' };
    try {
      const aiResponse = await openai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: aiMessages,
        max_tokens: 1000,
      });
      const rawContent = aiResponse.choices[0].message.content;
      console.log(`OpenAI (${model}) response:`, rawContent);
      const parsed = JSON.parse(rawContent);
      if (['approved', 'rejected', 'reviewing'].includes(parsed.status)) {
        aiResult = parsed;
      }
    } catch (aiError) {
      console.error("OpenAI API call failed:", aiError.status, aiError.message, aiError.code);
      // Para scanned PDFs que fallan con inline, intentar subir a Files API
      if (strategy.includes('inline-base64-pdf')) {
        console.log("Retrying with OpenAI Files API...");
        try {
          const file = await openai.files.create({
            file: new File([buffer], fileName, { type: 'application/pdf' }),
            purpose: 'user_data'
          });
          const fileId = file.id;
          console.log("Files API upload OK, file_id:", fileId);

          const retryResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  { type: "text", text: "Analiza el siguiente documento PDF adjunto. Devuelve solo el JSON." },
                  { type: "file", file: { file_id: fileId } }
                ]
              }
            ],
            max_tokens: 1000,
          });

          // Limpiar el archivo DESPUÉS del uso
          await openai.files.del(fileId).catch(e => console.warn("Could not delete file:", e.message));

          const retryContent = retryResponse.choices[0].message.content;
          console.log("Retry response:", retryContent);
          const retryParsed = JSON.parse(retryContent);
          if (['approved', 'rejected', 'reviewing'].includes(retryParsed.status)) {
            aiResult = retryParsed;
          }
        } catch (retryErr) {
          console.error("Files API retry also failed:", retryErr.message);
        }
      }
    }

    console.log("Final AI result:", aiResult.status, "|", aiResult.feedback?.slice(0, 100));

    // ── 6. Actualizar BD y notificar ──────────────────────────
    if (documentId) {
      if (aiResult.status === 'approved') {
        await updateDocStatus(supabase, documentId, 'approved', aiResult.feedback, null);
        await postChatMessage(supabase, transactionId, `✅ Documento Aprobado Automáticamente:\n\n${aiResult.feedback}`);
        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: 'Documento aprobado automáticamente por ZHomes AI',
          is_alert: false,
        });

        // Email de confirmación vía Resend
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
                      <p style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-weight:bold;">${fileName}</p>
                      <h3>Resumen del documento:</h3>
                      <div style="background:#fff;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;">
                        ${aiResult.feedback.replace(/\n/g, '<br />')}
                      </div>
                      <br/>
                      <a href="https://zhomesapp.com/tc-room" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Ver en ZHomes Deal Room →</a>
                    </div>
                  </div>
                `
              })
            });
            console.log("Approval email sent via Resend.");
          } catch (emailErr) {
            console.error("Resend failed:", emailErr.message);
          }
        }

      } else if (aiResult.status === 'rejected') {
        await updateDocStatus(supabase, documentId, 'rejected', null, aiResult.feedback);
        await postChatMessage(supabase, transactionId, `❌ Documento Rechazado:\n\n${aiResult.feedback}`);
        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: 'Documento rechazado automáticamente por ZHomes AI.',
          is_alert: true,
        });

      } else {
        // reviewing
        await updateDocStatus(supabase, documentId, 'reviewing', aiResult.feedback, null);
        await postChatMessage(supabase, transactionId, `🔎 Revisión Manual Requerida:\n\n${aiResult.feedback}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Documento procesado exitosamente",
      strategy,
      ai_evaluation: aiResult
    });

  } catch (err) {
    console.error("Process Document Fatal Error:", err);
    res.status(500).json({ error: "Document processing failed", details: err.message });
  }
}
