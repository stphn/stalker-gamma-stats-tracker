-- Exact world coordinates of the death, emitted by the mod (session.death_pos_x/z)
-- and written by server/index.js. The columns were added to the live DB out of
-- band; this migration captures them so a fresh rebuild matches. IF NOT EXISTS
-- keeps it a no-op against the existing database.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS death_pos_x DOUBLE PRECISION;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS death_pos_z DOUBLE PRECISION;
