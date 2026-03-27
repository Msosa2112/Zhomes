-- =====================================================
-- ZHomes Scheduling & Booking Tables
-- Run this migration in Supabase SQL Editor
-- =====================================================

-- 1. Realtor Availability (weekly schedule)
CREATE TABLE IF NOT EXISTS realtor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    realtor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(realtor_id, day_of_week)
);

-- 2. Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    realtor_id UUID NOT NULL REFERENCES auth.users(id),
    property_id TEXT,
    client_user_id UUID REFERENCES auth.users(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    booking_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Push notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    token TEXT NOT NULL,
    platform TEXT DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. E-Signature documents
CREATE TABLE IF NOT EXISTS esign_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    template_type TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    agent_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'expired')),
    signature_data TEXT, -- Base64 PNG
    pdf_url TEXT,
    sent_date TIMESTAMPTZ,
    signed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE realtor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: realtor_availability
CREATE POLICY "Users can read all availability" ON realtor_availability FOR SELECT USING (true);
CREATE POLICY "Realtors manage own availability" ON realtor_availability FOR ALL USING (auth.uid() = realtor_id);

-- RLS Policies: bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = client_user_id OR auth.uid() = realtor_id);
CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Involved parties can update bookings" ON bookings FOR UPDATE USING (auth.uid() = client_user_id OR auth.uid() = realtor_id);

-- RLS Policies: push_tokens
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: esign_documents
CREATE POLICY "Agents manage own documents" ON esign_documents FOR ALL USING (auth.uid() = agent_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_realtor_date ON bookings(realtor_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_user_id);
CREATE INDEX IF NOT EXISTS idx_availability_realtor ON realtor_availability(realtor_id);
