-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- para resolver los problemas de permisos al subir documentos

------------------------------------------------------------------
-- 1. Políticas RLS para el Bucket de Almacenamiento (tc_documents)
------------------------------------------------------------------
-- Asegurarnos de que existe el bucket tc_documents y esté listo
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tc_documents', 'tc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Permitir a usuarios autenticados descargar archivos (Lectura)
DROP POLICY IF EXISTS "Allow authenticated read tc_documents" ON storage.objects;
CREATE POLICY "Allow authenticated read tc_documents" 
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'tc_documents');

-- Permitir a usuarios autenticados subir archivos nuevos (Escritura)
DROP POLICY IF EXISTS "Allow authenticated insert tc_documents" ON storage.objects;
CREATE POLICY "Allow authenticated insert tc_documents" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tc_documents');

-- Permitir a usuarios autenticados actualizar y reemplazar archivos
DROP POLICY IF EXISTS "Allow authenticated update tc_documents" ON storage.objects;
CREATE POLICY "Allow authenticated update tc_documents" 
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tc_documents');

------------------------------------------------------------------
-- 2. Políticas RLS para la Tabla de Documentos (tc_documents)
------------------------------------------------------------------
-- Permitir a los usuarios actualizar el registro ('uploaded', 'file_url', etc.)
-- OJO: Esto es general para todo usuario autenticado. 
-- Podríamos restringirlo solo a Realtors/Clientes, pero para que funcione ahora lo abrimos a autenticados.
DROP POLICY IF EXISTS "Permitir update a archivos por autenticados" ON public.tc_documents;
CREATE POLICY "Permitir update a archivos por autenticados" 
ON public.tc_documents FOR UPDATE TO authenticated USING (true);

-- También, para curarnos en salud, que puedan consultar de la tabla todos los autenticados.
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON public.tc_documents;
CREATE POLICY "Permitir lectura a autenticados" 
ON public.tc_documents FOR SELECT TO authenticated USING (true);
