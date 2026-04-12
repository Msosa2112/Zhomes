import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const N8N_URL = 'https://n8n-production-cfe9c.up.railway.app/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmM5NTViNy1mY2I1LTRjMmEtODVjZC01MjdjNGJhYTdhOWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDc0MzJlM2YtYThmZC00YmY1LWJmN2UtZGI2ODY0MDgwMDk4IiwiaWF0IjoxNzc1NDg0Njc4fQ.1CEXxQZB8wuFtpqI-GIy0BlrHgory1pZJM4ZJKQ1acg';
const WORKFLOWS_DIR = 'C:\\TRABAJO\\ZHOMES\\app\\code\\zhomes-app\\n8n-workflows';

async function fixCredentials() {
    console.log('Fetching credentials from n8n...');
    const credRes = await fetch(`${N8N_URL}/credentials`, {
        headers: { 'X-N8N-API-KEY': API_KEY }
    });

    const { data: credentials } = await credRes.json();
    const httpAuthCred = credentials.find(c => c.type === 'httpHeaderAuth' || c.name.toLowerCase().includes('resend'));

    if (!httpAuthCred) {
        console.error('No httpHeaderAuth or Resend credential found in n8n!');
        console.log('Available Configured Credentials:');
        credentials.forEach(c => console.log(`- ${c.name} (${c.type})`));
        return;
    }

    console.log(`Using Credential -> Name: ${httpAuthCred.name}, ID: ${httpAuthCred.id}`);

    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));

    let changedCount = 0;
    for (const file of files) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        let changed = false;
        data.nodes = data.nodes.map(node => {
            if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.url?.includes('resend.com')) {
                node.credentials = {
                    "httpHeaderAuth": {
                        "id": httpAuthCred.id,
                        "name": httpAuthCred.name
                    }
                };
                changed = true;
            }
            return node;
        });

        if (changed) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Injected credential into ${file}`);
            changedCount++;
        }
    }
    
    console.log(`\nFinished injecting credentials into ${changedCount} files.`);
}

fixCredentials().catch(console.error);
