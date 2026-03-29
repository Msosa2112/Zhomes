-- ZHomes Agents table
-- Stores ZHomes real estate agents synced from Spark MLS 2x/day.
-- Includes performance stats to avoid calling Spark on every app load.

CREATE TABLE IF NOT EXISTS zhomes_agents (
  id TEXT PRIMARY KEY,                    -- MemberKey from Spark
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mls_id TEXT,
  status TEXT,
  license TEXT,
  member_type TEXT,
  office_name TEXT,
  office_key TEXT,
  bio TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  -- Performance stats (updated each sync)
  total_closed INTEGER DEFAULT 0,
  total_volume BIGINT DEFAULT 0,
  avg_price INTEGER DEFAULT 0,
  last_close_date DATE,
  recent_deals JSONB,
  -- Metadata
  sync_timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (read-only public access)
ALTER TABLE zhomes_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zhomes_agents" ON zhomes_agents FOR SELECT USING (true);


-- ZHomes Office table
-- Stores ZHomes Real Estate office data synced from Spark MLS 2x/day.

CREATE TABLE IF NOT EXISTS zhomes_office (
  id TEXT PRIMARY KEY,                    -- OfficeKey from Spark
  name TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  license TEXT,
  broker_key TEXT,
  mls_id TEXT,
  status TEXT,
  -- Metadata
  sync_timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (read-only public access)
ALTER TABLE zhomes_office ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read zhomes_office" ON zhomes_office FOR SELECT USING (true);
