-- Enable Realtime for messages table
alter publication supabase_realtime add table messages;

-- Enable Realtime for friendships table (for friend request notifications)
alter publication supabase_realtime add table friendships;
