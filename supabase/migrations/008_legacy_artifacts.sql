
-- Create user_artifacts table
CREATE TABLE IF NOT EXISTS user_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artifact_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artifact_id)
);

-- Add displayed_artifact_id to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS displayed_artifact_id TEXT;

-- RLS Policies
ALTER TABLE user_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own artifacts" 
ON user_artifacts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts" 
ON user_artifacts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Anyone can see equipped artifacts via profile
-- (Profiles table already has public read access usually, but verifying displayed_artifact_id is accessible)
-- No extra policy needed as long as 'profiles' is public readable or at least readable by auth users.
