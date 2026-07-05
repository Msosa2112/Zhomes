import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-docuseal-signature',
}

// Validación de firma criptográfica HMAC SHA-256 de DocuSeal
async function verifyDocuSealSignature(
  bodyText: string, 
  headerSignature: string, 
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  // Transformar la firma hexadecimal en Uint8Array
  const cleanSig = headerSignature.trim();
  const signatureBytes = new Uint8Array(
    cleanSig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const data = encoder.encode(bodyText);
  return await crypto.subtle.verify("HMAC", key, signatureBytes, data);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
    const DOCUSEAL_WEBHOOK_SECRET = Deno.env.get('DOCUSEAL_WEBHOOK_SECRET')!;

    const bodyText = await req.text();
    const signature = req.headers.get('x-docuseal-signature');

    // 1. Verificación criptográfica estricta de DocuSeal
    if (!signature || !(await verifyDocuSealSignature(bodyText, signature, DOCUSEAL_WEBHOOK_SECRET))) {
      return new Response(JSON.stringify({ error: 'Criptografía no válida. Firma ausente o alterada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const payload = JSON.parse(bodyText);
    if (payload.event !== 'envelope.completed') {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const envelopeData = payload.data;
    const documentName = envelopeData.name;
    const downloadUrl = envelopeData.documents[0].download_url;
    const envelopeId = envelopeData.id.toString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // 2. Localizar transacción por correo del comprador
    const buyerEmail = envelopeData.submitters.find((s: any) => s.role === 'buyer')?.email;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', buyerEmail)
      .single();

    if (!profile) throw new Error(`No profile found for email ${buyerEmail}`);

    const { data: transaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('client_id', profile.id)
      .eq('status', 'under_contract')
      .limit(1)
      .single();

    if (!transaction) throw new Error(`No active deal room transaction found for client.`);

    // 3. Descarga del binario a memoria
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) throw new Error('Error al descargar documento de DocuSeal.');
    const pdfBlob = await fileResponse.blob();

    // 4. Subida a Supabase Storage
    const storagePath = `deals/${transaction.id}/${envelopeId}_signed.pdf`;
    const { error: storageError } = await supabase.storage
      .from('transaction-documents')
      .upload(storagePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

    if (storageError) throw storageError;

    const documentUrl = `${SUPABASE_URL}/storage/v1/object/sign/transaction-documents/${storagePath}`;

    // 5. Preparar binario en Base64 para OpenAI
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const pdfBase64 = btoa(binary);

    // 6. Ejecución de análisis en OpenAI con Structured Outputs (Timeout local de 60s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let chatCompletion;
    try {
      chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an ultra-strict Real Estate Legal Auditor. Analyze the contract text and return exact fields. 
Strictly forbid hallucination. If a value is missing, return null or "not_found".`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Perform a full compliance audit on this Purchase Agreement PDF." },
              {
                type: "input_file",
                file_data: { data: pdfBase64, mime_type: "application/pdf" }
              }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "contract_audit_schema",
            strict: true,
            schema: {
              type: "object",
              properties: {
                document_type: { type: "string", enum: ["Purchase Agreement", "HUD-1", "Addendum", "Disclosure", "Other"] },
                signatures_validated: { type: "boolean" },
                missing_signatures: { type: "array", items: { type: "string" } },
                contingencies_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      contingency_type: { type: "string", enum: ["inspection", "financing", "appraisal", "home_sale", "other"] },
                      deadline_date: { type: ["string", "null"] },
                      clause_summary: { type: "string" }
                    },
                    required: ["contingency_type", "deadline_date", "clause_summary"],
                    additionalProperties: false
                  }
                },
                audit_pass: { type: "boolean" },
                audit_anomalies: { type: "array", items: { type: "string" } },
                summary_es: { type: "string" }
              },
              required: ["document_type", "signatures_validated", "missing_signatures", "contingencies_found", "audit_pass", "audit_anomalies", "summary_es"],
              additionalProperties: false
            }
          }
        }
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    const audit = JSON.parse(chatCompletion.choices[0].message.content!);
    const status = audit.audit_pass ? 'approved' : 'reviewing';

    // 7. Actualización transaccional y notificaciones Realtime
    const { data: doc } = await supabase
      .from('tc_documents')
      .insert({
        transaction_id: transaction.id,
        name: documentName,
        document_url: documentUrl,
        status: status,
        docuseal_envelope_id: envelopeId
      })
      .select('id')
      .single();

    // Auditoría
    await supabase.from('tc_events').insert({
      transaction_id: transaction.id,
      event_type: audit.audit_pass ? 'audit_success' : 'audit_failed',
      description: `Auditoría completada. Estado: ${status}.`,
      raw_payload: audit
    });

    // Chat Feed
    await supabase.from('tc_messages').insert({
      transaction_id: transaction.id,
      sender_id: null,
      message_text: `Sistema ZHomes: ${audit.summary_es}`,
      is_system_notification: true
    });

    // Envío en Tiempo Real mediante Supabase Realtime si requiere revisión del Broker
    if (!audit.audit_pass) {
      await supabase.channel('tc_events').send({
        type: 'broadcast',
        event: 'alert_broker',
        payload: {
          transaction_id: transaction.id,
          message: `El documento '${documentName}' requiere atención manual inmediata.`,
          anomalies: audit.audit_anomalies
        }
      });
    }

    return new Response(JSON.stringify({ status: 'processed', doc_id: doc?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
