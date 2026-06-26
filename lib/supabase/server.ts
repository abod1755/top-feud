import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Creates a request-scoped Supabase client for Server Components, Server Actions
 * and Route Handlers.
 *
 * In Next.js 15 `cookies()` is async, so this factory is async too. We use the
 * `getAll`/`setAll` cookie interface (the current @supabase/ssr contract).
 * Writing cookies from a Server Component throws by design in Next.js; the
 * try/catch swallows that case because session refresh is handled in
 * `middleware.ts`, where writing cookies is allowed.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore, middleware refreshes.
          }
        },
      },
    },
  );
}

/**
 * Returns an authenticated Supabase client for Server Actions that perform
 * RLS-protected writes, plus the current user.
 *
 * Server Actions can intermittently send DB requests without the user's JWT
 * (so `auth.uid()` is null and RLS rejects the write) even though the user is
 * logged in. To make writes deterministic we read the validated session and
 * pin the access token on the client's `Authorization` header, guaranteeing
 * `auth.uid()` is populated server-side.
 */
export async function createSupabaseActionClient() {
  const base = await createSupabaseServerClient();
  const {
    data: { user },
  } = await base.auth.getUser();
  if (!user) return { supabase: base, user: null };

  const {
    data: { session },
  } = await base.auth.getSession();
  const token = session?.access_token;

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* writes handled by middleware / the base client */
        },
      },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    },
  );

  return { supabase, user };
}
