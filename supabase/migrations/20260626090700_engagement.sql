-- ============================================================================
-- 20260626090700_engagement
-- Notifications and the achievement system.
-- ============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        public.notification_type not null,
  actor_id    uuid references public.profiles (id) on delete set null,
  entity_type text,
  entity_id   uuid,
  data        jsonb not null default '{}'::jsonb,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null check (char_length(name) between 1 and 80),
  description text not null check (char_length(description) <= 280),
  icon        text,
  points      integer not null default 0 check (points >= 0),
  criteria    jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.user_achievements (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create index user_achievements_user_idx on public.user_achievements (user_id);

-- Row Level Security --------------------------------------------------------
alter table public.notifications     enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- Notifications: recipients read and mark their own; an actor may create a
-- notification addressed to another user (e.g. on follow/comment).
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() = actor_id or public.is_moderator());
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- Achievement catalog: public to read, admin-curated.
create policy "achievements_select_all" on public.achievements for select using (true);
create policy "achievements_admin_write" on public.achievements
  for all using (public.is_admin()) with check (public.is_admin());

-- Earned achievements: public (profile badges); awarded by admin/server logic.
create policy "user_achievements_select_all" on public.user_achievements
  for select using (true);
create policy "user_achievements_admin_write" on public.user_achievements
  for all using (public.is_admin()) with check (public.is_admin());
