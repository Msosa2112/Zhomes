const fs = require('fs');
const path = require('path');

const dir = 'c:\\TRABAJO\\ZHOMES\\app\\code\\zhomes-app\\n8n-workflows';
const files = [
    '01_ZHomes_Realtor_Match.json',
    '02_ZHomes_Bookings_Journey.json',
    '03_ZHomes_CRM_Leads_Journey.json',
    '04_ZHomes_Documents_Journey.json',
    '05_ZHomes_Realtor_Approval.json'
];

let masterNodes = [];
let masterConnections = {};

let currentYOffset = 0;

files.forEach((file, index) => {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) return;

    try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        
        let localMinY = 99999;
        let localMaxY = -99999;

        // Shift coordinates
        data.nodes.forEach(node => {
            if (node.position) {
                if (node.position[1] < localMinY) localMinY = node.position[1];
                if (node.position[1] > localMaxY) localMaxY = node.position[1];
            }
        });

        const yShift = currentYOffset - localMinY;

        data.nodes.forEach(node => {
            if (node.position) {
                node.position[1] += yShift;
            }
            // To ensure unique names across workflows just in case
            // Actually, we gave distinct names to triggers. 
            // e.g. "Webhook Bookings", "Zhomes Webhook".
            masterNodes.push(node);
        });

        // Add connections
        Object.keys(data.connections).forEach(nodeName => {
            masterConnections[nodeName] = data.connections[nodeName];
        });

        currentYOffset += (localMaxY - localMinY) + 600; // 600px padding below this workflow
    } catch (e) {
        console.error("Error reading", file, e);
    }
});

const masterWorkflow = {
  "name": "ZHomes - Master Workflow",
  "nodes": masterNodes,
  "connections": masterConnections
};

fs.writeFileSync(path.join(dir, '00_ZHomes_Master_Workflow.json'), JSON.stringify(masterWorkflow, null, 2));
console.log("Master workflow created!");
