import fs from 'fs';
import emails from './api/emails.js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
}
const RESEND_KEY = envVars['RESEND_API_KEY'];

const FROM = 'info@zhomesapp.com';
const TO = 'zhomesreapp@gmail.com';

const data = {
  clientName: 'Miguel Sosa',
  address: '1234 Maple Ave, Louisville, KY',
  oldStatus: 'Inspección',
  newStatus: 'Préstamo Aprobado (Clear to Close)',
};

const htmlContent = emails.client_status_update(data);

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RESEND_KEY}`,
  },
  body: JSON.stringify({
    from: `ZHomes TC <${FROM}>`,
    to: [TO],
    subject: `📢 [TEST] Actualización de Transacción: ${data.address}`,
    html: htmlContent,
  })
}).then(res => res.json()).then(r => console.log('Envío exitoso:', r)).catch(e => console.error('Error al enviar:', e));
