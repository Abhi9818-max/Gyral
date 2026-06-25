-- House & Westeros Chat Rooms Schema

CREATE TABLE IF NOT EXISTS house_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room TEXT NOT NULL, -- 'westeros' or faction names / faction_ids (e.g. 'house-stark')
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE house_chats ENABLE ROW LEVEL SECURITY;

-- Allow select to authenticated users
CREATE POLICY "Anyone can view house chats" ON house_chats
    FOR SELECT USING (true);

-- Allow insert to authenticated users
CREATE POLICY "Users can insert house chats" ON house_chats
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable Realtime
alter publication supabase_realtime add table house_chats;
