import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY; never import into a
 * Client Component. Use exclusively for privileged writes in Server Actions
 * AFTER the calling user has been authenticated and authorized in application
 * code (e.g. verifying ownership). The key lives only in SUPABASE_SERVICE_ROLE_KEY.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY غير مضبوط في إعدادات البيئة.');
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
