import fs from 'fs';
import path from 'path';

const N8N_URL = 'https://n8n-production-cfe9c.up.railway.app/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmM5NTViNy1mY2I1LTRjMmEtODVjZC01MjdjNGJhYTdhOWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDc0MzJlM2YtYThmZC00YmY1LWJmN2UtZGI2ODY0MDgwMDk4IiwiaWF0IjoxNzc1NDg0Njc4fQ.1CEXxQZB8wuFtpqI-GIy0BlrHgory1pZJM4ZJKQ1acg';
const WORKFLOWS_DIR = 'C:\\TRABAJO\\ZHOMES\\app\\code\\zhomes-app\\n8n-workflows';

async function deployClean() {
    console.log('Fetching all existing workflows from n8n...');
    const listRes = await fetch(`${N8N_URL}/workflows`, {
        headers: { 'X-N8N-API-KEY': API_KEY }
    });

    const { data: existingWorkflows } = await listRes.json();
    
    // 1. DELETE ALL WORKFLOWS
    console.log(`Found ${existingWorkflows.length} existing workflows. Deactivating and deleting them all...`);
    for (const w of existingWorkflows) {

        const delRes = await fetch(`${N8N_URL}/workflows/${w.id}`, {
            method: 'DELETE',
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        if (delRes.ok) console.log(`Deleted: ${w.name}`);
        else console.error(`Failed to delete: ${w.name}`);
    }

    // 2. IMPORT ONLY THE MODULAR WORKFLOWS (SKIP MASTER TO AVOID URL CONFLICTS)
    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json') && !f.includes('Master'));
    
    for (const file of files) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const workflowName = fileContent.name;

        const payload = {
            name: workflowName,
            nodes: fileContent.nodes,
            connections: fileContent.connections,
            settings: fileContent.settings || {}
        };

        console.log(`\nCreating new workflow: ${workflowName}`);
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
            const created = await createRes.json();
            console.log(`✓ Created successfully. Activating (ID: ${created.id})...`);
            
            // Activate it via POST /activate endpoint
            const actRes = await fetch(`${N8N_URL}/workflows/${created.id}/activate`, {
                method: 'POST',
                headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' }
            });
            
            if (actRes.ok) {
                console.log(`✓ Activated!`);
            } else {
                console.log('Failed to activate.', await actRes.text());
            }
        }
    }
}

deployClean().catch(console.error);
