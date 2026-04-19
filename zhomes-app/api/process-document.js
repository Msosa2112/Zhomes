import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const config = { maxDuration: 60 };

// ─────────────────────────────────────────────────────────────
// Helper: tipo de archivo según extensión
// ─────────────────────────────────────────────────────────────
function getMediaType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  const map = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    tiff: 'image/tiff', tif: 'image/tiff',
  };
  return map[ext] || null;
}

// ─────────────────────────────────────────────────────────────
// Helper: insertar mensaje en el chat del deal
// ─────────────────────────────────────────────────────────────
async function postChatMessage(supabase, transactionId, content) {
  await supabase.from('tc_messages').insert({
    transaction_id: transactionId,
    sender_name: 'ZHomes AI',
    sender_role: 'system',
    content,
    message_type: 'document_update',
  });
}

// ─────────────────────────────────────────────────────────────
// Helper: actualizar estado del documento en la BD
// ─────────────────────────────────────────────────────────────
async function updateDocStatus(supabase, documentId, status, feedback) {
  const patch = { status };
  if (feedback) patch.ai_feedback = feedback;
  await supabase.from('tc_documents').update(patch).eq('id', documentId);
}

// ─────────────────────────────────────────────────────────────
// Helper: enviar email vía Resend
// ─────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'ZHomes TC <tc@zhomesapp.com>', to, subject, html }),
    });
    const data = await resp.json();
    console.log(`Email sent to ${to}:`, data.id || data.error);
  } catch (e) {
    console.error(`Email to ${to} failed:`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filePath, fileName, transactionId, documentId } = req.body;

    if (!filePath || !fileName || !transactionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ── Clientes ─────────────────────────────────────────────
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured." });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Supabase config missing" });

    const openai   = new OpenAI({ apiKey: openaiApiKey });
    const supabase = createClient(supabaseUrl, supabaseKey);
    const mediaType = getMediaType(fileName);

    // ── 1. Tipo de archivo no soportado ──────────────────────
    if (!mediaType) {
      if (documentId) {
        await updateDocStatus(supabase, documentId, 'rejected',
          `Tipo de archivo no compatible: "${fileName}". Solo se aceptan PDF, JPG, PNG o WEBP.`);
        await postChatMessage(supabase, transactionId,
          `El archivo que subiste no es compatible. Por favor sube un PDF, JPG o PNG y vuelve a intentarlo.`);
      }
      return res.status(200).json({ success: true, status: "rejected" });
    }

    // ── 2. Descargar archivo de Supabase Storage ─────────────
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('tc_documents').download(filePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return res.status(500).json({ error: "Could not download file", details: downloadError?.message });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // ── 3. Obtener contexto del documento y datos de la transacción ─
    let docName     = fileName;
    let docGuidelines = "";

    if (documentId) {
      const { data: tcDoc } = await supabase
        .from('tc_documents').select('name, ai_guidelines').eq('id', documentId).single();
      if (tcDoc) {
        docName       = tcDoc.name || fileName;
        docGuidelines = tcDoc.ai_guidelines || "";
      }
    }

    // Obtener emails del cliente y del realtor desde la transacción
    const { data: txData } = await supabase
      .from('tc_transactions')
      .select('client_name, client_email, address')
      .eq('id', transactionId)
      .single();

    const clientEmail = txData?.client_email || null;
    const clientName  = txData?.client_name  || 'Cliente';
    const address     = txData?.address      || '';

    // Email del realtor vía zhomes_agents
    const { data: txRealtor } = await supabase
      .from('tc_transactions')
      .select('realtor_id')
      .eq('id', transactionId)
      .single();

    let realtorEmail = null;
    let realtorName  = 'Agente';
    if (txRealtor?.realtor_id) {
      const { data: agent } = await supabase
        .from('zhomes_agents')
        .select('full_name, email')
        .eq('id', txRealtor.realtor_id)
        .single();
      if (agent) { realtorEmail = agent.email; realtorName = agent.full_name; }
    }

    console.log(`Emails → cliente: ${clientEmail}, realtor: ${realtorEmail}`);

    // ── 4. Construir prompt del AI ────────────────────────────
    // FIX 1: Lenguaje natural, SIN markdown, SIN asteriscos, SIN listas
    const docContext = docGuidelines
      ? `El tipo de documento es "${docName}". Criterios de validación: ${docGuidelines}`
      : `El tipo de documento es "${docName}".`;

    const systemPrompt = `Eres la IA de ZHomes Real Estate que revisa documentos de cierre de transacciones inmobiliarias.
${docContext}

INSTRUCCIONES IMPORTANTES:
- Analiza el contenido del documento con detalle.
- Si NO cumple los criterios, devuelve status "rejected" explicando el motivo en lenguaje natural y sencillo.
- Si SÍ cumple, devuelve status "approved" con un resumen breve en 2-3 oraciones en español, en lenguaje natural y conversacional.
- Solo si el archivo es genuinamente ilegible o corrupto, devuelve status "reviewing".
- NO uses asteriscos, guiones, markdown, ni listas. Escribe en prosa natural como si le hablaras a una persona.
- El campo "feedback" debe ser siempre un string de texto plano, no un objeto.

Devuelve ESTRICTAMENTE este JSON (sin markdown ni texto extra):
{
  "status": "approved" | "rejected" | "reviewing",
  "feedback": "texto plano aqui"
}`;

    // ── 5. Elegir estrategia ──────────────────────────────────
    let aiMessages = [];
    let strategy   = "";

    if (mediaType === 'application/pdf') {
      let extractedText = "";
      try {
        const parsed  = await pdfParse(buffer);
        extractedText = (parsed.text || "").replace(/\n+/g, '\n').replace(/\s{2,}/g, ' ').trim();
        console.log(`pdf-parse: ${extractedText.length} chars`);
      } catch (e) {
        console.warn("pdf-parse failed:", e.message);
      }

      if (extractedText.length >= 200) {
        strategy   = "text-only (gpt-4o-mini)";
        aiMessages = [
          { role: "system", content: systemPrompt },
          { role: "user",   content: `Texto extraído del documento:\n\n${extractedText.slice(0, 80000)}` }
        ];
      } else {
        strategy = "inline-base64-pdf (gpt-4o)";
        const base64 = buffer.toString('base64');
        aiMessages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analiza el siguiente documento PDF. Devuelve solo el JSON." },
              { type: "file", file: { filename: fileName, file_data: `data:application/pdf;base64,${base64}` } }
            ]
          }
        ];
      }

    } else if (mediaType.startsWith('image/')) {
      strategy = "vision-base64 (gpt-4o)";
      const base64 = buffer.toString('base64');
      aiMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" } },
            { type: "text", text: "Analiza este documento. Devuelve solo el JSON." }
          ]
        }
      ];
    }

    if (aiMessages.length === 0) {
      return res.status(500).json({ error: "Could not determine processing strategy." });
    }

    console.log(`Strategy: ${strategy}`);

    // ── 6. Llamar a OpenAI ────────────────────────────────────
    const model = strategy.startsWith("text-only") ? "gpt-4o-mini" : "gpt-4o";
    const toStr = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v));

    let aiResult     = { status: 'reviewing', feedback: 'No se pudo analizar el documento.' };
    let aiErrorDetail = null;

    try {
      const aiResponse = await openai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: aiMessages,
        max_tokens: 800,
      });

      const rawContent = aiResponse.choices[0].message.content;
      console.log(`OpenAI raw:`, rawContent);
      const parsed = JSON.parse(rawContent);

      const statusMap = {
        'approved': 'approved', 'aprobado': 'approved', 'approve': 'approved',
        'rejected': 'rejected', 'rechazado': 'rejected', 'reject': 'rejected',
        'reviewing': 'reviewing', 'revision': 'reviewing', 'revisión': 'reviewing',
      };
      const normalizedStatus = statusMap[(parsed.status || '').toLowerCase()];
      if (normalizedStatus) {
        aiResult = {
          status: normalizedStatus,
          feedback: toStr(parsed.feedback ?? parsed.comentarios ?? parsed.response ?? parsed),
        };
      }
    } catch (aiError) {
      aiErrorDetail = `[${aiError.status || 'ERR'}] ${aiError.message} (code: ${aiError.code || 'N/A'})`;
      console.error("OpenAI failed:", aiErrorDetail);
    }

    console.log("AI result:", aiResult.status, "|", String(aiResult.feedback).slice(0, 120));

    // ── 7. Actualizar BD + notificaciones ─────────────────────
    if (documentId) {

      if (aiResult.status === 'approved') {
        // Guardar análisis completo en BD (para TC/realtor)
        await updateDocStatus(supabase, documentId, 'approved', aiResult.feedback);

        // FIX 2: Mensaje corto y amigable para el chat (lo ve el cliente)
        await postChatMessage(supabase, transactionId,
          `Tu documento "${docName}" fue revisado y aprobado. ¡Todo está en orden! Si tienes alguna duda, escríbenos aquí.`
        );

        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: `Documento "${docName}" aprobado automáticamente por ZHomes AI.`,
          is_alert: false,
        });

        // FIX 3: Email al CLIENTE
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: `✅ Documento aprobado: ${docName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
                <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px">ZHomes — Documento Aprobado ✅</h1>
                </div>
                <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
                  <p>Hola ${clientName},</p>
                  <p>Tu documento <strong>${docName}</strong> para la propiedad <strong>${address}</strong> fue revisado y <strong style="color:#16a34a">aprobado</strong>. Todo está en orden.</p>
                  <p>${aiResult.feedback}</p>
                  <br/>
                  <a href="https://zhomesapp.com/tc-room" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ver mi Deal Room →</a>
                  <br/><br/>
                  <p style="color:#64748b;font-size:13px">Si tienes preguntas, responde este correo o escríbenos en el chat de tu Deal Room.</p>
                </div>
              </div>
            `,
          });
        }

        // FIX 3: Email al REALTOR con análisis completo
        if (realtorEmail) {
          await sendEmail({
            to: realtorEmail,
            subject: `✅ [ZHomes TC] Documento aprobado: ${docName} — ${address}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
                <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px">ZHomes TC — Documento Aprobado</h1>
                </div>
                <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
                  <p>Hola ${realtorName},</p>
                  <p>El documento <strong>${docName}</strong> de la transacción <strong>${address}</strong> fue aprobado automáticamente.</p>
                  <h3>Resumen del análisis:</h3>
                  <div style="background:#fff;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px">
                    ${aiResult.feedback}
                  </div>
                  <br/>
                  <a href="https://zhomesapp.com/tc-room" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ver en TC Dashboard →</a>
                </div>
              </div>
            `,
          });
        }

      } else if (aiResult.status === 'rejected') {
        await updateDocStatus(supabase, documentId, 'rejected', aiResult.feedback);

        // Mensaje corto para el chat
        await postChatMessage(supabase, transactionId,
          `Tu documento "${docName}" no pudo ser aprobado. ${aiResult.feedback} Por favor corrígelo y vuelve a subirlo.`
        );

        await supabase.from('tc_events').insert({
          transaction_id: transactionId,
          event_type: 'document_reviewed',
          description: `Documento "${docName}" rechazado. Motivo: ${String(aiResult.feedback).slice(0, 200)}`,
          is_alert: true,
        });

        // Email al cliente sobre rechazo
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: `⚠️ Documento requiere corrección: ${docName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
                <div style="background:#7f1d1d;padding:24px;border-radius:8px 8px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px">Documento Requiere Corrección</h1>
                </div>
                <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
                  <p>Hola ${clientName},</p>
                  <p>Revisamos tu documento <strong>${docName}</strong> y necesita una corrección antes de continuar:</p>
                  <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px">
                    ${aiResult.feedback}
                  </div>
                  <br/>
                  <p>Por favor corrígelo y súbelo de nuevo en tu Deal Room.</p>
                  <a href="https://zhomesapp.com/tc-room" style="display:inline-block;background:#7f1d1d;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ir a mi Deal Room →</a>
                </div>
              </div>
            `,
          });
        }

        // Email al realtor sobre rechazo
        if (realtorEmail) {
          await sendEmail({
            to: realtorEmail,
            subject: `⚠️ [ZHomes TC] Documento rechazado: ${docName} — ${address}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
                <div style="background:#7f1d1d;padding:24px;border-radius:8px 8px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:20px">ZHomes TC — Documento Rechazado</h1>
                </div>
                <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
                  <p>Hola ${realtorName},</p>
                  <p>El documento <strong>${docName}</strong> de la transacción <strong>${address}</strong> fue rechazado.</p>
                  <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px">
                    ${aiResult.feedback}
                  </div>
                  <br/>
                  <a href="https://zhomesapp.com/tc-room" style="display:inline-block;background:#7f1d1d;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ver en TC Dashboard →</a>
                </div>
              </div>
            `,
          });
        }

      } else {
        // reviewing — algo no funcionó
        await updateDocStatus(supabase, documentId, 'reviewing',
          aiErrorDetail || aiResult.feedback);
        await postChatMessage(supabase, transactionId,
          `No pudimos procesar tu documento "${docName}" automáticamente. Nuestro equipo lo revisará manualmente en breve.`
        );
      }
    }

    return res.status(200).json({
      success: true,
      strategy,
      ai_evaluation: { status: aiResult.status, feedback: String(aiResult.feedback).slice(0, 300) },
    });

  } catch (err) {
    console.error("Process Document Fatal Error:", err);
    res.status(500).json({ error: "Document processing failed", details: err.message });
  }
}
