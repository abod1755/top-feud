-- ============================================================================
-- 20260626090600_play_sessions
-- Hosted, realtime play: sessions, players, scores and an event log.
-- ============================================================================

create table public.game_sessions (
  id                  uuid primary key default gen_random_uuid(),
  host_id             uuid not null references public.profiles (id) on delete cascade,
  game_id             uuid references public.games (id) on delete set null,
  code                text not null unique check (code ~ '^[A-Z0-9]{4,8}$'),
  status              public.session_status not null default 'lobby',
  current_round_id    uuid references public.rounds (id) on delete set null,
  current_question_id uuid references public.questions (id) on delete set null,
  settings            jsonb not null default '{}'::jsonb,
  started_at          timestamptz,
  ended_at            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index game_sessions_host_idx   on public.game_sessions (host_id, created_at desc);
create index game_sessions_game_idx   on public.game_sessions (game_id);
create index game_sessions_status_idx on public.game_sessions (status);

create trigger game_sessions_set_updated_at before update on public.game_sessions
  for each row execute function public.set_updated_at();

create table public.session_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.game_sessions (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  team         smallint not null default 1 check (team between 1 and 8),
  display_name text not null check (char_length(display_name) between 1 and 40),
  score        integer not null default 0,
  is_active    boolean not null default true,
  joined_at    timestamptz not null default now()
);
create unique index session_players_unique_user
  on public.session_players (session_id, user_id) where user_id is not null;
create index session_players_session_idx on public.session_players (session_id);

create table public.session_scores (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  team       smallint not null check (team between 1 and 8),
  round_id   uuid references public.rounds (id) on delete set null,
  points     integer not null default 0,
  created_at timestamptz not null default now()
);
create index session_scores_session_idx on public.session_scores (session_id);

create table public.session_events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  type       text not null check (char_length(type) between 1 and 50),
  payload    jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index session_events_session_idx on public.session_events (session_id, created_at);

-- Helpers -------------------------------------------------------------------
create or replace function public.is_session_host(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.game_sessions s where s.id = sid and s.host_id = auth.uid());
$$;

create or replace function public.is_session_member(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_session_host(sid) or exists (
    select 1 from public.session_players p where p.session_id = sid and p.user_id = auth.uid()
  );
$$;

-- Row Level Security --------------------------------------------------------
alter table public.game_sessions   enable row level security;
alter table public.session_players enable row level security;
alter table public.session_scores  enable row level security;
alter table public.session_events  enable row level security;

-- Sessions are joinable by code, so reads are open; only the host mutates the
-- session row itself.
create policy "sessions_select_all" on public.game_sessions for select using (true);
create policy "sessions_insert_host" on public.game_sessions
  for insert with check (auth.uid() = host_id);
create policy "sessions_update_host" on public.game_sessions
  for update using (auth.uid() = host_id or public.is_admin())
  with check (auth.uid() = host_id or public.is_admin());
create policy "sessions_delete_host" on public.game_sessions
  for delete using (auth.uid() = host_id or public.is_admin());

-- Players: readable in-session; a user may add/update/remove themselves, and
-- the host may manage any player (kick, assign team, score).
create policy "players_select_all" on public.session_players for select using (true);
create policy "players_insert" on public.session_players
  for insert with check (auth.uid() = user_id or public.is_session_host(session_id));
create policy "players_update" on public.session_players
  for update using (auth.uid() = user_id or public.is_session_host(session_id))
  with check (auth.uid() = user_id or public.is_session_host(session_id));
create policy "players_delete" on public.session_players
  for delete using (auth.uid() = user_id or public.is_session_host(session_id));

-- Scores: readable in-session; only the host writes authoritative scores.
create policy "scores_select_all" on public.session_scores for select using (true);
create policy "scores_host_write" on public.session_scores
  for all using (public.is_session_host(session_id)) with check (public.is_session_host(session_id));

-- Events: readable in-session; host or members can emit events.
create policy "events_select_all" on public.session_events for select using (true);
create policy "events_insert_member" on public.session_events
  for insert with check (public.is_session_member(session_id));
