-- ============================================================================
-- 20260626090300_games_catalog
-- The heart of the platform: games and their rounds / questions / answers,
-- immutable publish snapshots, and media assets.
-- ============================================================================

create table public.games (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid not null references public.profiles (id) on delete cascade,
  slug              citext not null unique,
  title             text not null check (char_length(title) between 2 and 120),
  tagline           text check (char_length(tagline) <= 160),
  description       text check (char_length(description) <= 4000),
  status            public.game_status not null default 'draft',
  visibility        public.game_visibility not null default 'public',
  difficulty        public.difficulty not null default 'medium',
  language          text not null default 'ar' check (char_length(language) between 2 and 8),
  cover_image_url   text,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 600),
  rounds_count      integer not null default 0 check (rounds_count >= 0),
  questions_count   integer not null default 0 check (questions_count >= 0),
  play_count        integer not null default 0 check (play_count >= 0),
  favorites_count   integer not null default 0 check (favorites_count >= 0),
  comments_count    integer not null default 0 check (comments_count >= 0),
  rating_avg        numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  rating_count      integer not null default 0 check (rating_count >= 0),
  is_featured       boolean not null default false,
  featured_at       timestamptz,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index games_creator_idx     on public.games (creator_id);
create index games_status_vis_idx  on public.games (status, visibility);
create index games_featured_idx    on public.games (is_featured) where is_featured;
create index games_published_idx   on public.games (published_at desc nulls last);
create index games_rating_idx      on public.games (rating_avg desc, rating_count desc);
create index games_play_count_idx  on public.games (play_count desc);
-- Trigram index for fuzzy title search (pg_trgm; available on Supabase).
create index games_title_trgm_idx  on public.games using gin (title gin_trgm_ops);

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- Immutable snapshots taken at publish time, enabling version history and safe
-- rollback without affecting an in-progress edit of the live draft.
create table public.game_versions (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references public.games (id) on delete cascade,
  version_number  integer not null check (version_number >= 1),
  snapshot        jsonb not null,
  note            text check (char_length(note) <= 280),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (game_id, version_number)
);
create index game_versions_game_idx on public.game_versions (game_id, version_number desc);

-- Points to the version currently treated as "published" (nullable, circular).
alter table public.games
  add column current_version_id uuid references public.game_versions (id) on delete set null;

create table public.rounds (
  id                  uuid primary key default gen_random_uuid(),
  game_id             uuid not null references public.games (id) on delete cascade,
  position            integer not null check (position >= 1),
  title               text not null check (char_length(title) between 1 and 120),
  intro_text          text check (char_length(intro_text) <= 500),
  time_limit_seconds  integer check (time_limit_seconds is null or time_limit_seconds between 5 and 600),
  points_multiplier   integer not null default 1 check (points_multiplier between 1 and 5),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (game_id, position)
);
create index rounds_game_idx on public.rounds (game_id, position);
create trigger rounds_set_updated_at before update on public.rounds
  for each row execute function public.set_updated_at();

create table public.questions (
  id                  uuid primary key default gen_random_uuid(),
  round_id            uuid not null references public.rounds (id) on delete cascade,
  position            integer not null check (position >= 1),
  prompt              text not null check (char_length(prompt) between 1 and 300),
  time_limit_seconds  integer check (time_limit_seconds is null or time_limit_seconds between 5 and 600),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (round_id, position)
);
create index questions_round_idx on public.questions (round_id, position);
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  position    integer not null check (position between 1 and 12),
  text        text not null check (char_length(text) between 1 and 120),
  points      integer not null check (points between 0 and 100),
  created_at  timestamptz not null default now(),
  unique (question_id, position)
);
create index answers_question_idx on public.answers (question_id, position);

create table public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  game_id       uuid references public.games (id) on delete cascade,
  question_id   uuid references public.questions (id) on delete set null,
  kind          public.media_kind not null,
  storage_path  text not null,
  public_url    text,
  mime_type     text,
  bytes         bigint check (bytes is null or bytes >= 0),
  created_at    timestamptz not null default now()
);
create index media_assets_owner_idx on public.media_assets (owner_id);
create index media_assets_game_idx  on public.media_assets (game_id);

-- Visibility / edit helpers (SECURITY DEFINER => bypass RLS, no recursion) ---
create or replace function public.can_view_game(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.games g
    where g.id = gid
      and (
        (g.status = 'published' and g.visibility in ('public','unlisted'))
        or g.creator_id = auth.uid()
        or public.is_moderator()
      )
  );
$$;

-- Extended in the collaboration migration to also allow editor collaborators.
create or replace function public.can_edit_game(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.games g where g.id = gid and g.creator_id = auth.uid()
  );
$$;

-- Row Level Security --------------------------------------------------------
alter table public.games         enable row level security;
alter table public.game_versions enable row level security;
alter table public.rounds        enable row level security;
alter table public.questions     enable row level security;
alter table public.answers       enable row level security;
alter table public.media_assets  enable row level security;

-- games
create policy "games_select_visible" on public.games
  for select using (public.can_view_game(id));
create policy "games_insert_own" on public.games
  for insert with check (auth.uid() = creator_id);
create policy "games_update_editable" on public.games
  for update using (public.can_edit_game(id)) with check (public.can_edit_game(id));
create policy "games_delete_owner_admin" on public.games
  for delete using (auth.uid() = creator_id or public.is_admin());

-- game_versions (read if game visible; write if game editable)
create policy "game_versions_select" on public.game_versions
  for select using (public.can_view_game(game_id));
create policy "game_versions_write" on public.game_versions
  for all using (public.can_edit_game(game_id)) with check (public.can_edit_game(game_id));

-- rounds / questions / answers inherit from their game
create policy "rounds_select" on public.rounds
  for select using (public.can_view_game(game_id));
create policy "rounds_write" on public.rounds
  for all using (public.can_edit_game(game_id)) with check (public.can_edit_game(game_id));

create policy "questions_select" on public.questions
  for select using (public.can_view_game((select r.game_id from public.rounds r where r.id = round_id)));
create policy "questions_write" on public.questions
  for all using (public.can_edit_game((select r.game_id from public.rounds r where r.id = round_id)))
  with check (public.can_edit_game((select r.game_id from public.rounds r where r.id = round_id)));

create policy "answers_select" on public.answers
  for select using (public.can_view_game(
    (select r.game_id from public.rounds r join public.questions q on q.round_id = r.id where q.id = question_id)));
create policy "answers_write" on public.answers
  for all using (public.can_edit_game(
    (select r.game_id from public.rounds r join public.questions q on q.round_id = r.id where q.id = question_id)))
  with check (public.can_edit_game(
    (select r.game_id from public.rounds r join public.questions q on q.round_id = r.id where q.id = question_id)));

-- media assets: owner or game editor
create policy "media_select" on public.media_assets
  for select using (
    owner_id = auth.uid()
    or (game_id is not null and public.can_view_game(game_id))
  );
create policy "media_write" on public.media_assets
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid());
