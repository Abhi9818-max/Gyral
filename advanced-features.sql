
-- 1. EXILE MODE (Beyond the Wall)
alter table user_settings 
add column if not exists is_exiled boolean default false,
add column if not exists exiled_until timestamptz;

-- 2. FACTIONS (Houses)
create table if not exists factions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  sigil_url text,
  primary_color text default '#ffffff',
  banner_style text,
  quote text,
  created_at timestamptz default now()
);

-- Seed Factions
insert into factions (name, sigil_url, primary_color, quote)
values 
('House Stark', '/factions/stark.jpg', '#94a3b8', 'Winter is Coming.'),
('House Lannister', '/factions/lannister.jpg', '#dc2626', 'Hear Me Roar!'),
('House Targaryen', '/factions/targaryen.jpg', '#991b1b', 'Fire and Blood.'),
('House Baratheon', '/factions/baratheon.jpg', '#eab308', 'Ours is the Fury.'),
('House Tyrell', '/factions/tyrell.jpg', '#16a34a', 'Growing Strong.'),
('House Martell', '/factions/martell.jpg', '#ea580c', 'Unbowed, Unbent, Unbroken.'),
('House Greyjoy', '/factions/greyjoy.jpg', '#0f172a', 'We Do Not Sow.'),
('House Arryn', '/factions/arryn.jpg', '#38bdf8', 'As High as Honor.'),
('House Mormont', '/factions/mormont.jpg', '#14532d', 'Here We Stand.'),
('House Tully', '/factions/tully.jpg', '#2563eb', 'Family, Duty, Honor.'),
('House Bolton', '/factions/bolton.jpg', '#450a0a', 'Our Blades Are Sharp.')
on conflict (name) do update set sigil_url = excluded.sigil_url;

-- Add Faction to Profile
alter table profiles
add column if not exists faction_id uuid references factions(id);

-- 3. USER ONBOARDING
alter table profiles
add column if not exists date_of_birth date,
add column if not exists gender text check (gender in ('male', 'female', 'other')),
add column if not exists onboarding_completed boolean default false;

-- 3. IRON BANK INVESTMENTS
create table if not exists investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount text not null, -- amount/type of collateral (e.g., '10 Iron Bricks' or 'Streak')
  goal text not null, -- e.g., '5 hours of focus'
  deadline timestamptz not null,
  status text default 'pending', -- 'pending', 'completed', 'failed'
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table investments enable row level security;
do $$
begin
    if not exists (
        select 1 
        from pg_policy 
        where polname = 'Users can CRUD their own investments'
    ) then
        create policy "Users can CRUD their own investments" on investments
          for all using (auth.uid() = user_id);
    end if;
end $$;

-- 4. ACTIVITY POINTS (For Faction Leaderboards)
-- We'll use records and stories count, but adding a materialized view or trigger can help.
-- For now, we'll calculate on the fly or add a points column to profiles.
alter table profiles
add column if not exists activity_points integer default 0;

-- 5. FACTIONS RLS (Read-only for users)
alter table factions enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policy where polname = 'Authenticated users can view factions'
    ) then
        create policy "Authenticated users can view factions" on factions
          for select using (auth.role() = 'authenticated');
    end if;
end $$;

-- 6. MOBILE NAVIGATION PREFERENCES
alter table profiles
add column if not exists navigation_preferences jsonb default '["world", "ritual", "bank"]';
