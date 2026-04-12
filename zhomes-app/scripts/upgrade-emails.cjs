const fs = require('fs');
const path = require('path');

const ZHOMES_TEMPLATE = (content) => `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    
    <!-- HEADER -->
    <div style="background-color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://zhomesapp.com/assets/logo/LOGO%20HRZNTL%201.png" alt="ZHomes Real Estate" style="max-height: 60px;">
    </div>

    <!-- BODY CONTENT -->
    <div style="padding: 30px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
        ${content}
    </div>

    <!-- FOOTER SIGNATURE -->
    <div style="padding: 20px 30px; background-color: #fff; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; font-size: 11px; color: #555;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px; color: #000;">
            Gilbert Zaldivar | Principal Broker<br>
            Kentucky, Indiana & Florida
        </p>
        <p style="margin: 0 0 10px 0;">
            Direct-(502)641-6623<br>
            Office-(502)909-5990<br>
            Fax-(606)649-0006<br>
            <a href="mailto:gilbert@zhomesre.com" style="color: #0066cc;">gilbert@zhomesre.com</a><br>
            <a href="http://www.zhomesre.com" style="color: #0066cc;">www.zhomesre.com</a><br>
            7520 Preston Hwy<br>
            Louisville, KY 40219
        </p>
        <p style="margin: 0; color: #888; text-align: justify; font-size: 10px;">
            <strong style="color: #cc0000;">Disclaimer:</strong> Periodically, our buyers, sellers, potential buyers, potential sellers, customers, and-or potential customers ask us for names and contact information about lenders, handymen, home inspectors, appraisers and such. It is strongly suggested that the recipient of such information use the information in conjunction with their own research about the suggested contact instead of relying solely upon us. The names provided have done a satisfactory job for us in the past, but by no means it's a blanket endorsement of the person/company. It is also important for the reader to know that we, ZHomes Real Estate or the sender of this e-mail, are not a mortgage lender; therefore, you should contact a lender to understand mortgage products and your eligibility for such products.
        </p>
    </div>
</div>
`;

