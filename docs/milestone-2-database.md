# Milestone 2 — Database Foundation

Status: **complete & verified** against a real PostgreSQL 16 instance (full migration
chain + seed applied cleanly; RLS enforcement and counter triggers tested).

## What shipped

- **9 ordered migrations** in `supabase/migrations/` replacing the single-file prototype
  schema, plus `supabase/seed.sql` and `supabase/README.md`.
- **25 tables** across identity, catalog, taxonomy, collaboration, community, live play,
  engagement and security — see [`erd.md`](./erd.md) for the diagram and dictionary.
- **Row Level Security on every table**, driven by centralized `SECURITY DEFINER` helper
  functions (`is_admin`, `is_moderator`, `can_view_game`, `can_edit_game`, `is_game_owner`,
  `is_session_host`, `is_session_member`).
- **Denormalized counters** maintained by triggers (favorites, ratings avg/count, comments,
  followers/following, rounds/questions counts, tag usage, published-games count) plus
  automatic `updated_at` and publish-time `published_at` stamping.
- **Indexes** for discovery (status/visibility, featured, published_at, rating, play_count)
  and a `pg_trgm` GIN index for fuzzy title search.
- **Regenerated typed client** `lib/supabase/types.ts` (all 25 tables, enums, and
  `Tables<>/TablesInsert<>/TablesUpdate<>` helpers) and reconciled the prototype pages to the
  new `game_sessions` shape (host + join-code model).
- **Realistic seed**: two complete published Arabic Family Feud games (rounds, questions,
  answers with points), categories, tags, achievements, and sample favorite/rating.

## How it was verified

A real PostgreSQL 16 server (embedded, no Docker) was provisioned with Supabase `auth`
stubs (`auth.uid()` / `auth.users` / the new-user trigger target). The full migration chain
and seed were applied from a clean schema, then:

- ✅ all 9 migrations + `seed.sql` apply with zero errors
- ✅ 25/25 public tables have RLS enabled
- ✅ counters correct after seed (game 1 → 2 rounds / 4 questions / 1 favorite / rating 5.00;
  creator `games_count = 2`; tag usage tallied; 37 answers)
- ✅ RLS enforced as a non-superuser role:
  - anonymous sees only the 2 published games (a draft is hidden)
  - the creator sees their own draft (3 total)
  - a different user **cannot** edit the creator's game (0 rows affected) and `can_edit_game`
    returns `false`
- ✅ app still green: `tsc` 0 errors, ESLint 0 warnings, 6/6 unit tests

## Key decisions

1. **Versioned migrations over a single schema file.** Safe incremental deploys and a clear
   audit of schema history; the old `schema.sql` is now a deprecation pointer.
2. **`SECURITY DEFINER` helper functions for authz.** Policies stay readable and avoid
   recursive evaluation; the same predicate (`can_edit_game`) is reused by games and all their
   child tables, so the rule lives in one place.
3. **Counters via triggers, not on read.** Discovery/listing pages must be fast and
   paginated; precomputed counts keep them O(1).
4. **Immutable `game_versions`.** Enables safe publish + rollback and version history without
   coupling the live draft to what players see.
5. **Self-role-escalation is impossible.** The profiles update policy pins `role` to its
   current value, so privilege changes require an admin path.

## Applying it

See [`supabase/README.md`](../supabase/README.md): `supabase db reset` (local) or
`supabase db push` (remote), then the one-line admin bootstrap. **Vercel is unaffected** —
these are database migrations, not application code.
