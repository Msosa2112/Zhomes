import fs from 'fs';
import path from 'path';

const N8N_URL = 'https://n8n-production-cfe9c.up.railway.app/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmM5NTViNy1mY2I1LTRjMmEtODVjZC01MjdjNGJhYTdhOWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDc0MzJlM2YtYThmZC00YmY1LWJmN2UtZGI2ODY0MDgwMDk4IiwiaWF0IjoxNzc1NDg0Njc4fQ.1CEXxQZB8wuFtpqI-GIy0BlrHgory1pZJM4ZJKQ1acg';
const WORKFLOWS_DIR = 'C:\\TRABAJO\\ZHOMES\\app\\code\\zhomes-app\\n8n-workflows';

async function deployWorkflows() {
    console.log('Fetching existing workflows from n8n...');
    const listRes = await fetch(`${N8N_URL}/workflows`, {
        headers: { 'X-N8N-API-KEY': API_KEY }
    });

    if (!listRes.ok) {
        console.error('Error fetching workflows:', await listRes.text());
        return;
    }

    const { data: existingWorkflows } = await listRes.json();
    console.log(`Found ${existingWorkflows.length} workflows in n8n.`);

    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const workflowName = fileContent.name;

        // Find existing workflow by name
        let existing = existingWorkflows.find(w => w.name === workflowName);

        // N8n needs the nodes & connections sent explicitly
        const payload = {
            name: workflowName,
            nodes: fileContent.nodes,
            connections: fileContent.connections,
            settings: fileContent.settings || {}
        };

        if (existing) {
            console.log(`Updating existing workflow: ${workflowName} (ID: ${existing.id})`);
            const updateRes = await fetch(`${N8N_URL}/workflows/${existing.id}`, {
                method: 'PUT',
                headers: { 
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!updateRes.ok) {
                console.error(`Failed to update ${workflowName}:`, await updateRes.text());
            } else {
                console.log(`✓ Updated successfully`);
            }
        } else {
            console.log(`Creating new workflow: ${workflowName}`);
            const createRes = await fetch(`${N8N_URL}/workflows`, {
                method: 'POST',
                headers: { 
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!createRes.ok) {
                console.error(`Failed to create ${workflowName}:`, await createRes.text());
            } else {
                console.log(`✓ Created successfully`);
            }
        }
    }
}

deployWorkflows().catch(console.error);
