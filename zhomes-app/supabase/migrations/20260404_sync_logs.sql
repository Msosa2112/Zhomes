-- =====================================================
-- Sync Logs — Registro de ejecuciones del cron de sync
--
-- Cada vez que /api/sync se ejecuta (manual o por cron),
-- debe registrar el resultado aquí para observabilidad.
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_logs (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at          TIMESTAMPTZ DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    duration_seconds    NUMERIC(8, 2),     -- tiempo de ejecución

    -- Resultados
    properties_upserted INTEGER DEFAULT 0,
    properties_skipped  INTEGER DEFAULT 0,
    agents_upserted     INTEGER DEFAULT 0,
    office_updated      BOOLEAN DEFAULT false,

    -- Estado
    status              TEXT DEFAULT 'running'  -- 'running', 'success', 'partial', 'failed'
        CHECK (status IN ('running', 'success', 'partial', 'failed')),

    -- Detalles
    triggered_by        TEXT DEFAULT 'cron',    -- 'cron' | 'manual' | 'webhook'
    spark_api_version   TEXT DEFAULT 'v3',
    error_message       TEXT,
    details             JSONB                   -- JSON libre para detalles adicionales
);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Solo staff puede ver los logs (y el sync usa service_role que bypass RLS)
CREATE POLICY "Staff can view sync logs" ON sync_logs
    FOR SELECT USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('broker', 'admin')
        OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('broker', 'admin')
    );

-- Index para buscar los logs más recientes rápido
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status  ON sync_logs(status);
