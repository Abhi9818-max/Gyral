-- Chat Enhancements Schema Migration
-- 1. Add image_url column to house_chats and make content optional, set replica identity
ALTER TABLE house_chats ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE house_chats ALTER COLUMN content DROP NOT NULL;
ALTER TABLE house_chats REPLICA IDENTITY FULL;

-- 2. Create the 'chat-media' bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public access to view images
DROP POLICY IF EXISTS "Chat media are publicly accessible." ON storage.objects;
CREATE POLICY "Chat media are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'chat-media' );

-- 4. Allow authenticated users to upload images
DROP POLICY IF EXISTS "Anyone can upload chat media." ON storage.objects;
CREATE POLICY "Anyone can upload chat media."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'chat-media' AND auth.role() = 'authenticated' );

-- 5. Delete old messages trigger function when count > 50 or older than 5 hours
CREATE OR REPLACE FUNCTION clean_old_house_chats()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete messages older than 5 hours in the active room
    DELETE FROM house_chats
    WHERE room = NEW.room
      AND created_at < NOW() - INTERVAL '5 hours';

    -- Keep only the latest 50 messages in the active room
    DELETE FROM house_chats
    WHERE id IN (
        SELECT id FROM house_chats
        WHERE room = NEW.room
        ORDER BY created_at DESC
        OFFSET 50
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Bind the trigger to house_chats
DROP TRIGGER IF EXISTS tr_clean_old_house_chats ON house_chats;
CREATE TRIGGER tr_clean_old_house_chats
AFTER INSERT ON house_chats
FOR EACH ROW
EXECUTE FUNCTION clean_old_house_chats();

-- 7. Add index for performance on room queries
CREATE INDEX IF NOT EXISTS idx_house_chats_room_created_at ON house_chats(room, created_at DESC);
