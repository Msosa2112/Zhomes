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
        if (node.name.includes("Email Realtor") && file.includes("Activated")) {
            node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.email}}"],
  "subject": "¡Tu cuenta Realtor ha sido activada!",
  "html": "Hola {{$json.body.record.full_name}},<br><br>Tu perfil ha sido verificado y activado. ¡Ya puedes comenzar a recibir leads y citas!"
}`;
            changed = true;
        }
        else if (node.name.includes("Email Pending Realtor") || node.name.includes("Email Realtor") && file.includes("Bookings")) {
            node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.agent_email || 'gilbert@gables-group.com'}}"],
  "subject": "Nueva Solicitud de Visita (Pendiente)",
  "html": "Tienes una solicitud del cliente {{$json.body.record.client_name}} para ver la casa con ID {{$json.body.record.property_id}} el {{$json.body.record.booking_date}} a las {{$json.body.record.time_slot}}.<br><br>Por favor confirma en la App."
}`;
            changed = true;
        }
        else if (node.name.includes("Email Confirmed Cliente")) {
            node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.client_email}}"],
  "subject": "¡Tu cita ha sido confirmada!",
  "html": "¡Excelente {{$json.body.record.client_name}}!<br><br>Tu cita para ver la propiedad el {{$json.body.record.booking_date}} a las {{$json.body.record.time_slot}} ha sido confirmada. El realtor te contactará pronto."
}`;
            changed = true;
        }
        else if (node.name.includes("Email Completed Cliente")) {
            node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.client_email}}"],
  "subject": "¿Te encantó la casa?",
  "html": "¡Hola {{$json.body.record.client_name}}!<br><br>Si fue de tu agrado, entra al app ZHomes y califícate en minutos para someter una Oferta Formal."
}`;
            changed = true;
        }
        else if (node.name.includes("Email") && file.includes("CRM_Leads")) {
            // CRM Leads node parsing
            if (node.name.includes("Preapproved")) {
                node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.email}}"],
  "subject": "¡Felicidades! Estás Pre-Aprobado",
  "html": "Hola {{$json.body.record.name}},<br><br>Has sido pre-aprobado. Ahora puedes proceder a realizar una Oferta Formal en la propiedad que deseas."
}`;
                changed = true;
            } else if (node.name.includes("Offer")) {
                node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.email}}"],
  "subject": "Tu oferta ha sido enviada",
  "html": "Hola {{$json.body.record.name}},<br><br>Tu oferta está en proceso. Te mantendremos informado."
}`;
                changed = true;
            } else if (node.name.includes("Closing")) {
                node.parameters.jsonBody = `={
  "from": "ZHomes Real Estate <info@zhomesapp.com>",
  "to": ["{{$json.body.record.email}}"],
  "subject": "¡Llegaste al momento de Cierre!",
  "html": "Hola {{$json.body.record.name}},<br><br>¡Felicidades, tu propiedad está en proceso de cierre!"
}`;
                changed = true;
            }
        }
        
        return node;
    });

    if (changed) {
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        console.log('Fixed emails in ' + file);
    }
});
