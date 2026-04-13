/**
 * ZHomes TC — API: /api/tc-transactions
 * 
 * Endpoints:
 *   GET    /api/tc-transactions         → Lista transacciones (filtrada por rol via RLS)
 *   POST   /api/tc-transactions         → Crea transacción + auto-genera checklist de docs
 *   GET    /api/tc-transactions?id=xxx  → Una transacción con docs, mensajes y eventos
 *   PATCH  /api/tc-transactions         → Actualiza status o campos de una transacción
 */

import { createClient } from '@supabase/supabase-js';
import { generateChecklist } from '../src/data/tcDocumentTemplates.js';

const supabaseUrl    = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extraer token del header Authorization
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  // Cliente con el token del usuario → respeta RLS automáticamente
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  try {
    // ─── GET: Listar transacciones ──────────────────────────────────
    if (req.method === 'GET' && !req.query.id) {
      const { status, realtor_id, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('tc_transactions')
        .select(`
          *,
          tc_documents(id, status, required),
          tc_events(id, is_alert, is_resolved, due_date, event_type)
        `)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (status)     query = query.eq('status', status);
      if (realtor_id) query = query.eq('realtor_id', realtor_id);

      const { data, error } = await query;
      if (error) throw error;

      // Enriquecer con métricas de documentos
      const enriched = data.map((tx) => {
        const docs      = tx.tc_documents || [];
        const events    = tx.tc_events || [];
        const required  = docs.filter((d) => d.required);
        const completed = required.filter((d) => d.status === 'approved');
        const pending   = required.filter((d) => d.status === 'pending');
        const alerts    = events.filter((e) => e.is_alert && !e.is_resolved);
        const urgentDeadlines = events.filter((e) => {
          if (!e.due_date) return false;
          const daysLeft = Math.ceil((new Date(e.due_date) - new Date()) / 86400000);
          return daysLeft <= 3 && !e.is_resolved;
        });

        return {
          ...tx,
          _metrics: {
            docs_total:     required.length,
            docs_completed: completed.length,
            docs_pending:   pending.length,
            docs_progress:  required.length > 0
              ? Math.round((completed.length / required.length) * 100)
              : 0,
            alerts_count:   alerts.length,
            urgent_deadlines: urgentDeadlines.length,
          },
        };
      });

      return res.status(200).json({ transactions: enriched, count: enriched.length });
    }

    // ─── GET by ID: Detalle completo ────────────────────────────────
    if (req.method === 'GET' && req.query.id) {
      const { data, error } = await supabase
        .from('tc_transactions')
        .select(`
          *,
          tc_documents(* ORDER BY sort_order ASC),
          tc_messages(* ORDER BY created_at ASC),
          tc_events(* ORDER BY created_at DESC)
        `)
        .eq('id', req.query.id)
        .single();

      if (error) throw error;
      return res.status(200).json({ transaction: data });
    }

    // ─── POST: Crear transacción + checklist ────────────────────────
    if (req.method === 'POST') {
      const {
        address, city, price, transaction_type = 'purchase',
        realtor_id, client_name, client_email, client_phone,
        contract_date, inspection_deadline, financing_deadline,
        appraisal_deadline, closing_date, notes, property_id,
      } = req.body;

      if (!address) {
        return res.status(400).json({ error: 'El campo address es requerido' });
      }

      // 1. Crear la transacción
      const { data: newTx, error: txError } = await supabase
        .from('tc_transactions')
        .insert({
          address,
          city:             city || 'Louisville, KY',
          price,
          transaction_type,
          status:           'under_contract',
          realtor_id,
          client_name,
          client_email,
          client_phone,
          contract_date,
          inspection_deadline,
          financing_deadline,
          appraisal_deadline,
          closing_date,
          notes,
          property_id,
        })
        .select()
        .single();

      if (txError) throw txError;

      // 2. Auto-generar checklist de documentos
      const checklist = generateChecklist(newTx.id, transaction_type);
      const { error: docsError } = await supabase
        .from('tc_documents')
        .insert(checklist);

      if (docsError) console.error('Error generando checklist:', docsError);

      // 3. Crear evento de inicio en el log
      await supabase.from('tc_events').insert({
        transaction_id: newTx.id,
        event_type:     'status_changed',
        description:    `Transacción abierta: ${address}. Se generó checklist con ${checklist.length} documentos.`,
        is_alert:       false,
      });

      // 4. Mensaje de sistema en el chat
      await supabase.from('tc_messages').insert({
        transaction_id: newTx.id,
        sender_name:    'ZHomes TC',
        sender_role:    'system',
        content:        ` Transacción abierta para ${address}. Se generó un checklist de ${checklist.length} documentos requeridos. El realtor puede comenzar a subir documentos.`,
        message_type:   'system',
      });

      return res.status(201).json({
        transaction:       newTx,
        checklist_created: checklist.length,
        message:           'Transacción creada exitosamente',
      });
    }

    // ─── PATCH: Actualizar transacción ──────────────────────────────
    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Se requiere el id de la transacción' });

      // Si se está cambiando el status, registrar evento
      if (updates.status) {
        const { data: existing } = await supabase
          .from('tc_transactions')
          .select('status, address')
          .eq('id', id)
          .single();

        if (existing && existing.status !== updates.status) {
          await supabase.from('tc_events').insert({
            transaction_id: id,
            event_type:     'status_changed',
            description:    `Status actualizado: ${existing.status} → ${updates.status} para ${existing.address}`,
            is_alert:       false,
          });

          await supabase.from('tc_messages').insert({
            transaction_id: id,
            sender_name:    'ZHomes TC',
            sender_role:    'system',
            content:        ` Estado actualizado a "${updates.status}" para ${existing.address}`,
            message_type:   'status_change',
          });
        }
      }

      const { data, error } = await supabase
        .from('tc_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ transaction: data, message: 'Actualizado exitosamente' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    console.error('[TC Transactions API Error]', err);
    return res.status(500).json({
      error:   'Error interno del servidor',
      details: err.message,
    });
  }
}
