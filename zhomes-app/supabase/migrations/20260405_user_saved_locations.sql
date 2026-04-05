CREATE TABLE IF NOT EXISTS public.user_saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC,
    lon NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own locations (INSERT)" ON public.user_saved_locations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own locations (SELECT)" ON public.user_saved_locations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own locations (UPDATE)" ON public.user_saved_locations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own locations (DELETE)" ON public.user_saved_locations
FOR DELETE USING (auth.uid() = user_id);
