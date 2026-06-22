
-- Supabase SQL Patch: Update public.life_events Table Constraints and RLS Policies
-- Execute this script in your Supabase SQL Editor to allow BUCKET_LIFE and BUCKET_YEAR event types.

-- 1. Check if check constraints exist and modify them if necessary
-- Typically if there is a constraint restricting type:
ALTER TABLE public.life_events 
  DROP CONSTRAINT IF EXISTS life_events_type_check;

ALTER TABLE public.life_events 
  ADD CONSTRAINT life_events_type_check 
  CHECK (type IN ('MEMORY', 'GOAL', 'BUCKET_LIFE', 'BUCKET_YEAR'));

-- 2. Drop existing insert policies that might restrict column values
DROP POLICY IF EXISTS "Users can insert their own life events" ON public.life_events;
DROP POLICY IF EXISTS "Users can insert own life events" ON public.life_events;
DROP POLICY IF EXISTS "Users can CRUD their own life events" ON public.life_events;
DROP POLICY IF EXISTS "Insert life_events policy" ON public.life_events;

-- 3. Recreate policies to ensure general access for authenticated users
CREATE POLICY "Users can insert their own life events" ON public.life_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own life events" ON public.life_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own life events" ON public.life_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life events" ON public.life_events
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable Realtime if not enabled (optional but helpful)
ALTER PUBLICATION supabase_realtime ADD TABLE public.life_events;
