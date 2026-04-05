CREATE TABLE IF NOT EXISTS public.api_commute_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_address TEXT NOT NULL,
    dest_address TEXT NOT NULL,
    distance_text TEXT,
    duration_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(origin_address, dest_address)
);

ALTER TABLE public.api_commute_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the cache
CREATE POLICY "Public read access to commute cache" ON public.api_commute_cache FOR SELECT USING (true);

-- Allow authenticated users to write to the cache (since the calculation happens client-side)
CREATE POLICY "Users can insert to commute cache" ON public.api_commute_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update commute cache" ON public.api_commute_cache FOR UPDATE USING (auth.role() = 'authenticated');
