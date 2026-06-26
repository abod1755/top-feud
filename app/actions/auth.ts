'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Signs the current user out (clears the Supabase session cookies) and sends
 * them back to the landing page. Used by the header's sign-out button.
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
