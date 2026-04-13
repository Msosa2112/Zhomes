const fs = require('fs');
let c = fs.readFileSync('api/emails.js', 'utf8');
// Fix '${lucide...' to `${lucide...` (replace single quotes wrapping interpolation with backticks)
c = c.replace(/'\$\{lucide\([^}]+}[^']*'/g, m => '`' + m.slice(1, -1) + '`');
fs.writeFileSync('api/emails.js', c);
