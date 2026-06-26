# Supabase setup

The database is defined as ordered migrations in [`migrations/`](./migrations) plus
[`seed.sql`](./seed.sql). 25 tables, all with Row Level Security.

## Apply the schema

### Local (Supabase CLI + Docker)

```bash
supabase start
supabase db reset      # drops, replays every migration, then runs seed.sql
```

### Remote / hosted project

```bash
supabase link --project-ref <your-ref>
supabase db push       # applies pending migrations
```

> The previous prototype created `profiles` and `game_sessions` from the old
> `schema.sql`. Because this is pre-launch with no production data, the cleanest
> path on the hosted project is to reset the public schema and apply the
> migrations fresh. If you prefer to keep the project, drop the old `profiles`
> and `game_sessions` tables (and the `on_auth_user_created` trigger) first, then
> `supabase db push`.

## Seed the sample content

`seed.sql` runs automatically on `supabase db reset`. To run it manually against a
remote DB, paste it into the SQL editor. It creates two demo creators and two
complete, published Arabic Family Feud games.

## Promote yourself to admin

Admin access is driven solely by `profiles.role` (there is no hardcoded email in
the app). After you have signed up, run once in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
```

## Storage (used from Milestone 4)

Create a public bucket named `game-media` for question images, audio and video.
RLS on `media_assets` already restricts who can attach assets to a game.

## Regenerating TypeScript types

After any schema change, regenerate the typed client:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

## Migration list

| Order | File | Purpose |
|------:|------|---------|
| 1 | `…090100_init_extensions_enums` | extensions, enum types, helper functions |
| 2 | `…090200_profiles_social` | profiles, followers, new-user trigger, auth helpers |
| 3 | `…090300_games_catalog` | games, versions, rounds, questions, answers, media |
| 4 | `…090400_taxonomy` | categories, tags + join tables |
| 5 | `…090500_collaboration_community` | collaborators, favorites, ratings, comments, reports |
| 6 | `…090600_play_sessions` | sessions, players, scores, events |
| 7 | `…090700_engagement` | notifications, achievements |
| 8 | `…090800_audit` | audit_logs |
| 9 | `…090900_counters_triggers` | denormalized counter triggers |
