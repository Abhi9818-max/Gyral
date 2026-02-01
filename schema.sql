-- 1. TASKS (Habits)
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text,
  metric_config jsonb,
  is_archived boolean default false,
  created_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "Users can CRUD their own tasks" on tasks
  for all using (auth.uid() = user_id);

-- 2. RECORDS (Logs)
create table records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  task_id uuid references tasks(id) on delete cascade not null,
  date date not null,
  intensity smallint,
  value numeric,
  timestamp timestamptz default now(),
  unique(user_id, task_id, date, timestamp) -- loosely unique
);
alter table records enable row level security;
create policy "Users can CRUD their own records" on records
  for all using (auth.uid() = user_id);

-- 3. PACTS (Todos)
create table pacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  text text not null,
  date date not null,
  is_completed boolean default false,
  created_at timestamptz default now()
);
alter table pacts enable row level security;
create policy "Users can CRUD their own pacts" on pacts
  for all using (auth.uid() = user_id);

-- 4. NOTES
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  updated_at timestamptz default now()
);
alter table notes enable row level security;
create policy "Users can CRUD their own notes" on notes
  for all using (auth.uid() = user_id);

-- 5. SETTINGS (Memento Mori Birthdate)
create table user_settings (
  user_id uuid references auth.users primary key,
  birth_date date,
  last_audit_date date,
  show_stats_card boolean default true,
  theme text default 'dark',
  language text default 'en'
);
alter table user_settings enable row level security;
create policy "Users can CRUD their own settings" on user_settings
  for all using (auth.uid() = user_id);

-- 6. THE NIGHT'S WATCH (Vows)
create table vows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  text text not null,
  status text default 'active', -- 'active', 'broken', 'archived'
  current_streak integer default 0,
  max_streak integer default 0,
  last_completed_date date,
  start_date timestamptz default now(),
  broken_on timestamptz,
  created_at timestamptz default now()
);
alter table vows enable row level security;
create policy "Users can CRUD their own vows" on vows
  for all using (auth.uid() = user_id);

-- 7. PROFILES (Public User Info)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Function to sync user_metadata to profiles table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, bio)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'bio'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users to create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. STORIES (Ephemeral Content)
create table stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content_text text,
  media_url text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);
alter table stories enable row level security;
create policy "Users can CRUD their own stories" on stories
  for all using (auth.uid() = user_id);
create policy "Users can view all valid stories" on stories
  for select using (expires_at > now());

-- 9. STORY VIEWS (Analytics)
create table story_views (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references stories(id) on delete cascade not null,
  viewer_id uuid references auth.users not null,
  viewed_at timestamptz default now(),
  unique(story_id, viewer_id)
);
alter table story_views enable row level security;
create policy "Users can insert their own views" on story_views
  for insert with check (auth.uid() = viewer_id);
create policy "Users can view views of their stories" on story_views
  for select using (
    exists (
      select 1 from stories
      where stories.id = story_id
      and stories.user_id = auth.uid()
    )
  );
