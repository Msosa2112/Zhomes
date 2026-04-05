-- =====================================================
-- Fix RLS: Bloqueo explícito de escritura a mls_properties desde cliente
-- Las propiedades solo puede escribirlas el sync server-side (service_role key)
-- Ejecutar en: Supabase SQL Editor → proyecto elhqcwpqbnxafaepmswl
-- =====================================================

-- Bloquear INSERT, UPDATE, DELETE desde la anon/authenticated key
-- (El sync usa service_role que bypass RLS automáticamente)

DO $$
BEGIN
  -- Drop policies if they already exist (idempotent)
  DROP POLICY IF EXISTS "Block client inserts to mls_properties" ON mls_properties;
  DROP POLICY IF EXISTS "Block client updates to mls_properties" ON mls_properties;
  DROP POLICY IF EXISTS "Block client deletes to mls_properties" ON mls_properties;
END $$;

CREATE POLICY "Block client inserts to mls_properties" ON mls_properties
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Block client updates to mls_properties" ON mls_properties
    FOR UPDATE USING (false);

CREATE POLICY "Block client deletes to mls_properties" ON mls_properties
    FOR DELETE USING (false);

-- Verificar políticas activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'mls_properties'
ORDER BY cmd;
