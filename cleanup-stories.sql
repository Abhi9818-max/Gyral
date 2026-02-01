-- Automatic Story Cleanup Function
-- This function deletes stories that have expired (older than 24 hours)
-- It also attempts to delete the associated media files from storage

-- Create the cleanup function
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_story RECORD;
  storage_path TEXT;
BEGIN
  -- Loop through all expired stories
  FOR expired_story IN 
    SELECT id, media_url 
    FROM stories 
    WHERE expires_at < NOW()
  LOOP
    -- If story has media, try to delete from storage
    IF expired_story.media_url IS NOT NULL THEN
      -- Extract filename from URL (assuming format: .../stories-media/filename)
      storage_path := substring(expired_story.media_url from '([^/]+)$');
      
      -- Delete from storage bucket (using Supabase storage.delete)
      -- Note: This requires the pg_net extension or http extension
      -- For now, we'll log and rely on storage lifecycle policies
      RAISE NOTICE 'Story media to delete: %', storage_path;
    END IF;
    
    -- Delete the story record (cascade will delete views too)
    DELETE FROM stories WHERE id = expired_story.id;
  END LOOP;
END;
$$;

-- Create a scheduled job to run cleanup every hour
-- Note: This requires pg_cron extension to be enabled in your Supabase project
-- Go to Database > Extensions and enable pg_cron

-- First, ensure pg_cron schema is in search path
SELECT cron.schedule(
  'delete-expired-stories',           -- job name
  '0 * * * *',                        -- every hour at minute 0
  $$SELECT delete_expired_stories();$$ -- SQL to execute
);

-- Alternative: If pg_cron is not available, you can call this function from your app
-- or use Supabase Edge Functions to run it periodically
