const fs = require('fs');
let code = fs.readFileSync('api/emails.js', 'utf8');

const helper = `
function lucide(name, color = '#ffffff', size = 16) {
  const icons = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    party: '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.31 1.7-1.07 2.16L12 11"/><line x1="10" y1="14" x2="6" y2="10"/>',
    id_card: '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    car: '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m-6 0a2 2 0 1 1-4 0"/>',
    file_signature: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    bar_chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    bank: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'
  };
  const inner = icons[name] || icons.home;
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="\${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-right:6px;">\${inner}</svg>\`;
}
`;

code = code.replace(/const btnStyle = \(color='#c0392b'\) => `[\s\S]*?\n`\n/, match => match + '\n' + helper + '\n');

code = code.replace(/❤️ Guardó/g, "${lucide('heart', '#e74c3c')} Guardó");
code = code.replace(/👁️ Vio/g, "${lucide('eye', '#3498db')} Vio");
code = code.replace(/📋 Contactó/g, "${lucide('clipboard', '#f1c40f')} Contactó");
code = code.replace(/subject: `🏠 Nuevo Lead:/g, "subject: `Nuevo Lead:");
code = code.replace(/🚨 URGENTE — 1 DÍA/g, "${lucide('alert', '#e74c3c')} URGENTE — 1 DÍA");
code = code.replace(/⚠️ PRÓXIMO/g, "${lucide('alert', '#f39c12')} PRÓXIMO");
code = code.replace(/📋 RECORDATORIO/g, "${lucide('clipboard', '#3498db')} RECORDATORIO");
code = code.replace(/subject: `\$\{daysLeft === 1 \? '🚨 URGENTE' : '⚠️ Deadline'\}/g, "subject: `\${daysLeft === 1 ? 'URGENTE ' : 'Deadline '}");
code = code.replace(/subject: `🏠 Nueva Transacción Asignada/g, "subject: `Nueva Transacción Asignada");
code = code.replace(/Hola, \$\{realtorName\} 👋/g, "Hola, \${realtorName}");
code = code.replace(/subject: `\$\{daysLeft === 1 \? '🚨' : '⚠️'\} Deadline/g, "subject: `Deadline");
code = code.replace(/subject: `🏠 Bienvenido a ZHomes/g, "subject: `Bienvenido a ZHomes");
code = code.replace(/Hola, \$\{clientName\} 👋/g, "Hola, \${clientName}");
code = code.replace(/✅ Tu perfil fue creado/g, "${lucide('check', '#2ecc71')} Tu perfil fue creado");
code = code.replace(/🔍 Ya puedes explorar propiedades/g, "${lucide('search', '#3498db')} Ya puedes explorar propiedades");
code = code.replace(/💬 Contacta a tu agente/g, "${lucide('clipboard', '#f1c40f')} Contacta a tu agente");
code = code.replace(/📱 Descarga la app/g, "${lucide('smartphone', '#9b59b6')} Descarga la app");
code = code.replace(/subject: `🎉 ¡Tu cierre se acerca!/g, "subject: `¡Tu cierre se acerca!");
code = code.replace(/¡\$\{clientName\.split\(' '\)\[0\], casi es tuya! 🎉/g, "¡\${clientName.split(' ')[0]}, casi es tuya!");
code = code.replace(/📋 Asegúrate de tener listo:/g, "${lucide('clipboard', '#ffffff', 20)} Asegúrate de tener listo:");
code = code.replace(/💵 Fondos de cierre/g, "${lucide('bank', '#e74c3c')} Fondos de cierre");
code = code.replace(/🪪 Identificación oficial/g, "${lucide('id_card', '#3498db')} Identificación oficial");
code = code.replace(/📋 Cualquier documento/g, "${lucide('clipboard', '#f1c40f')} Cualquier documento");
code = code.replace(/🚗 Llegar puntual/g, "${lucide('car', '#2ecc71')} Llegar puntual");

code = code.replace(/contract_signed:\s*'📝 Contrato firmado',/, "contract_signed: lucide('file_signature', '#3498db') + ' Contrato firmado',");
code = code.replace(/inspection:\s*'🔍 En inspección',/, "inspection: lucide('search', '#f39c12') + ' En inspección',");
code = code.replace(/appraisal:\s*'📊 Tasación \\(Appraisal\\)',/, "appraisal: lucide('bar_chart', '#9b59b6') + ' Tasación (Appraisal)',");
code = code.replace(/financing:\s*'🏦 Aprobación de financiamiento',/, "financing: lucide('bank', '#2ecc71') + ' Aprobación de financiamiento',");
code = code.replace(/pre_close:\s*'✅ Pre-cierre — ¡casi listo!',/, "pre_close: lucide('check', '#3498db') + ' Pre-cierre — ¡casi listo!',");
code = code.replace(/closed:\s*'🎉 ¡CERRADO! — ¡Felicidades!',/, "closed: lucide('party', '#f1c40f') + ' ¡CERRADO! — ¡Felicidades!',");

code = code.replace(/📢 Actualización:/g, "Actualización:");
code = code.replace(/¡\$\{clientName\.split\(' '\)\[0\], lo lograste! 🎉/g, "¡\${clientName.split(' ')[0]}, lo lograste!");
code = code.replace(/proceso. 🏡/g, "proceso.");

fs.writeFileSync('api/emails.js', code);
console.log('Emojis cleaned up in api/emails.js');
