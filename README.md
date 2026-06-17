# Top Feud

Arabic Family Feud-style game built with Next.js and Supabase.

## What this starter includes

- Email/password authentication
- Protected dashboard for logged-in users only
- Admin-only page for question bank management
- Game session creation backed by Postgres
- Session detail page
- Supabase RLS schema

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable email/password auth.
4. Set one profile's `role` to `admin` in the `profiles` table for the admin account.
5. Add the auth redirect URLs for your deployment domain.

## Run locally

```bash
npm install
npm run dev
```

## Notes

- Users must sign in before creating a game session.
- Each session is stored in `public.game_sessions`.
- RLS policies limit session access to the owner.
- Admin features are protected by the `profiles.role` field.
