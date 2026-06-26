-- ============================================================================
-- 20260626090200_profiles_social
-- Public creator/player profiles and the follower graph.
-- ============================================================================

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  handle            citext not null unique,
  display_name      text not null check (char_length(display_name) between 1 and 60),
  bio               text check (char_length(bio) <= 280),
  avatar_url        text,
  banner_url        text,
  role              public.user_role not null default 'player',
  location          text check (char_length(location) <= 80),
  website           text check (website is null or website ~* '^https?://'),
  is_verified       boolean not null default false,
  followers_count   integer not null default 0 check (followers_count >= 0),
  following_count   integer not null default 0 check (following_count >= 0),
  games_count       integer not null default 0 check (games_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Authorization helpers (depend on profiles, hence defined here) -------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'));
$$;

-- Auto-provision a profile when a new auth user is created. The handle is
-- derived from the email local-part and made unique with a short random suffix
-- on collision.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_handle text;
  candidate   text;
  suffix      text;
begin
  base_handle := nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), '');
  base_handle := coalesce(base_handle, 'user');
  base_handle := left(base_handle, 24);
  if char_length(base_handle) < 3 then
    base_handle := base_handle || 'usr';
  end if;

  candidate := base_handle;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := substr(md5(random()::text), 1, 4);
    candidate := left(base_handle, 24) || '_' || suffix;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    candidate,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Follower graph ------------------------------------------------------------
create table public.followers (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint followers_no_self check (follower_id <> following_id)
);

create index followers_following_idx on public.followers (following_id);

-- Row Level Security --------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.followers enable row level security;

-- Profiles are public to read; a user may only insert/update their own row and
-- may never escalate their own role (role changes are admin-only, enforced by
-- the separate admin policy below).
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Follows are public to read; users manage only their own follows.
create policy "followers_select_all" on public.followers
  for select using (true);

create policy "followers_insert_self" on public.followers
  for insert with check (auth.uid() = follower_id);

create policy "followers_delete_self" on public.followers
  for delete using (auth.uid() = follower_id);
