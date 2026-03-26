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
        const apiKey = process.env.OPENAI_API_KEY || "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"; // Hardcoded temporarily for prototype
        
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
