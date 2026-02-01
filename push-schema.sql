-- Create table for storing push subscriptions
create table public.push_subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid references auth.users not null,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null,
  constraint push_subscriptions_pkey primary key (id)
);

-- RLS Policies
alter table public.push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
on public.push_subscriptions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own subscriptions"
on public.push_subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can delete their own subscriptions"
on public.push_subscriptions for delete
to authenticated
using ((select auth.uid()) = user_id);
