-- Create friendships table for friend requests and connections
create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  friend_id uuid references auth.users not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Enable RLS
alter table friendships enable row level security;

-- Users can view friendships where they are involved
create policy "Users can view their friendships" on friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can create friend requests (they must be the sender)
create policy "Users can create friend requests" on friendships
  for insert with check (auth.uid() = user_id);

-- Users can update friendships where they are involved
create policy "Users can update their friendships" on friendships
  for update using (auth.uid() = user_id or auth.uid() = friend_id);

---

-- Create messages table for chat
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table messages enable row level security;

-- Users can view messages they sent or received
create policy "Users can view their messages" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can send messages (they must be the sender)
create policy "Users can send messages" on messages
  for insert with check (auth.uid() = sender_id);

-- Users can update messages they received (for marking as read)
create policy "Users can update received messages" on messages
  for update using (auth.uid() = receiver_id);

-- Create index for faster message queries
create index if not exists messages_sender_receiver_idx on messages(sender_id, receiver_id, created_at desc);
create index if not exists messages_receiver_idx on messages(receiver_id, read);

-- Create index for faster friendship queries
create index if not exists friendships_user_id_idx on friendships(user_id, status);
create index if not exists friendships_friend_id_idx on friendships(friend_id, status);
