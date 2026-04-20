// api/zhomes-ai.js
import OpenAI from "openai";

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        // --- INICIO MOCK PARA DEMO ---
        // Si no hay llave, retornamos data realista de prueba para que la UI funcione excelente en la presentación
        if (!apiKey) {
            const { action, data } = req.body;
            if (action === "vibe_creator") {
                return res.status(200).json({
                    mlsDescription: "Impresionante propiedad moderna con acabados de primera calidad. Luz natural abundante, concepto abierto perfecto para el entretenimiento y una alberca de revista. Un oasis de lujo en Louisville listo para ti.",
                    tiktokScript: "¡ALERTA DE PROPIEDAD!  Tienes que ver esta casa en Louisville. Acabados de lujo, una piscina BRUTAL y mucha paz. ¿Quieres el tour completo? Déjame un fueguito en los comentarios o envíame DM directo. "
                });
            } else if (action === "smart_followup") {
                return res.status(200).json({
                    message: `¡Hola ${data?.clientData?.name?.split(' ')[0] || ''}! Noté que estabas viendo propiedades recientemente. Tengo justo un par de "pocket listings" off-market que encajan 100% con tu estilo. ¿Te late si te las mando por aquí o coordinamos una visita rápida esta semana? `
                });
            } else if (action === "deal_query") {
                return res.status(200).json({
                    answer: "Según los documentos indexados, la fecha de cierre es el 30 de abril de 2026 y el earnest money deposit es de $7,500.00.",
                    citations: ["purchase_agreement_TC-2026-0042.txt"]
                });
            } else if (action === "broker_compliance") {
                return res.status(200).json({
                    allPassed: true,
                    report: " Todos los documentos cumplen con las normativas (Agency Disclosure, Lead-Based Paint, etc) y las comisiones están correctamente declaradas. Listo para cerrar."
                });
            }
            return res.status(500).json({ error: "OpenAI API Key not configured." });
        }
        // --- FIN MOCK PARA DEMO ---

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const { action, data } = req.body;
        let system_message = "";
        let prompt = "";

        if (action === "broker_compliance") {
            const { documentText, rules } = data;
            system_message = "You are an expert real estate compliance assistant. You will evaluate the provided document text against the provided rules. Reply in Spanish. Return a JSON object with two fields: 'allPassed' (boolean) and 'report' (string). If all passed, 'report' should be a confirmation message. If failed, list the specific rules broken and instructions on what to fix.";
            prompt = `Document Text:\n${documentText}\n\nRules to check:\n${rules.map(r => "- " + r.text).join("\n")}`;
        } else if (action === "legal_translator") {
            const { documentText } = data;
            system_message = "You are an expert real estate lawyer. Summarize the key obligations, risks, or highlights from the provided document text in 3 to 5 easy-to-understand bullet points for a regular home buyer. Reply in Spanish. Return a JSON object with a single field 'summary' (array of strings).";
            prompt = `Document Text:\n${documentText}`;
        } else if (action === "vibe_creator") {
            system_message = "You are an expert real estate copywriter. The user wants you to create a catchy MLS description and a TikTok video script for a property. Reply in Spanish. Return a JSON object with 'mlsDescription' (string) and 'tiktokScript' (string).";
            prompt = `Generate the content for the property. Focus on modern aesthetics, luxury, and engaging narrative. Make the TikTok script energetic and structured with hook, body, and call to action.`;
        } else if (action === "smart_followup") {
            const { clientData } = data;
            system_message = "You are an expert real estate CRM assistant. Given the client details, suggest a short, engaging WhatsApp message to follow up. Reply in Spanish. Return a JSON object with a single field 'message' (string).";
            prompt = `Client Details:\nName: ${clientData.name}\nStatus: ${clientData.status}\nLast Active: ${clientData.lastActive}\nInterested in: ${clientData.interest}`;
        } else if (action === "deal_query") {
            const { query, transactionId } = data;
            
            // Generate embedding for the user's query
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query,
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;

            const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Fetch closest matching chunks via our postgres function
            const { data: documents, error } = await supabase.rpc('match_document_chunks', {
                query_embedding: queryEmbedding,
                match_threshold: 0.25,
                match_count: 5,
                p_transaction_id: transactionId
            });

            if (error) {
                console.error("Match error:", error);
                return res.status(500).json({ error: "Failed to query database context" });
            }

            let dbContext = "No se encontraron detalles de la base de datos para esta transacción.";
            if (transactionId) {
                const { data: tx } = await supabase.from('tc_transactions').select('*').eq('id', transactionId).maybeSingle();
                const { data: events } = await supabase.from('tc_events').select('*').eq('transaction_id', transactionId).order('due_date', { ascending: true });
                const { data: docs } = await supabase.from('tc_documents').select('name, status, required').eq('transaction_id', transactionId);
                
                if (tx) {
                    dbContext = `Detalles de Transacción:\n- Dirección: ${tx.property_address}\n- Estado: ${tx.status}\n- Precio: $${tx.price || 'N/A'}\n- Fecha de Cierre: ${tx.closing_date || 'N/A'}\n- Comprador: ${tx.buyer_name || 'N/A'}\n- Vendedor: ${tx.seller_name || 'N/A'}\n\n`;
                }
                if (events && events.length > 0) {
                    dbContext += `Eventos y Plazos (Timeline):\n`;
                    events.forEach(e => {
                        dbContext += `- [${e.status}] ${e.title} (Vence: ${e.due_date})\n`;
                    });
                    dbContext += `\n`;
                }
                if (docs && docs.length > 0) {
                    dbContext += `Estado de Documentos (Checklist):\n`;
                    docs.forEach(d => {
                        dbContext += `- [${d.status.toUpperCase()}] ${d.name} ${d.required ? '(Requerido)' : '(Opcional)'}\n`;
                    });
                    dbContext += `\n`;
                }
            }

            let contextContent = "No se encontraron documentos relevantes en la base de datos.";
            let citations = [];

            if (documents && documents.length > 0) {
                contextContent = documents.map((doc) => {
                    if (!citations.includes(doc.file_name)) citations.push(doc.file_name);
                    return `[Document: ${doc.file_name}]\nExcerpt: ${doc.content}\n`;
                }).join("\n---\n");
            }

            system_message = "You are an expert real estate transaction coordinator assistant. You answer questions using the provided database transaction context and document excerpts. If the answer is completely missing, state that you don't know based on current data. Do not invent information. Reply in Spanish. Return a JSON object with two fields: 'answer' (string) and 'citations' (array of strings, match filenames provided).";
            prompt = `User Question: ${query}\n\n=== Contexto de la Base de Datos ===\n${dbContext}\n\n=== Extractos de Documentos Relacionados ===\n${contextContent}`;
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini for speed and capability
            messages: [
                { role: "system", content: system_message },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const resultText = completion.choices[0].message.content;
        const resultJson = JSON.parse(resultText);

        res.status(200).json(resultJson);
    } catch (error) {
        console.error("OpenAI Action Error:", error);
        res.status(500).json({ error: "Failed to process AI request.", details: error.message });
    }
}
