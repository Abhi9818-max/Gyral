-- COLUMN "created_at" ALREADY EXISTS (Commented out to prevent error)
-- ALTER TABLE pacts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Backfill existing records (Essential for old pacts to work with reminders)
UPDATE pacts SET created_at = now() WHERE created_at IS NULL;
