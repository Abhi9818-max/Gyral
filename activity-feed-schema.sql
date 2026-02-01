-- Activity Feed Schema

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'streak', 'post', 'level_up')),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_likes table
CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Create activity_comments table
CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities from friends"
ON activities
FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM friendships
        WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = activities.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = activities.user_id)
        AND friendships.status = 'accepted'
    )
);

CREATE POLICY "Users can create own activities"
ON activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON activities
FOR DELETE
USING (auth.uid() = user_id);

-- RLS for activity_likes
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
ON activity_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can add own likes"
ON activity_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON activity_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS for activity_comments
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
ON activity_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can add own comments"
ON activity_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON activity_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);

-- Enable Realtime
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table activity_likes;
alter publication supabase_realtime add table activity_comments;