// Map of custom HTML per node name
const HTML_OVERRIDES = {
    // 05_ZHomes_Realtor_Approval.json & 00_ZHomes_Master_Workflow.json
    "Email Broker Admin": `
        <h2 style="color: #111;">Nueva solicitud de Realtor</h2>
        <p>Hola Admin,</p>
        <p>El/La agente <strong>{{$json.body.record.full_name}}</strong> ({{$json.body.record.email}}) ha solicitado registrarse en la plataforma y espera aprobación.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zhomesre.com/admin" style="background-color: #2b70d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver y Aprobar Perfil</a>
        </div>
    `,

    // 06_ZHomes_Realtor_Activated.json
    "Email Realtor": `
        <h2 style="color: #111;">¡Cuenta Activada!</h2>
        <p>Hola <strong>{{$json.body.record.full_name}}</strong>,</p>
        <p>Felicidades, tu perfil ha sido verificado y aprobado. Ya eres parte oficial de la red de ZHomes.</p>
        <p>Ahora puedes comenzar a recibir clientes, pre-aprobaciones y notificaciones de sesiones directamente en tu aplicación.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zhomesapp.com/realtors" style="background-color: #2b70d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acceder a tu Dashboard</a>
        </div>
    `,

    // 02_ZHomes_Bookings_Journey.json
    "Email Pending Realtor": `
        <h2 style="color: #111;">Nueva Solicitud de Sesión</h2>
        <p>Hola Realtor,</p>
        <p>Tienes una nueva solicitud para una sesión inmobiliaria el <strong>{{$json.body.record.booking_date}}</strong> a las <strong>{{$json.body.record.time_slot}}</strong>.</p>
        <p>Propiedad ID: {{$json.body.record.property_id}}</p>
        <p>Por favor, ingresa a la aplicación para confirmar o ajustar la sesión lo antes posible.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zhomesapp.com/realtors" style="background-color: #2b70d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirmar Sesión</a>
        </div>
    `,

    // 02_ZHomes_Bookings_Journey.json
    "Email Confirmed Cliente": `
        <h2 style="color: #111;">Sesión Inmobiliaria Confirmada</h2>
        <p>¡Excelente!</p>
        <p>Tu solicitud de sesión para conocer la propiedad el <strong>{{$json.body.record.booking_date}}</strong> a las <strong>{{$json.body.record.time_slot}}</strong> ha sido procesada.</p>
        <p>El realtor designado te contactará muy pronto para afinar detalles.</p>
    `,

    // 02_ZHomes_Bookings_Journey.json
    "Email Completed Cliente": `
        <h2 style="color: #111;">¿Te encantó la propiedad?</h2>
        <p>¡Hola!</p>
        <p>Esperamos que tu reciente sesión haya sido excelente.</p>
        <p>Si la propiedad fue de tu agrado, recuerda que puedes ingresar a la app de ZHomes para calificar y someter una Oferta Formal en minutos.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zhomesapp.com" style="background-color: #2b70d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Someter Oferta</a>
        </div>
    `,

    // 03_ZHomes_CRM_Leads_Journey.json
    "Email Preapproved Cliente": `
        <h2 style="color: #111;">¡Paso Completado: Pre-Aprobado!</h2>
        <p>Hola,</p>
        <p>Queremos felicitarte porque has sido pre-aprobado exitosamente en nuestro sistema bancario/crediticio.</p>
        <p>El siguiente paso es avanzar con una Oferta Formal sobre la propiedad que deseas adquirir. Tu Realtor está a tu disposición para guiarte en este importante paso.</p>
    `,

    // 03_ZHomes_CRM_Leads_Journey.json
    "Email Offer Cliente": `
        <h2 style="color: #111;">Tu oferta está en revisión</h2>
        <p>Hola,</p>
        <p>Confirmamos que tu oferta formal ha sido registrada y enviada con éxito.</p>
        <p>Estudiaremos todos los documentos y te mantendremos informado sobre la evolución y posibles contraofertas.</p>
    `,

    // 03_ZHomes_CRM_Leads_Journey.json
    "Email Closing Cliente": `
        <h2 style="color: #111;">¡Felicidades, llegaste al Cierre!</h2>
        <p>Hola,</p>
        <p>Es un enorme placer informarte que tu trámite ha avanzado a la etapa Final de Cierre.</p>
        <p>Agradecemos tu confianza en ZHomes Real Estate. Si tienes alguna duda sobre la firma final, contacta a tu Realtor inmediatamente.</p>
    `
};

const dir = path.join(__dirname, '..', 'n8n-workflows');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let changedFiles = 0;

files.forEach(file => {
    const p = path.join(dir, file);
    const content = fs.readFileSync(p, 'utf8');
    let data;
    try { data = JSON.parse(content); } catch(e) { return; }

    let changed = false;

    data.nodes = data.nodes.map(node => {
        if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.jsonBody) {
            try {
                // Remove the start "=" and parse the json string inside n8n
                // Because n8n uses dynamic expressions, the string usually looks like:
                // ={\n  "from": "...",\n "html": "..." }
                // Let's replace the properties manually using regex to preserve expressions
                
                let rawBody = node.parameters.jsonBody;

                const name = node.name;
                
                if (HTML_OVERRIDES[name]) {
                    // Inject the template wrapped around our custom override content
                    const cleanHtml = ZHOMES_TEMPLATE(HTML_OVERRIDES[name]).replace(/"/g, '\\"').replace(/\n/g, '');
                    
                    // Regex replace the "html": "..." part of the string
                    rawBody = rawBody.replace(/"html":\s*".*?"/g, `"html": "${cleanHtml}"`);
                    
                    node.parameters.jsonBody = rawBody;
                    changed = true;
                    console.log(`Updated HTML template for node: ${name}`);
                }
            } catch (err) {
                console.error(`Error processing ${node.name}:`, err.message);
            }
        }
        return node;
    });

    if (changed) {
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        changedFiles++;
    }
});

console.log(`\nRe-styled ${changedFiles} workflow files.`);
