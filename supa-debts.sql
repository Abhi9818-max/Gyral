
-- Create Debts table
create table public.debts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  description text not null,
  amount text not null,
  interest_rate text null,
  status text not null default 'OWED', -- 'OWED' | 'PAID'
  created_at timestamp with time zone not null default now(),
  constraint debts_pkey primary key (id),
  constraint debts_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Enable RLS
alter table public.debts enable row level security;

-- Policies
create policy "Users can view their own debts" on debts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own debts" on debts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own debts" on debts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own debts" on debts
  for delete using (auth.uid() = user_id);
