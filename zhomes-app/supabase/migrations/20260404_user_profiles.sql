-- =====================================================
-- User Profiles — Tabla de perfil del usuario
--
-- Extiende auth.users con datos de perfil adicionales
-- que no caben en user_metadata de Supabase Auth.
--
-- Se crea automáticamente via trigger cuando un usuario
-- se registra (insert en auth.users).
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal info
    full_name       TEXT,
    first_name      TEXT,
    last_name       TEXT,
    phone           TEXT,
    avatar_url      TEXT,                   -- Supabase Storage URL

    -- Preferences
    preferred_language  TEXT DEFAULT 'es',  -- 'es' | 'en'
    preferred_currency  TEXT DEFAULT 'USD',
    notifications_enabled BOOLEAN DEFAULT true,

    -- Home buyer context
    buyer_status    TEXT,                   -- 'browsing', 'pre-qualified', 'active', 'under-contract'
    budget_min      NUMERIC(12, 2),
    budget_max      NUMERIC(12, 2),
    preferred_cities TEXT[],               -- Ej: ['Louisville', 'Lexington']
    preferred_beds   INTEGER,
    preferred_baths  INTEGER,

    -- Co-shopping
    coshopper_user_id UUID REFERENCES auth.users(id),  -- Linked partner for /pareja
    coshopper_name    TEXT,

    -- Assigned realtor (set when client picks a realtor)
    assigned_realtor_id UUID REFERENCES auth.users(id),

    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Realtors and brokers can view their assigned clients' profiles
-- (Uses a simple role check via user_metadata for now)
CREATE POLICY "Staff can view client profiles" ON user_profiles
    FOR SELECT USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('broker', 'realtor', 'admin')
    );

-- Auto-create profile on user registration (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_coshopper ON user_profiles(coshopper_user_id) WHERE coshopper_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_realtor   ON user_profiles(assigned_realtor_id) WHERE assigned_realtor_id IS NOT NULL;
