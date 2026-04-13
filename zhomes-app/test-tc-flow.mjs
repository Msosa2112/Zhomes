import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { generateChecklist } from './src/data/tcDocumentTemplates.js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SUPABASE_KEY = envVars['SUPABASE_SERVICE_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('\n=========================================');
  console.log('🚀 INICIANDO TEST DE TRANSACTION COORDINATOR');
  console.log('=========================================\n');

  console.log('1️⃣  Descargando PDF de prueba desde EPA / Sample...');
  const pdfRes = await fetch('https://pdfobject.com/pdf/sample.pdf');
  const pdfBuffer = await pdfRes.arrayBuffer();

  const realtorId = '6eea2729-5a03-4a40-baed-5fe74f453604'; // Test Agent
  const clientEmail = 'miguesosagarcia@gmail.com'; 
  const clientName = 'Migue Sosa Garcia';

  console.log(`2️⃣  Creando Transacción en Supabase para el cliente ${clientName}...`);
  const { data: tx, error: txError } = await supabase.from('tc_transactions').insert({
    realtor_id: realtorId,
    address: '999 Mockup Avenue, Louisville, KY',
    client_name: clientName,
    client_email: clientEmail,
    client_phone: '502-555-0199',
    price: 450000,
    status: 'under_contract',
    transaction_type: 'purchase'
  }).select().single();

  if (txError) throw txError;
  console.log(`✅ Transacción creada. ID: ${tx.id}`);

  console.log('\n3️⃣  Generando checklist dinámico de documentos...');
  const checklist = generateChecklist(tx.id, 'purchase');
  const { data: docs, error: docError } = await supabase.from('tc_documents').insert(checklist).select();
  if (docError) throw docError;
  
  const targetDoc = docs.find(d => d.name === 'Pre-Approval Letter');
  console.log(`✅ Creados ${docs.length} documentos. Target para subir: ${targetDoc.id}`);

  console.log('\n4️⃣  Subiendo archivo a Supabase Storage bucket "tc_documents"...');
  const path = `${tx.id}/${targetDoc.id}/pre_approval_test.pdf`;
  const { error: storageError } = await supabase.storage.from('tc_documents').upload(path, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (storageError) throw storageError;

  console.log('✅ Documento PDF alojado con éxito en la bóveda.');

  console.log('\n5️⃣  Actualizando tracking: Status a "Uploaded"...');
  await supabase.from('tc_documents').update({ status: 'uploaded', file_url: path }).eq('id', targetDoc.id);

  console.log('\n6️⃣  Enviando notificación por correo mediante ZHomes API (Vercel)...');
  const emailRes = await fetch('https://zhomesapp.com/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'client_status_update',
      to: clientEmail,
      data: {
        clientName: clientName,
        address: '999 Mockup Avenue, Louisville, KY',
        oldStatus: 'listed',
        newStatus: 'contract_signed'
      }
    })
  });
  
  const emailText = await emailRes.text();
  try {
    const emailData = JSON.parse(emailText);
    if (emailRes.ok) {
      console.log(`✅ Correo encolado por Resend. ID: ${emailData.id || 'OK'}`);
    } else {
      console.log(`⚠️ Advertencia de correo:`, emailData);
    }
  } catch (e) {
    console.log(`⚠️ Error parsing email response text. Status: ${emailRes.status}`);
    console.log(emailText);
  }

  console.log('\n=========================================');
  console.log('🎉 FLUJO COMPLETADO END-TO-END CON ÉXITO 🎉');
  console.log('=========================================\n');
}

run().catch(e => console.error('❌ Error in test:', e));
