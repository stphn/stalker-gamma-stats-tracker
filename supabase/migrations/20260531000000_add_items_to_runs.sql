-- Per-run items looted. The mod already emits session.items in each last_run
-- entry; persist it so the death log can show it alongside stashes.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS items INTEGER;
