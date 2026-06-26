-- ============================================================================
-- 20260626090100_init_extensions_enums
-- Foundational extensions, enum types, and shared helper functions.
-- Everything else in the schema depends on this migration.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- case-insensitive handles/emails
create extension if not exists "pg_trgm";     -- trigram search for discovery

-- Enum types ----------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('player', 'creator', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.game_status as enum ('draft', 'in_review', 'published', 'unlisted', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.game_visibility as enum ('public', 'unlisted', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.difficulty as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.collaborator_role as enum ('viewer', 'editor', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('image', 'audio', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_target as enum ('game', 'comment', 'profile');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('lobby', 'active', 'paused', 'finished', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'follow', 'comment', 'rating', 'favorite', 'game_published',
    'game_featured', 'achievement', 'report_update', 'system'
  );
exception when duplicate_object then null; end $$;

-- Shared helper functions ---------------------------------------------------

-- Keeps an `updated_at` column fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- NOTE: is_admin() / is_moderator() depend on the profiles table and are
-- therefore defined in the profiles migration (20260626090200).

-- Slugify arbitrary text into a URL-safe, lowercase, hyphenated slug.
-- Preserves Arabic letters (kept as-is) while stripping punctuation.
create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(value, '')), '[^a-z0-9؀-ۿ]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;
