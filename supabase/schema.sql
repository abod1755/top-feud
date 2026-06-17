create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active',
  current_round integer not null default 1,
  total_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;

create policy "profiles are readable by owner" on public.profiles
for select using (auth.uid() = id);

create policy "profiles are insertable by owner" on public.profiles
for insert with check (auth.uid() = id);

create policy "sessions are readable by owner" on public.game_sessions
for select using (auth.uid() = owner_id);

create policy "sessions are insertable by owner" on public.game_sessions
for insert with check (auth.uid() = owner_id);

create policy "sessions are updatable by owner" on public.game_sessions
for update using (auth.uid() = owner_id);
