import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, data } = await req.json()
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY. Set it in the Supabase Dashboard -> Edge Functions -> Secrets.")
    }

    let prompt = "";
    let system_message = "";

    if (action === "broker_compliance") {
        const { documentText, rules } = data;
        system_message = "You are an expert real estate compliance assistant. You will evaluate the provided document text against the provided rules. Reply in Spanish. Return a JSON object with two fields: 'allPassed' (boolean) and 'report' (string). If all passed, 'report' should be a confirmation message. If failed, list the specific rules broken and instructions on what to fix.";
        prompt = `Document Text:\n${documentText}\n\nRules to check:\n${rules.map((r: any) => "- " + r.text).join("\n")}`;
    } else if (action === "legal_translator") {
        const { documentText } = data;
        system_message = "You are an expert real estate lawyer. Summarize the key obligations, risks, or highlights from the provided document text in 3 to 5 easy-to-understand bullet points for a regular home buyer. Reply in Spanish. Return a JSON object with a single field 'summary' (array of strings).";
        prompt = `Document Text:\n${documentText}`;
    } else if (action === "vibe_creator") {
        system_message = "You are an expert real estate copywriter. The user wants you to create a catchy MLS description and a TikTok video script for a property. Reply in Spanish. Return a JSON object with 'mlsDescription' (string) and 'tiktokScript' (string).";
        prompt = `Generate the content for the property. Focus on modern aesthetics, luxury, and engaging narrative. Make the TikTok script energetic and structured with hook, body, and call to action.`;
    } else if (action === "smart_followup") {
        const { clientName, propertyAddress, views } = data;
        system_message = "You are a top-performing real estate agent's assistant. Draft a short, natural, friendly follow-up message (SMS/WhatsApp style) in Spanish for a client who has shown high interest in a property. Do not be overly pushy, just helpful and inviting. Return a JSON object with 'message' (string).";
        prompt = `Client: ${clientName}, Property: ${propertyAddress}, Times viewed today: ${views}.`;
    } else {
        throw new Error(`Unknown action: ${action}`);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: system_message },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        })
    });

    const openaiData = await openaiResponse.json();
    if (openaiData.error) {
        throw new Error(openaiData.error.message);
    }
    
    // Parse the JSON string from OpenAI
    const resultText = openaiData.choices[0].message.content;
    const resultObj = JSON.parse(resultText);

    return new Response(JSON.stringify(resultObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
