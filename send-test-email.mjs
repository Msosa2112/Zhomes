import { buildEmailHtml } from './zhomes-app/api/_email-brand.js';

const html = buildEmailHtml({
  headerColor: '#0f172a',
  headerLabel: '✅ Correo de prueba — Nuevo branding ZHomes',
  ctaLabel: 'Ver mi Deal Room →',
  ctaUrl: 'https://zhomesapp.com/tc-room',
  bodyHtml: `
    <p style="color:#333;font-size:15px">Hola <strong>Miguel</strong>,</p>
    <p style="color:#333;font-size:15px">Este es un correo de prueba para verificar el nuevo branding de ZHomes.
    Deberías ver el logo oficial arriba y la firma completa de Gilbert Zaldivar al final.</p>
    <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:14px 18px;
                border-radius:6px;color:#1e40af;font-size:14px;line-height:1.6;margin:16px 0">
      Si ves el logo de ZHomes y la firma con los datos de contacto, el sistema está listo. ✅
    </div>
  `,
});

const resp = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer re_5cyNGTxm_HAhWPzzbptwj6zXvHtYbt7b3',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'ZHomes TC <info@zhomesapp.com>',
    to: ['zhomesreapp@gmail.com'],
    subject: '✅ Prueba de branding — ZHomes TC',
    html,
  }),
});

const result = await resp.json();
if (resp.ok) {
  console.log('✅ Email enviado correctamente. ID:', result.id);
} else {
  console.error('❌ Error al enviar:', JSON.stringify(result, null, 2));
}
