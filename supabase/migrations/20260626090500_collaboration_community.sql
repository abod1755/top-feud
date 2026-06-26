-- ============================================================================
-- 20260626090500_collaboration_community
-- Co-editing, plus the social layer: favorites, ratings, comments, reports.
-- ============================================================================

-- Collaborators -------------------------------------------------------------
create table public.game_collaborators (
  game_id    uuid not null references public.games (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.collaborator_role not null default 'editor',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);
create index game_collaborators_user_idx on public.game_collaborators (user_id);

-- Now that collaborators exist, editor/owner collaborators may edit the game.
create or replace function public.can_edit_game(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or exists (select 1 from public.games g where g.id = gid and g.creator_id = auth.uid())
    or exists (
      select 1 from public.game_collaborators c
      where c.game_id = gid and c.user_id = auth.uid() and c.role in ('editor','owner')
    );
$$;

-- True when the caller owns the game (for managing collaborators).
create or replace function public.is_game_owner(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.games g where g.id = gid and g.creator_id = auth.uid()
  );
$$;

-- Favorites -----------------------------------------------------------------
create table public.game_favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
create index game_favorites_game_idx on public.game_favorites (game_id);

-- Ratings (one per user per game) -------------------------------------------
create table public.game_ratings (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  review     text check (char_length(review) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
create index game_ratings_game_idx on public.game_ratings (game_id);
create trigger game_ratings_set_updated_at before update on public.game_ratings
  for each row execute function public.set_updated_at();

-- Comments (threaded) -------------------------------------------------------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_game_idx   on public.comments (game_id, created_at desc);
create index comments_parent_idx on public.comments (parent_id);
create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- Reports -------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id   uuid not null,
  reason      text not null check (char_length(reason) between 1 and 120),
  details     text check (char_length(details) <= 2000),
  status      public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

-- Row Level Security --------------------------------------------------------
alter table public.game_collaborators enable row level security;
alter table public.game_favorites     enable row level security;
alter table public.game_ratings       enable row level security;
alter table public.comments           enable row level security;
alter table public.reports            enable row level security;

-- Collaborators: visible to game viewers and to the collaborator themselves;
-- only the owner/admin can add or remove collaborators.
create policy "collab_select" on public.game_collaborators
  for select using (user_id = auth.uid() or public.can_view_game(game_id));
create policy "collab_owner_write" on public.game_collaborators
  for all using (public.is_game_owner(game_id)) with check (public.is_game_owner(game_id));

-- Favorites: public to read (drives public profile lists); users manage own.
create policy "favorites_select_all" on public.game_favorites for select using (true);
create policy "favorites_insert_self" on public.game_favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_self" on public.game_favorites
  for delete using (auth.uid() = user_id);

-- Ratings: public to read; users manage their own single rating.
create policy "ratings_select_all" on public.game_ratings for select using (true);
create policy "ratings_upsert_self" on public.game_ratings
  for insert with check (auth.uid() = user_id);
create policy "ratings_update_self" on public.game_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ratings_delete_self" on public.game_ratings
  for delete using (auth.uid() = user_id or public.is_moderator());

-- Comments: visible on viewable games (hidden ones only to author/moderator);
-- authors manage their own; moderators can moderate.
create policy "comments_select" on public.comments
  for select using (
    public.can_view_game(game_id)
    and (not is_hidden or author_id = auth.uid() or public.is_moderator())
  );
create policy "comments_insert" on public.comments
  for insert with check (auth.uid() = author_id and public.can_view_game(game_id));
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id or public.is_moderator())
  with check (auth.uid() = author_id or public.is_moderator());
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id or public.is_moderator());

-- Reports: a user files and sees their own; moderators see and resolve all.
create policy "reports_insert_self" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "reports_select_own_or_mod" on public.reports
  for select using (auth.uid() = reporter_id or public.is_moderator());
create policy "reports_update_mod" on public.reports
  for update using (public.is_moderator()) with check (public.is_moderator());
