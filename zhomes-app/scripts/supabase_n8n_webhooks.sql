-- ==========================================
-- SCRIPT DE INICIALIZACIÓN - WEBHOOKS N8N
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Habilitar la extensión para realizar peticiones HTTP (pg_net)
-- Nota: En algunas versiones de Supabase, esto requiere ir al Panel de Control > Database > Extensions
create extension if not exists pg_net with schema extensions;

-- 2. Función Transaccional para Disparar el Webhook de N8N
-- Esta función captura el cambio en la tabla y envía el body en formato JSON.
create or replace function public.fn_send_webhook_to_n8n()
returns trigger as $$
declare
  webhook_endpoint text;
  payload jsonb;
  request_id bigint;
begin
  -- El parámetro 0 del trigger nos dirá la ruta específica de n8n
  webhook_endpoint := TG_ARGV[0];
  
  -- Construir el JSON que enviará n8n para que procese el nodo de inicio de Webhook
  payload := jsonb_build_object(
    'event_type', TG_OP,
    'table_name', TG_TABLE_NAME,
    'timestamp', now(),
    'record', row_to_json(NEW),
    'old_record', case when TG_OP = 'UPDATE' then row_to_json(OLD) else null end
  );

  -- [ATENCIÓN]: REEMPLAZA EL DOMINIO DE RAILWAY ABAJO POR EL DOMINIO FINAL DE TU N8N
  -- Se manda a ejecutar asíncronamente y no bloquea el commit de la DB
  select net.http_post(
      url:='https://n8n-production-cfe9c.up.railway.app/webhook/' || webhook_endpoint,
      body:=payload,
      headers:='{"Content-Type": "application/json"}'::jsonb
  ) into request_id;

  return NEW;
end;
$$ language plpgsql security definer;


-- ==========================================
-- 3. TRIGGERS DEL JOURNEY (BOOKINGS Y CRM)
-- ==========================================

-- A. Bookings (Solicitudes y Cambios de Estatus)
drop trigger if exists trigger_n8n_bookings on public.bookings;
create trigger trigger_n8n_bookings
  after insert or update of status on public.bookings
  for each row
  execute function public.fn_send_webhook_to_n8n('zhomes-bookings-events');
-- Al disparar: Irá a https://.../webhook/zhomes-bookings-events
-- NOTA: En N8N puedes hacer un "Switch" filtrando el JSON 'record.status' (pending, confirmed, completed)

-- B. CRM Leads (Pre-aprobación, Oferta, Cierre)
drop trigger if exists trigger_n8n_crm_leads on public.crm_leads;
create trigger trigger_n8n_crm_leads
  after update of stage on public.crm_leads
  for each row
  when (OLD.stage is distinct from NEW.stage 
        AND NEW.stage in ('preapproved', 'offer', 'closing'))
  execute function public.fn_send_webhook_to_n8n('zhomes-crm-leads-events');
-- Al disparar: Irá a https://.../webhook/zhomes-crm-leads-events
-- Sólo notificará pasajes importantes (Pre-aprobado, ofertando y cierre)

-- C. Activación de Realtor (Cuenta Aprobada)
drop trigger if exists trigger_n8n_realtor_activated on public.zhomes_agents;
create trigger trigger_n8n_realtor_activated
  after update of status on public.zhomes_agents
  for each row
  when (OLD.status = 'pending_approval' AND NEW.status = 'Active')
  execute function public.fn_send_webhook_to_n8n('realtor-activated');
-- Al disparar: Irá a https://.../webhook/realtor-activated
