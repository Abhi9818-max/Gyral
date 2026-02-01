-- Additional RLS policies for public profile viewing

-- Allow anyone to view other users' records (for public profiles)
create policy "Public can view all records" on records
  for select using (true);

-- Allow anyone to view other users' tasks (for public profiles)
create policy "Public can view all tasks" on tasks
  for select using (true);

-- Note: Users can still only CREATE/UPDATE/DELETE their own records and tasks
-- The existing "Users can CRUD their own records/tasks" policy handles that
