import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function run() {
  const email = 'miguesosagarcia@gmail.com'
  
  // Create deal
  const { data: deal, error } = await supabase.from('tc_transactions').insert({
    address: '123 Fake Street, Miami FL',
    city: 'Miami',
    price: 450000,
    status: 'contract_signed',
    transaction_type: 'purchase',
    client_name: 'Miguel Sosa',
    client_email: email,
    closing_date: new Date(Date.now() + 30 * 86400000).toISOString()
  }).select().single()
  
  if (error) {
    console.error('Error creating deal:', error)
    return
  }
  
  console.log('Deal created:', deal.id)
  
  // Create requirements
  const docs = [
    { transaction_id: deal.id, name: 'Identificación Oficial (ID)', category: 'Client Documents', status: 'pending', required: true, ai_qa_enabled: true, ai_guidelines: 'Debe ser legible y vigente.' },
    { transaction_id: deal.id, name: 'Prueba de Fondos', category: 'Client Documents', status: 'pending', required: true, ai_qa_enabled: false }
  ]
  
  const { error: dErr } = await supabase.from('tc_documents').insert(docs)
  if (dErr) {
    console.error('Error creating docs:', dErr)
  } else {
    console.log('Docs templates created')
  }
}

run()
