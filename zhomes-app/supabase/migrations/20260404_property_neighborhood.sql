-- =====================================================
-- property_neighborhood — Datos de entorno por propiedad
-- Fuente: Camino AI API (https://api.getcamino.ai)
-- Se sincroniza 1 vez/semana via cron (vecindarios no cambian frecuente)
-- ZHomes properties se sincronizan primero y con mayor frecuencia
-- =====================================================

CREATE TABLE IF NOT EXISTS property_neighborhood (
    property_id         TEXT PRIMARY KEY REFERENCES mls_properties(id) ON DELETE CASCADE,

    -- Descripción general del área
    area_description    TEXT,
    context_insights    TEXT,

    -- Scores resumidos (0-100)
    walkability_score   INTEGER,
    transit_score       INTEGER,
    schools_score       INTEGER,

    -- Datos estructurados de Camino API (JSON raw)
    schools             JSONB,      -- [{name, distance, type, rating}]
    transit             JSONB,      -- [{name, distance, type}]
    grocery             JSONB,      -- [{name, distance}]
    parks               JSONB,      -- [{name, distance}]
    restaurants         JSONB,      -- [{name, distance, cuisine}]
    total_places        INTEGER,

    -- Coordenadas usadas (para auditoría)
    lat                 NUMERIC(10, 7),
    lng                 NUMERIC(10, 7),
    radius_meters       INTEGER DEFAULT 1000,

    -- Metadata de sync
    synced_at           TIMESTAMPTZ DEFAULT now(),
    camino_api_version  TEXT DEFAULT 'v1',
    sync_error          TEXT        -- NULL = ok, texto = error en última sync
);

-- RLS: público para leer (igual que mls_properties)
ALTER TABLE property_neighborhood ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read neighborhood data" ON property_neighborhood
    FOR SELECT USING (true);

CREATE POLICY "Block client writes to neighborhood" ON property_neighborhood
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Block client updates to neighborhood" ON property_neighborhood
    FOR UPDATE USING (false);

CREATE POLICY "Block client deletes to neighborhood" ON property_neighborhood
    FOR DELETE USING (false);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_neighborhood_synced   ON property_neighborhood(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_neighborhood_walk     ON property_neighborhood(walkability_score DESC);
CREATE INDEX IF NOT EXISTS idx_neighborhood_error    ON property_neighborhood(sync_error) WHERE sync_error IS NOT NULL;
