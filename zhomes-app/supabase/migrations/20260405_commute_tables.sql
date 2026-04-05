CREATE TABLE IF NOT EXISTS public.user_saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC,
    lon NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.user_saved_locations ENABLE ROW LEVEL SECURITY;

-- Evitar duplicate policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own saved locations' AND tablename = 'user_saved_locations'
    ) THEN
        CREATE POLICY "Users can manage their own saved locations" 
        ON public.user_saved_locations
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

GRANT ALL ON TABLE public.user_saved_locations TO anon, authenticated, service_role;


CREATE TABLE IF NOT EXISTS public.api_commute_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_address TEXT NOT NULL,
    dest_address TEXT NOT NULL,
    distance_text TEXT,
    duration_text TEXT,
    duration_value INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.api_commute_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read commute cache' AND tablename = 'api_commute_cache'
    ) THEN
        CREATE POLICY "Anyone can read commute cache" 
        ON public.api_commute_cache
        FOR SELECT
        TO public
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert commute cache' AND tablename = 'api_commute_cache'
    ) THEN
        CREATE POLICY "Authenticated users can insert commute cache" 
        ON public.api_commute_cache
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON TABLE public.api_commute_cache TO anon, authenticated, service_role;
