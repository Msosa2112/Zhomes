-- =========================================================================================
-- MIGRACIÓN SUPABASE: DISPARADORES WEBHOOK HACIA ZHOMES VERCEL API
-- Objetivo: Remplazar a N8N disparando un HTTP POST puramente desde el motor PostgreSQL
-- =========================================================================================

-- 1. Habilitar extension pg_net (Casi todos los proyectos de Supabase la tienen habilitada)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Función maestra que hace el puente: PostgreSQL -> Vercel Serverless Function
CREATE OR REPLACE FUNCTION public.execute_zhomes_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  -- Empaquetamos la fila que acaba de sufrir cambios 
  -- ('old_record', 'record', 'type', 'table') muy al estilo nativo de Supabase
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END,
    'schema', TG_TABLE_SCHEMA
  );

  -- Disparo asíncrono utilizando pg_net a nuestra API centralizada (Webhook Handler)
  -- Esto ocurre en milisegundos y en un hilo paralelo para no frenar la base de datos
  PERFORM net.http_post(
    url := 'https://zhomesapp.com/api/webhook-handler',
    body := v_payload,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer zhomes_internal_webhook_secret_123"}'::jsonb
  );

  RETURN NEW;
END;
$$;


-- =========================================================================================
-- CREACIÓN DE GATILLOS ESTRATÉGICOS (TRIGGERS)
-- =========================================================================================

-- A. Gatillo para Documentos (tc_documents)
-- Dispara cuando alguien sube un documento o cambia su estado.
DROP TRIGGER IF EXISTS trigger_tc_documents_webhook ON public.tc_documents;
CREATE TRIGGER trigger_tc_documents_webhook
  AFTER INSERT OR UPDATE OF file_url, status
  ON public.tc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.execute_zhomes_webhook();


-- B. Gatillo para Transacciones (tc_transactions)
-- Dispara cuando cambia la fecha de cierre, status o se agenda algo relevante en el Deal.
DROP TRIGGER IF EXISTS trigger_tc_transactions_webhook ON public.tc_transactions;
CREATE TRIGGER trigger_tc_transactions_webhook
  AFTER UPDATE OF status, closing_date, inspection_deadline, financing_deadline
  ON public.tc_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.execute_zhomes_webhook();


-- Nota: Puedes añadir más triggers a otras tablas (ej. citas/agendamiento) usando
-- la misma función maestra 'execute_zhomes_webhook()'. Nuestro código en Vercel 
-- se encargará de clasificar y enviar los emails/sms.
