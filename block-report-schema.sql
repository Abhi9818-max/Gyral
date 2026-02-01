-- Block & Report System Schema

-- Add is_admin column to profiles FIRST (needed for policies below)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('harassment', 'spam', 'inappropriate', 'other')),
    content TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
ON blocked_users
FOR SELECT
USING (blocker_id = auth.uid());

CREATE POLICY "Users can block others"
ON blocked_users
FOR INSERT
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
ON blocked_users
FOR DELETE
USING (blocker_id = auth.uid());

-- RLS for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON reports
FOR SELECT
USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
ON reports
FOR INSERT
WITH CHECK (reporter_id = auth.uid());

-- Admin policies (you'll need to set up admin role)
CREATE POLICY "Admins can view all reports"
ON reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admins can update reports"
ON reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable Realtime
alter publication supabase_realtime add table blocked_users;
alter publication supabase_realtime add table reports;

-- Update messages RLS to respect blocks
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;

CREATE POLICY "Users can view messages they sent or received (not blocked)"
ON messages
FOR SELECT
USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = auth.uid() AND blocked_id = sender_id)
        OR (blocker_id = auth.uid() AND blocked_id = receiver_id)
        OR (blocker_id = sender_id AND blocked_id = auth.uid())
        OR (blocker_id = receiver_id AND blocked_id = auth.uid())
    )
);

-- Update friendships RLS to respect blocks
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;

CREATE POLICY "Users can view their own friendships (not blocked)"
ON friendships
FOR SELECT
USING (
    (user_id = auth.uid() OR friend_id = auth.uid())
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
        OR (blocker_id = auth.uid() AND blocked_id = friend_id)
        OR (blocker_id = user_id AND blocked_id = auth.uid())
        OR (blocker_id = friend_id AND blocked_id = auth.uid())
    )
);
