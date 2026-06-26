-- ============================================================================
-- 20260626097000_game_scores
-- Stores each player's best score per game, powering the leaderboard.
-- Public to read; written only via the service role (no write policy), since
-- the play flow records scores server-side after authenticating the user.
-- ============================================================================

create table if not exists public.game_scores (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  best_score integer not null default 0,
  plays      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists game_scores_best_idx on public.game_scores (best_score desc);
create index if not exists game_scores_game_idx on public.game_scores (game_id, best_score desc);

alter table public.game_scores enable row level security;

create policy "game_scores_select_all" on public.game_scores for select using (true);
