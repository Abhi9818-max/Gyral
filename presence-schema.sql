-- Create user_presence table for online status tracking
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view presence status
CREATE POLICY "Anyone can view user presence"
ON user_presence
FOR SELECT
USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON user_presence
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON user_presence
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- Enable Realtime
alter publication supabase_realtime add table user_presence;
