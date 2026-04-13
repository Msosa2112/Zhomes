-- Insert a new bucket for TC Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tc_documents', 'tc_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para Storage: Select a participantes, Insert a participantes
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tc_documents' );

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'tc_documents' );

-- Eliminar y Actualizar para dueños o admins
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'tc_documents' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'tc_documents' );
