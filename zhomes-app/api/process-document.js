import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { buildEmailHtml } from "./_email-brand.js";
import admin from "firebase-admin";

// ── Inicializar Firebase Admin (HTTP v1) de forma segura ──
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (Object.keys(serviceAccount).length > 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (e) {
    console.error("Firebase admin init error:", e.message);
  }
}

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
// Helper: enviar FCM push notification vía HTTP v1 (Firebase Admin)
// Lee el token del usuario desde la tabla push_tokens de Supabase
// ─────────────────────────────────────────────────────────────
async function sendFCMPush(supabase, userId, { title, body, data = {} }) {
  if (!admin.apps.length || !userId) return;
  try {
    // Buscar token del usuario
    const { data: tokenRow } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .single();
      
    if (!tokenRow?.token) return;

    // Convert numeric IDs to strings for FCM data payload
    const stringData = {};
    for (const key in data) { stringData[key] = String(data[key]); }

    await admin.messaging().send({
      token: tokenRow.token,
      notification: { title, body },
      data: stringData,
      webpush: {
        notification: {
          icon: 'https://zhomes.vercel.app/assets/logo/fav.png',
          badge: 'https://zhomes.vercel.app/assets/logo/fav.png',
        }
      }
    });
  } catch (e) {
    console.error("FCM Push Error:", e);
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth guard: validar JWT de Supabase ──────────────────────
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.replace('Bearer ', '').trim();
  if (!jwt) return res.status(401).json({ error: 'No autorizado — falta token de sesión' });
  // Verificación ligera: el JWT debe tener 3 segmentos (no verificamos firma aquí, Supabase RLS lo hace)
  if (jwt.split('.').length !== 3) return res.status(401).json({ error: 'Token inválido' });


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

    let realtorEmail   = null;
    let realtorName    = 'Agente';
    let realtorUserId  = null;
    if (txRealtor?.realtor_id) {
      const { data: agent } = await supabase
        .from('zhomes_agents')
        .select('full_name, email, user_id')
        .eq('id', txRealtor.realtor_id)
        .single();
      if (agent) {
        realtorEmail  = agent.email;
        realtorName   = agent.full_name;
        realtorUserId = agent.user_id || null;
      }
    }

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

        // FCM push al realtor
        await sendFCMPush(supabase, realtorUserId, {
          title: `✅ Documento aprobado`,
          body: `"${docName}" de ${clientName} en ${address} fue aprobado por ZHomes AI.`,
          data: { transactionId, type: 'document_approved' },
        });

        // Email al CLIENTE (aprobado)
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: `✅ Documento aprobado: ${docName}`,
            html: buildEmailHtml({
              headerColor: '#166534',
              headerLabel: '✅ Tu documento fue aprobado',
              ctaLabel: 'Ver mi Deal Room →',
              bodyHtml: `
                <p style="color:#333;font-size:15px">Hola <strong>${clientName}</strong>,</p>
                <p style="color:#333;font-size:15px">Tu documento <strong>${docName}</strong> para la propiedad <strong>${address}</strong> fue revisado y <strong style="color:#16a34a">aprobado</strong>. Todo está en orden.</p>
                <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 18px;border-radius:6px;color:#166534;font-size:14px;line-height:1.6;margin:16px 0">
                  ${aiResult.feedback}
                </div>
              `,
            }),
          });
        }

        // Email al REALTOR con análisis completo (aprobado)
        if (realtorEmail) {
          await sendEmail({
            to: realtorEmail,
            subject: `✅ [ZHomes TC] Documento aprobado: ${docName} — ${address}`,
            html: buildEmailHtml({
              headerColor: '#0f172a',
              headerLabel: `Documento aprobado: ${docName}`,
              ctaLabel: 'Ver en TC Dashboard →',
              bodyHtml: `
                <p style="color:#333;font-size:15px">Hola <strong>${realtorName}</strong>,</p>
                <p style="color:#333;font-size:15px">El documento <strong>${docName}</strong> de la transacción <strong>${address}</strong> fue aprobado automáticamente por ZHomes AI.</p>
                <h3 style="color:#0f172a;font-size:14px;margin:20px 0 8px">Resumen del análisis:</h3>
                <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 18px;border-radius:6px;color:#166534;font-size:14px;line-height:1.6">
                  ${aiResult.feedback}
                </div>
              `,
            }),
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

        // FCM push al realtor
        await sendFCMPush(supabase, realtorUserId, {
          title: `⚠️ Documento rechazado`,
          body: `"${docName}" de ${clientName} requiere correción. Razón: ${String(aiResult.feedback).slice(0, 80)}`,
          data: { transactionId, type: 'document_rejected' },
        });

        // Email al CLIENTE (rechazado)
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: `⚠️ Documento requiere corrección: ${docName}`,
            html: buildEmailHtml({
              headerColor: '#7f1d1d',
              headerLabel: '⚠️ Tu documento requiere una corrección',
              ctaLabel: 'Ir a mi Deal Room →',
              ctaUrl: 'https://zhomesapp.com/tc-room',
              bodyHtml: `
                <p style="color:#333;font-size:15px">Hola <strong>${clientName}</strong>,</p>
                <p style="color:#333;font-size:15px">Revisamos tu documento <strong>${docName}</strong> y necesita una corrección antes de continuar con el cierre:</p>
                <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;border-radius:6px;color:#991b1b;font-size:14px;line-height:1.6;margin:16px 0">
                  ${aiResult.feedback}
                </div>
                <p style="color:#64748b;font-size:14px">Por favor corrígelo y súbelo de nuevo en tu Deal Room.</p>
              `,
            }),
          });
        }

        // Email al REALTOR (rechazado)
        if (realtorEmail) {
          await sendEmail({
            to: realtorEmail,
            subject: `⚠️ [ZHomes TC] Documento rechazado: ${docName} — ${address}`,
            html: buildEmailHtml({
              headerColor: '#7f1d1d',
              headerLabel: `Documento rechazado: ${docName}`,
              ctaLabel: 'Ver en TC Dashboard →',
              ctaUrl: 'https://zhomesapp.com/tc-room',
              bodyHtml: `
                <p style="color:#333;font-size:15px">Hola <strong>${realtorName}</strong>,</p>
                <p style="color:#333;font-size:15px">El documento <strong>${docName}</strong> de la transacción <strong>${address}</strong> fue rechazado por ZHomes AI.</p>
                <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;border-radius:6px;color:#991b1b;font-size:14px;line-height:1.6;margin:16px 0">
                  ${aiResult.feedback}
                </div>
              `,
            }),
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
