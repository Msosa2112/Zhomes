-- =====================================================
-- Fix Security Advisors — Correcciones de auditoría Supabase
-- Resuelve ERRORs detectados por el security advisor
-- =====================================================

-- Fix 1: sync_logs — reemplazar política que usa user_metadata
-- (user_metadata es editable por el usuario → inseguro en RLS)
-- Usamos app_metadata que solo el admin puede modificar.
DROP POLICY IF EXISTS "Staff can view sync logs" ON sync_logs;

CREATE POLICY "Staff can view sync logs" ON sync_logs
    FOR SELECT USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('broker', 'admin')
    );

-- Fix 2: Habilitar RLS en tablas legacy sin protección
-- property_listings_tests: tabla de tests, bloquear acceso público
-- sync_log: tabla legacy (ya tenemos sync_logs), bloquear acceso público
ALTER TABLE property_listings_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block all access to test table" ON property_listings_tests
    FOR ALL USING (false);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block public access to legacy sync_log" ON sync_log
    FOR SELECT USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('broker', 'admin')
    );

-- Fix 3: Añadir search_path fijo a handle_new_user
-- Evita inyección via search_path mutable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
