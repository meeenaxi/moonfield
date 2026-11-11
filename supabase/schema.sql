-- Run this in Supabase: SQL Editor > New query > Run.
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  business    text check (char_length(business) <= 200),
  contact     text not null check (char_length(contact) between 3 and 200),
  message     text check (char_length(message) <= 2000),
  source      text check (char_length(source) <= 300)
);

alter table public.leads enable row level security;

-- Visitors (anon key) can add a lead but can never read, change or delete any.
drop policy if exists "anyone can submit a lead" on public.leads;
create policy "anyone can submit a lead"
  on public.leads for insert
  to anon
  with check (true);

-- No select/update/delete policies exist, so only you (dashboard / service role) can read leads.
