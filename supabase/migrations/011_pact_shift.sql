-- Add shifted_count to pacts table
ALTER TABLE pacts 
ADD COLUMN shifted_count INTEGER DEFAULT 0;

-- Optional: Add comment if needed (not strictly required but good practice)
COMMENT ON COLUMN pacts.shifted_count IS 'Tracks how many times a pact has been shifted to the next day (limit 1)';
