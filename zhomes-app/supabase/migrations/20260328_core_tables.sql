-- =====================================================
-- ZHomes Core Tables Migration
-- Creates all tables used by the app
-- =====================================================

-- 1. User Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    property_data JSONB,
    collection_name TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- 2. MLS Properties cache (for saved/shared properties)
CREATE TABLE IF NOT EXISTS mls_properties (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Vibe Videos
CREATE TABLE IF NOT EXISTS vibe_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mls_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_videos ENABLE ROW LEVEL SECURITY;

-- RLS: user_favorites
CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- RLS: mls_properties (public read, no write from client)
CREATE POLICY "Anyone can read properties" ON mls_properties
    FOR SELECT USING (true);

-- RLS: vibe_videos (public read, auth write)
CREATE POLICY "Anyone can view vibes" ON vibe_videos
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create vibes" ON vibe_videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vibes" ON vibe_videos
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_vibes_property ON vibe_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_vibes_user ON vibe_videos(user_id);
