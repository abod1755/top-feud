import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Refreshes the Supabase auth session on every request and forwards the
 * refreshed cookies to both the browser and downstream Server Components.
 *
 * Per Supabase guidance, `auth.getUser()` MUST be called here (not just
 * `getSession()`) so the token is validated and silently refreshed before it
 * reaches any Server Component. Do not run other logic between client creation
 * and `getUser()` or you risk logging users out at random.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets and image files.
     * This keeps session refresh cheap while still covering every real page.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
