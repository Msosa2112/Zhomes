// Dynamic import below

process.env.RESEND_API_KEY = 're_5cyNGTxm_HAhWPzzbptwj6zXvHtYbt7b3';
process.env.CRON_SECRET = 'f653517a21965e70df5f14fcd300cd74b653209f2da95fd1daaafbeaf893ae4fc';

const req = {
  method: 'POST',
  headers: {
    authorization: 'Bearer ' + process.env.CRON_SECRET,
  },
  body: {
    type: 'client_status_update',
    to: 'zhomesreapp@gmail.com',
    data: {
      clientName: 'Miguel Sosa',
      address: '1234 Maple Ave, Louisville, KY',
      oldStatus: 'Bajo Contrato / Inspección',
      newStatus: 'Préstamo Aprobado (Clear to Close)',
    }
  }
};

const res = {
  setHeader: (k, v) => console.log('Header:', k, v),
  status: (code) => { 
    console.log('HTTP Status:', code); 
    return res; 
  },
  json: (data) => { 
    console.log('Response:', data); 
    return res; 
  }
};

const module = await import('./api/emails.js');
const handler = module.default;

handler(req, res).catch(e => console.error(e));
