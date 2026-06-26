-- ============================================================================
-- 20260626090400_taxonomy
-- Discovery taxonomy: curated categories and free-form tags.
-- ============================================================================

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         citext not null unique,
  name         text not null check (char_length(name) between 1 and 60),
  description  text check (char_length(description) <= 280),
  icon         text,
  color        text check (color is null or color ~* '^#[0-9a-f]{6}$'),
  position     integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index categories_active_idx on public.categories (is_active, position);

create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null check (char_length(name) between 1 and 40),
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at  timestamptz not null default now()
);
create index tags_usage_idx on public.tags (usage_count desc);

create table public.game_categories (
  game_id     uuid not null references public.games (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (game_id, category_id)
);
create index game_categories_category_idx on public.game_categories (category_id);

create table public.game_tags (
  game_id  uuid not null references public.games (id) on delete cascade,
  tag_id   uuid not null references public.tags (id) on delete cascade,
  primary key (game_id, tag_id)
);
create index game_tags_tag_idx on public.game_tags (tag_id);

-- Row Level Security --------------------------------------------------------
alter table public.categories      enable row level security;
alter table public.tags            enable row level security;
alter table public.game_categories enable row level security;
alter table public.game_tags       enable row level security;

-- Curated taxonomy: anyone reads, only admins curate categories.
create policy "categories_select_all" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Tags: anyone reads; any authenticated user may create a tag; admins manage.
create policy "tags_select_all" on public.tags for select using (true);
create policy "tags_insert_auth" on public.tags
  for insert with check (auth.uid() is not null);
create policy "tags_admin_write" on public.tags
  for all using (public.is_admin()) with check (public.is_admin());

-- Join tables follow the parent game's visibility / edit rights.
create policy "game_categories_select" on public.game_categories
  for select using (public.can_view_game(game_id));
create policy "game_categories_write" on public.game_categories
  for all using (public.can_edit_game(game_id)) with check (public.can_edit_game(game_id));

create policy "game_tags_select" on public.game_tags
  for select using (public.can_view_game(game_id));
create policy "game_tags_write" on public.game_tags
  for all using (public.can_edit_game(game_id)) with check (public.can_edit_game(game_id));
