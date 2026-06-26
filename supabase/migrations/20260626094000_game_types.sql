-- ============================================================================
-- 20260626094000_game_types
-- Turns the catalog into a multi-game-type platform ("لمّة"). Family Feud is
-- the first type; word_builder ("لعبة الحروف") is the second. The shared
-- catalog/social/session layer is unchanged — only games gain a type + a
-- flexible per-type `config` blob (e.g. word-game letters, durations, scoring).
-- ============================================================================

do $$ begin
  create type public.game_type as enum ('family_feud', 'word_builder');
exception when duplicate_object then null; end $$;

alter table public.games add column if not exists game_type public.game_type not null default 'family_feud';
alter table public.games add column if not exists config jsonb not null default '{}'::jsonb;

create index if not exists games_type_idx on public.games (game_type, status);
