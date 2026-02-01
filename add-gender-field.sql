-- Add gender field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Set default gender to 'male' for existing users (they can update it later)
UPDATE profiles SET gender = 'male' WHERE gender IS NULL;
