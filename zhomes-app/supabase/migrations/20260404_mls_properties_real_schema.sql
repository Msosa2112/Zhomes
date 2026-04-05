-- =====================================================
-- mls_properties — Schema Real Completo
--
-- Reemplaza la migración minimalista de 20260328_core_tables.sql
-- que solo tenía (id TEXT, data JSONB, updated_at TIMESTAMPTZ).
--
-- Este es el schema real que usa supabasePropertyService.js y
-- los scripts de sync (sync-mls.mjs, sync-properties-final.mjs).
--
-- IMPORTANTE: Esta migración usa ALTER TABLE para ser idempotente
-- y no romper una tabla existente. Si la tabla no existe, la crea.
-- =====================================================

-- 1. Crear tabla si no existe (estructura completa)
CREATE TABLE IF NOT EXISTS mls_properties (
    -- Identity
    id                  TEXT PRIMARY KEY,           -- ListingKey from Spark MLS
    spark_source        TEXT DEFAULT 'spark',        -- 'spark' | 'app' (manually uploaded)

    -- Location
    address             TEXT,
    city                TEXT,
    state               TEXT DEFAULT 'KY',
    zip                 TEXT,
    lat                 NUMERIC(10, 7),
    lng                 NUMERIC(10, 7),
    subdivision         TEXT,

    -- Listing details
    price               NUMERIC(12, 2),             -- ListPrice
    close_price         NUMERIC(12, 2),             -- ClosePrice
    beds                INTEGER,                    -- BedroomsTotal
    baths               NUMERIC(5, 2),              -- BathroomsTotalInteger
    sqft                INTEGER,                    -- LivingArea
    lot_size            NUMERIC(10, 4),             -- LotSizeAcres
    year_built          INTEGER,
    property_subtype    TEXT,                       -- 'Single Family', 'Condominium', etc.
    description         TEXT,                       -- PublicRemarks

    -- Status
    status              TEXT,                       -- 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Cancelled', 'Expired', 'Exclusiva'
    is_zhomes           BOOLEAN DEFAULT false,       -- TRUE = ZHomes exclusive listing

    -- Media
    primary_photo       TEXT,                       -- URL of main photo
    photos              JSONB,                      -- Array of photo URLs

    -- Agent/Office
    list_agent_name     TEXT,
    list_agent_key      TEXT,
    list_office_key     TEXT,

    -- Features
    garage_yn           BOOLEAN DEFAULT false,
    pool_features       JSONB,                      -- Array of strings
    basement            JSONB,                      -- Array of strings
    fireplace_yn        BOOLEAN DEFAULT false,

    -- Dates
    list_date           DATE,
    close_date          DATE,

    -- Sync metadata
    sync_timestamp      TIMESTAMPTZ DEFAULT now(),

    -- Legacy column (kept for backward compat with old migration)
    data                JSONB,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. Add columns that may be missing on existing tables (idempotent)
DO $$
BEGIN
    -- Add all columns if they don't exist yet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='spark_source') THEN
        ALTER TABLE mls_properties ADD COLUMN spark_source TEXT DEFAULT 'spark';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='address') THEN
        ALTER TABLE mls_properties ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='city') THEN
        ALTER TABLE mls_properties ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='state') THEN
        ALTER TABLE mls_properties ADD COLUMN state TEXT DEFAULT 'KY';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='zip') THEN
        ALTER TABLE mls_properties ADD COLUMN zip TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='lat') THEN
        ALTER TABLE mls_properties ADD COLUMN lat NUMERIC(10, 7);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='lng') THEN
        ALTER TABLE mls_properties ADD COLUMN lng NUMERIC(10, 7);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='subdivision') THEN
        ALTER TABLE mls_properties ADD COLUMN subdivision TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='price') THEN
        ALTER TABLE mls_properties ADD COLUMN price NUMERIC(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='close_price') THEN
        ALTER TABLE mls_properties ADD COLUMN close_price NUMERIC(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='beds') THEN
        ALTER TABLE mls_properties ADD COLUMN beds INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='baths') THEN
        ALTER TABLE mls_properties ADD COLUMN baths NUMERIC(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='sqft') THEN
        ALTER TABLE mls_properties ADD COLUMN sqft INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='lot_size') THEN
        ALTER TABLE mls_properties ADD COLUMN lot_size NUMERIC(10, 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='year_built') THEN
        ALTER TABLE mls_properties ADD COLUMN year_built INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='property_subtype') THEN
        ALTER TABLE mls_properties ADD COLUMN property_subtype TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='description') THEN
        ALTER TABLE mls_properties ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='status') THEN
        ALTER TABLE mls_properties ADD COLUMN status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='is_zhomes') THEN
        ALTER TABLE mls_properties ADD COLUMN is_zhomes BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='primary_photo') THEN
        ALTER TABLE mls_properties ADD COLUMN primary_photo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='photos') THEN
        ALTER TABLE mls_properties ADD COLUMN photos JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='list_agent_name') THEN
        ALTER TABLE mls_properties ADD COLUMN list_agent_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='list_agent_key') THEN
        ALTER TABLE mls_properties ADD COLUMN list_agent_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='list_office_key') THEN
        ALTER TABLE mls_properties ADD COLUMN list_office_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='garage_yn') THEN
        ALTER TABLE mls_properties ADD COLUMN garage_yn BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='pool_features') THEN
        ALTER TABLE mls_properties ADD COLUMN pool_features JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='basement') THEN
        ALTER TABLE mls_properties ADD COLUMN basement JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='fireplace_yn') THEN
        ALTER TABLE mls_properties ADD COLUMN fireplace_yn BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='list_date') THEN
        ALTER TABLE mls_properties ADD COLUMN list_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='close_date') THEN
        ALTER TABLE mls_properties ADD COLUMN close_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mls_properties' AND column_name='sync_timestamp') THEN
        ALTER TABLE mls_properties ADD COLUMN sync_timestamp TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 3. Enable RLS (idempotent)
ALTER TABLE mls_properties ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (drop and recreate for clean state)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read properties" ON mls_properties;
  DROP POLICY IF EXISTS "Block client inserts to mls_properties" ON mls_properties;
  DROP POLICY IF EXISTS "Block client updates to mls_properties" ON mls_properties;
  DROP POLICY IF EXISTS "Block client deletes to mls_properties" ON mls_properties;
END $$;

-- Public read
CREATE POLICY "Anyone can read properties" ON mls_properties
    FOR SELECT USING (true);

-- Block all client writes (sync uses service_role which bypasses RLS)
CREATE POLICY "Block client inserts to mls_properties" ON mls_properties
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Block client updates to mls_properties" ON mls_properties
    FOR UPDATE USING (false);

CREATE POLICY "Block client deletes to mls_properties" ON mls_properties
    FOR DELETE USING (false);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_props_status       ON mls_properties(status);
CREATE INDEX IF NOT EXISTS idx_props_is_zhomes    ON mls_properties(is_zhomes);
CREATE INDEX IF NOT EXISTS idx_props_city         ON mls_properties(city);
CREATE INDEX IF NOT EXISTS idx_props_price        ON mls_properties(price);
CREATE INDEX IF NOT EXISTS idx_props_beds         ON mls_properties(beds);
CREATE INDEX IF NOT EXISTS idx_props_list_date    ON mls_properties(list_date DESC);
CREATE INDEX IF NOT EXISTS idx_props_agent_key    ON mls_properties(list_agent_key);
CREATE INDEX IF NOT EXISTS idx_props_coords       ON mls_properties(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_props_zhomes_first ON mls_properties(is_zhomes DESC, list_date DESC);
