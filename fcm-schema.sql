-- Create table for storing FCM registration tokens
create table if not exists public.fcm_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    token text not null,
    platform text not null check (platform in ('web', 'android', 'ios')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    unique(user_id, token)
);

-- Enable RLS
alter table public.fcm_tokens enable row level security;

-- Policies
create policy "Users can view own FCM tokens"
    on public.fcm_tokens for select
    using (auth.uid() = user_id);

create policy "Users can insert own FCM tokens"
    on public.fcm_tokens for insert
    with check (auth.uid() = user_id);

create policy "Users can update own FCM tokens"
    on public.fcm_tokens for update
    using (auth.uid() = user_id);

create policy "Users can delete own FCM tokens"
    on public.fcm_tokens for delete
    using (auth.uid() = user_id);
