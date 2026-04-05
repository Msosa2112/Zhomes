-- =====================================================
-- Agent Photos — Añade columnas de fotos a zhomes_agents
--
-- Las columnas photo_url y full_body_photo_url fueron añadidas
-- manualmente en producción por los scripts upload-agent-photos.mjs
-- y update-agent-photo-urls.mjs, pero no estaban en ninguna migración.
-- Esta migración las documenta formalmente.
--
-- Supabase Storage Bucket esperado: 'zhomes-agents'
-- =====================================================

DO $$
BEGIN
    -- photo_url: foto de perfil (headshot) del agente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'zhomes_agents' AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE zhomes_agents ADD COLUMN photo_url TEXT;
        COMMENT ON COLUMN zhomes_agents.photo_url IS 'URL de foto de perfil (headshot) desde Supabase Storage bucket zhomes-agents';
    END IF;

    -- full_body_photo_url: foto cuerpo completo del agente (para cards y landing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'zhomes_agents' AND column_name = 'full_body_photo_url'
    ) THEN
        ALTER TABLE zhomes_agents ADD COLUMN full_body_photo_url TEXT;
        COMMENT ON COLUMN zhomes_agents.full_body_photo_url IS 'URL de foto cuerpo completo desde Supabase Storage bucket zhomes-agents';
    END IF;

    -- photo_updated_at: timestamp de última actualización de foto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'zhomes_agents' AND column_name = 'photo_updated_at'
    ) THEN
        ALTER TABLE zhomes_agents ADD COLUMN photo_updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'zhomes_agents'
  AND column_name IN ('photo_url', 'full_body_photo_url', 'photo_updated_at')
ORDER BY column_name;
