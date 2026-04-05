import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import OpenAI from "openai";

const aiMiddleware = () => ({
  name: 'ai-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/zhomes-ai' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsedBody = JSON.parse(body);
            const { action, data } = parsedBody;
            
            const openAIKey = process.env.OPENAI_API_KEY;
            if (!openAIKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set in environment. Add it to your .env file.' }));
              return;
            }
            const openai = new OpenAI({ apiKey: openAIKey });

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
            }

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: system_message },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(completion.choices[0].message.content);
          } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno (incluso las que no empiezan con VITE_)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), aiMiddleware()],
    server: {
      allowedHosts: true,
      proxy: {
        // Simular la Serverless Function de Vercel localmente
        '/api/spark': {
          target: 'https://replication.sparkapi.com',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Extraer el endpoint de los query params
              const reqUrl = new URL(req.url, 'http://localhost');
              const endpoint = reqUrl.searchParams.get('endpoint');
              reqUrl.searchParams.delete('endpoint');
              
              // Reescribir la ruta para RESO Web API v3
              const searchString = reqUrl.searchParams.toString();
              proxyReq.path = `/Version/3/Reso/OData/${endpoint}${searchString ? '?' + searchString : ''}`;
              
              // Inyectar Headers de Autenticación
              // Key from Greater Louisville AOR - IDX Feed subscription
              const sparkKey = env.VITE_SPARK_API_KEY;
              if (!sparkKey) {
                console.error('[SPARK PROXY] VITE_SPARK_API_KEY not set in .env');
              }
              console.log('[SPARK PROXY] Path:', proxyReq.path);
              proxyReq.setHeader('Authorization', `Bearer ${sparkKey}`);
              proxyReq.setHeader('X-SparkApi-User-Agent', 'ZhomesApp/1.0');
            });
          }
        },
        '/api/walkscore': {
          target: 'https://api.walkscore.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/walkscore/, '/score')
        }
      }
    },
  }
})
