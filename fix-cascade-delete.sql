-- Run this script in your Supabase Dashboard SQL Editor to configure all tables to delete user data automatically
-- when a user is deleted from auth.users (ON DELETE CASCADE).

-- 1. Profiles Table
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. User Settings Table
ALTER TABLE public.user_settings 
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey,
  ADD CONSTRAINT user_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Tasks Table
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_user_id_fkey,
  ADD CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Records Table
ALTER TABLE public.records 
  DROP CONSTRAINT IF EXISTS records_user_id_fkey,
  ADD CONSTRAINT records_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Pacts Table
ALTER TABLE public.pacts 
  DROP CONSTRAINT IF EXISTS pacts_user_id_fkey,
  ADD CONSTRAINT pacts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Notes Table
ALTER TABLE public.notes 
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey,
  ADD CONSTRAINT notes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Vows Table
ALTER TABLE public.vows 
  DROP CONSTRAINT IF EXISTS vows_user_id_fkey,
  ADD CONSTRAINT vows_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Investments Table
ALTER TABLE public.investments 
  DROP CONSTRAINT IF EXISTS investments_user_id_fkey,
  ADD CONSTRAINT investments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9. Friendships Table
ALTER TABLE public.friendships 
  DROP CONSTRAINT IF EXISTS friendships_user_id_fkey,
  DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey,
  ADD CONSTRAINT friendships_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_friend_id_fkey 
    FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 10. Messages Table
ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 11. Push Subscriptions Table
ALTER TABLE public.push_subscriptions 
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey,
  ADD CONSTRAINT push_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 12. Stories Table
ALTER TABLE public.stories 
  DROP CONSTRAINT IF EXISTS stories_user_id_fkey,
  ADD CONSTRAINT stories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 13. Story Views Table
ALTER TABLE public.story_views 
  DROP CONSTRAINT IF EXISTS story_views_viewer_id_fkey,
  ADD CONSTRAINT story_views_viewer_id_fkey 
    FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
