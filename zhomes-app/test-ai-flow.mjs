import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import handler from './api/process-document.js';

// Load env vars
const envLocal = fs.readFileSync('.env.local', 'utf-8');
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('\n=========================================');
  console.log('🤖 INICIANDO TEST DE AUTO-ANÁLISIS AI');
  console.log('=========================================\n');

  // 1. Create a mock transaction
  console.log('1️⃣ Creando Transacción de prueba en BD...');
  const { data: tx, error: txError } = await supabase.from('tc_transactions').insert({
    realtor_id: '6eea2729-5a03-4a40-baed-5fe74f453604', // Test Agent
    address: '101 AI Test Blvd, Future City',
    client_name: 'AI Tester',
    client_email: 'test@zhomesapp.com', // Safe email
    status: 'under_contract',
    transaction_type: 'purchase'
  }).select().single();
  if (txError) throw txError;
  console.log(`✅ Transacción creada. ID: ${tx.id}`);

  // 2. Create a mock document record
  console.log('2️⃣ Creando Documento en el checklist (Esperando un contrato de compra)...');
  const { data: doc, error: docError } = await supabase.from('tc_documents').insert({
    transaction_id: tx.id,
    name: 'Contrato de Compra (Draft)',
    category: 'legal',
    required: true,
    status: 'pending',
    ai_guidelines: 'Debe contener la firma del comprador y detalles de la propiedad.'
  }).select().single();
  if (docError) throw docError;
  console.log(`✅ Documento creado. ID: ${doc.id}`);

  // 3. Upload a sample PDF
  console.log('3️⃣ Subiendo PDF de muestra simulado (que en realidad no es un contrato)...');
  const pdfRes = await fetch('https://pdfobject.com/pdf/sample.pdf');
  const pdfBuffer = await pdfRes.arrayBuffer();
  const filePath = `${tx.id}/${doc.id}/sample_contract.pdf`;
  
  const { error: storageError } = await supabase.storage.from('tc_documents').upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (storageError) throw storageError;
  console.log('✅ Archivo subido exitosamente a Supabase Storage.');

  // 4. Call the Vercel handler
  console.log('\n4️⃣ Ejecutando el flujo de AI Analysis directo en código...');
  
  const req = {
    method: 'POST',
    headers: { authorization: 'Bearer fake.jwt.token' },
    body: {
      filePath,
      fileName: 'sample_contract.pdf',
      transactionId: tx.id,
      documentId: doc.id
    }
  };

  let responseBody = {};
  let statusCode = 200;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseBody = data;
      return res;
    },
    end: () => res
  };

  await handler(req, res);

  console.log(`\n🔹 Resultado del Análisis AI (Status ${statusCode}):`);
  console.log(responseBody);

  // 5. Check the chat messages
  console.log('\n5️⃣ Verificando si "ZHomes AI" habló en el chat...');
  const { data: messages } = await supabase.from('tc_messages')
    .select('*')
    .eq('transaction_id', tx.id)
    .order('created_at', { ascending: true });
  
  console.log(`   Mensajes inyectados: ${messages.length}`);
  messages.forEach(m => console.log(`   > [${m.sender_name}]: ${m.content}`));

  console.log('\n=========================================');
  console.log('🎉 TEST MOCK COMPLETADO 🎉');
  console.log('=========================================\n');
}

run().catch(console.error);
