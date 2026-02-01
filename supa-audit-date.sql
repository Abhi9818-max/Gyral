
-- Add last_audit_date to user_settings
alter table public.user_settings 
add column if not exists last_audit_date date default (now() - interval '1 day');
