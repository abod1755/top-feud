'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Creates a singleton-friendly Supabase client for use in Client Components.
 * The browser client persists the session in cookies shared with the server
 * client so SSR and CSR stay in sync.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
