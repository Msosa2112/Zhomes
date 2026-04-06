const fs = require('fs');
const path = require('path');

const dir = 'c:\\TRABAJO\\ZHOMES\\app\\code\\zhomes-app\\n8n-workflows';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const p = path.join(dir, file);
    const content = fs.readFileSync(p, 'utf8');
    let data;
    try {
        data = JSON.parse(content);
    } catch(e) { return; }

    let changed = false;
    data.nodes = data.nodes.map(node => {
        if (node.type === 'n8n-nodes-base.resend' || node.name.includes("Email")) {
            // Unpack everything
            const from = node.parameters?.from || "ZHomes Real Estate <gilbert@gzhomes.com>";
            // For To, we need it inside an array since Resend API requires an array
            const toStr = node.parameters?.to || "";
            // Keep expressions verbatim
            const subject = node.parameters?.subject || "";
            const html = node.parameters?.html || "";

            // N8N Expression: If the value starts with =, we can dynamically construct JSON
            // But JSON body in n8n can just be an expression producing a stringified JSON
            // Actually, specifyBody: 'json', bodyParameters are easier!
            node = {
                ...node,
                type: 'n8n-nodes-base.httpRequest',
                typeVersion: 4.1,
                parameters: {
                    method: 'POST',
                    url: 'https://api.resend.com/emails',
                    authentication: 'genericCredentialType',
                    genericAuthType: 'httpHeaderAuth',
                    sendBody: true,
                    specifyBody: 'json',
                    jsonBody: `={
  "from": "${from.replace(/"/g, '\\"')}",
  "to": ["${toStr.replace(/^=/, '').replace(/"/g, '\\"').trim()}"],
  "subject": "${subject.replace(/^=/, '').replace(/"/g, '\\"')}",
  "html": "${html.replace(/^=/, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
}`,
                    options: {}
                }
            };
            changed = true;
        }
        return node;
    });

    if (changed) {
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        console.log('Updated ' + file);
    }
});
