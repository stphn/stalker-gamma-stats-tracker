CREATE TABLE IF NOT EXISTS runs (
	id                   BIGSERIAL PRIMARY KEY,
	start                BIGINT NOT NULL UNIQUE,
	playtime             INTEGER,
	kills                JSONB,
	rubles_earned        INTEGER,
	artifacts            INTEGER,
	tasks                INTEGER,
	stashes              INTEGER,
	death_location       TEXT,
	death_location_name  TEXT,
	created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Anon client (dashboard + server) may read
CREATE POLICY "Allow anon read"
	ON runs FOR SELECT TO anon USING (true);

-- Anon client (server/index.js uses the publishable/anon key) may insert
CREATE POLICY "Allow anon insert"
	ON runs FOR INSERT TO anon WITH CHECK (true);

-- Anon client may upsert (update on conflict)
CREATE POLICY "Allow anon update"
	ON runs FOR UPDATE TO anon USING (true);

-- Service role write policies (for environments that use the secret key)
CREATE POLICY "Allow service insert"
	ON runs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service upsert"
	ON runs FOR UPDATE TO service_role USING (true);

-- Add to the realtime publication so INSERT events are pushed to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE runs;
