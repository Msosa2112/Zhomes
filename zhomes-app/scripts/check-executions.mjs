import fetch from 'node-fetch';

const N8N_URL = 'https://n8n-production-cfe9c.up.railway.app/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmM5NTViNy1mY2I1LTRjMmEtODVjZC01MjdjNGJhYTdhOWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDc0MzJlM2YtYThmZC00YmY1LWJmN2UtZGI2ODY0MDgwMDk4IiwiaWF0IjoxNzc1NDg0Njc4fQ.1CEXxQZB8wuFtpqI-GIy0BlrHgory1pZJM4ZJKQ1acg';

async function checkExecutions() {
    console.log('Fetching recent executions from n8n...');
    const res = await fetch(`${N8N_URL}/executions?limit=5`, {
        headers: {
            'X-N8N-API-KEY': API_KEY,
            'accept': 'application/json'
        }
    });

    if (!res.ok) {
        console.error('Error fetching executions:', await res.text());
        return;
    }

    const { data } = await res.json();
    console.log(`Found ${data.length} recent executions:\n`);

    for (const exec of data) {
        console.log(`[ID: ${exec.id}] Workflow: ${exec.workflowId} | Status: ${exec.status} | Mode: ${exec.mode}`);
        
        if (exec.status === 'error' || exec.status === 'crashed') {
            // Fetch execution details
            const detailRes = await fetch(`${N8N_URL}/executions/${exec.id}?includeData=true`, {
                headers: { 'X-N8N-API-KEY': API_KEY, 'accept': 'application/json' }
            });
            const detail = await detailRes.json();
            console.log('ERROR DETAILS:');
            const runData = detail.data?.resultData?.runData;
            if (runData) {
                for (const [nodeName, runs] of Object.entries(runData)) {
                    for (const run of runs) {
                        if (run.error) {
                            console.log(`Node FAILED: ${nodeName}`);
                            console.log(`Error Message: ${run.error.message}`);
                            console.log(`Error Status: ${run.error.httpCode}`);
                            console.log(`Full Error: ${JSON.stringify(run.error, null, 2)}`);
                        }
                    }
                }
            } else {
                console.log(JSON.stringify(detail, null, 2));
            }
        }
    }
}

checkExecutions().catch(console.error);
