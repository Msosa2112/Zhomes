/**
 * api/_email-brand.js
 * Módulo compartido de branding de email para toda la plataforma ZHomes.
 * Importar en cualquier función API que envíe correos.
 *
 * El guión bajo al inicio (_) indica que este archivo NO es un endpoint de Vercel.
 */

// ──────────────────────────────────────────────────────────────────────
// URL pública del logo (archivo en /public → servido por Vercel)
// ──────────────────────────────────────────────────────────────────────
const LOGO_URL = 'https://zhomesapp.com/assets/logo/LOGO%20HRZNTL%201.png';

// ──────────────────────────────────────────────────────────────────────
// Bloque logo: imagen real sobre fondo oscuro
// ──────────────────────────────────────────────────────────────────────
export function zhomesLogo() {
  return `
    <div style="text-align:center; margin-bottom:8px;">
      <img src="${LOGO_URL}" alt="ZHomes Real Estate"
           style="height:56px; display:inline-block; vertical-align:middle;" />
    </div>
    <div style="color:#e2b96a; font-size:12px; font-weight:600;
                letter-spacing:1px; text-transform:uppercase;
                text-align:center; margin-top:4px;">
      Transaction Coordinator
    </div>`;
}

// ──────────────────────────────────────────────────────────────────────
// Footer completo: firma de Gilbert + disclaimer legal
// ──────────────────────────────────────────────────────────────────────
export function zhomesFooter() {
  return `
  <div style="background:#0a0a0a; padding:28px 32px;
              border-top:1px solid #222; font-family:Arial,sans-serif;">

    <!-- Firma Gilbert -->
    <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:20px;">
      <tr>
        <td style="vertical-align:top; padding-right:20px;">
          <strong style="color:#ddd; font-size:13px;">Gilbert Zaldivar | Principal Broker</strong><br/>
          <span style="color:#888; font-size:12px;">Kentucky, Indiana &amp; Florida</span>

          <div style="margin-top:14px;">
            <img src="${LOGO_URL}" alt="ZHomes" style="height:44px; display:block;" />
          </div>

          <div style="margin-top:14px; color:#aaa; font-size:11px; line-height:1.9;">
            Direct-(502) 641-6623<br/>
            Office-(606) 909-5990<br/>
            Fax-(606) 649-0006<br/>
            <a href="mailto:gilbert@zhomesre.com"
               style="color:#3498db; text-decoration:none;">gilbert@zhomesre.com</a><br/>
            <a href="https://www.zhomesre.com"
               style="color:#3498db; text-decoration:none;">www.zhomesre.com</a><br/>
            7520 Preston Hwy<br/>
            Louisville, KY 40219
          </div>
        </td>
      </tr>
    </table>

    <!-- Disclaimer -->
    <div style="font-size:9px; line-height:1.55; color:#5a7b97;
                text-align:justify; border-top:1px solid #1a1a1a; padding-top:14px;">
      <strong style="color:#c0392b;">Disclaimer:</strong>
      Periodically, our buyers, sellers, potential buyers, potential sellers, customers,
      and-or potential customers ask us for names and contact information about lenders,
      handymen, home inspectors, appraisers and such. It is strongly suggested that the
      recipient of such information use the information in conjunction with their own
      research about the suggested contact instead of relying solely upon us. The names
      provided have done a satisfactory job for us in the past, but by no means it's a
      blanket endorsement of the person/company. It is also important for the reader to
      know that we, ZHomes Real Estate or the sender of this e-mail, are not a mortgage
      lender; therefore, you should contact a lender to understand mortgage products and
      your eligibility for such products.
    </div>

    <p style="color:#444; font-size:11px; margin:18px 0 0; text-align:center;">
      © ${new Date().getFullYear()} ZHomes Real Estate. Todos los derechos reservados.
    </p>
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────
// buildEmailHtml: wrapper completo para emails del sistema TC
// ──────────────────────────────────────────────────────────────────────
export function buildEmailHtml({
  headerColor   = '#0f172a',
  headerLabel   = '',
  bodyHtml      = '',
  ctaUrl        = 'https://zhomesapp.com/tc-room',
  ctaLabel      = 'Ver en ZHomes Deal Room →',
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;
             font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;border-radius:12px;
                    overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">

        <!-- ── HEADER: logo + etiqueta ── -->
        <tr>
          <td style="background:${headerColor};padding:28px 32px;">
            ${zhomesLogo()}
            ${headerLabel
              ? `<p style="color:#e2e8f0;font-size:15px;margin:18px 0 0;
                          font-weight:600;text-align:center;">${headerLabel}</p>`
              : ''}
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="background:#ffffff;padding:32px;color:#1e293b;">
            ${bodyHtml}
            <br/>
            <a href="${ctaUrl}"
               style="display:inline-block;background:${headerColor};
                      color:#ffffff;padding:13px 28px;border-radius:8px;
                      text-decoration:none;font-weight:700;font-size:14px;
                      margin-top:8px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>

        <!-- ── FOOTER: firma Gilbert + disclaimer ── -->
        <tr>
          <td>${zhomesFooter()}</td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
