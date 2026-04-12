const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..', 'n8n-workflows');

const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.json'));

let modifiedFiles = 0;

for (const file of files) {
  const filePath = path.join(directoryPath, file);
  const data = fs.readFileSync(filePath, 'utf8');
  const workflow = JSON.parse(data);
  let modified = false;

  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    for (const node of workflow.nodes) {
      if (node.type && node.type.toLowerCase().includes('twilio')) {
        node.disabled = true;
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');
    modifiedFiles++;
    console.log(`Disabled Twilio node(s) in: ${file}`);
  }
}

console.log(`\nFinished checking ${files.length} workflows. Modified ${modifiedFiles} file(s).`);
