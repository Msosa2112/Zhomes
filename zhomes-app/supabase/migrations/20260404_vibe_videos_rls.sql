-- =====================================================
-- vibe_videos — Habilitar RLS y políticas de seguridad
-- Estaba sin RLS: cualquiera podía leer/escribir/borrar
-- =====================================================

ALTER TABLE vibe_videos ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver videos activos (app pública)
CREATE POLICY "Anyone can view active vibe videos" ON vibe_videos
    FOR SELECT USING (status = 'active');

-- Solo el realtor propietario puede insertar sus videos
CREATE POLICY "Realtor can insert own vibe videos" ON vibe_videos
    FOR INSERT WITH CHECK (auth.uid() = realtor_id);

-- Solo el realtor propietario puede actualizar sus videos
CREATE POLICY "Realtor can update own vibe videos" ON vibe_videos
    FOR UPDATE USING (auth.uid() = realtor_id);

-- Solo el realtor propietario puede borrar sus videos
CREATE POLICY "Realtor can delete own vibe videos" ON vibe_videos
    FOR DELETE USING (auth.uid() = realtor_id);
