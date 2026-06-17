import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options, maxAge: 0 });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/game/:path*', '/api/:path*'],
};