-- =====================================================
-- ZHomes Pre-Qualification Estimates
-- Stores mortgage pre-qualification estimates linked to a user.
-- Visible to both the client (auth.uid) and their assigned realtor.
-- =====================================================

CREATE TABLE IF NOT EXISTS prequal_estimates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Input fields (what was entered)
    gross_monthly       NUMERIC NOT NULL,
    existing_debts      NUMERIC NOT NULL DEFAULT 0,
    down_payment        NUMERIC NOT NULL DEFAULT 0,
    credit_tier_index   INTEGER NOT NULL,
    credit_tier_label   TEXT,
    loan_term           INTEGER NOT NULL DEFAULT 30,

    -- Output snapshot (stored as JSONB for flexibility)
    result              JSONB NOT NULL,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    -- Only one active estimate per user (upsert on conflict)
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE prequal_estimates ENABLE ROW LEVEL SECURITY;

-- Client can manage their own estimates
CREATE POLICY "Users can manage own prequal" ON prequal_estimates
    FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_prequal_user ON prequal_estimates(user_id);
