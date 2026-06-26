'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Follows or unfollows a creator. Identity is verified server-side via the Auth
 * API; the write goes through the service role to avoid the Server-Action JWT
 * propagation issue. Follower counts update automatically via DB triggers.
 */
export async function toggleFollow(targetUserId: string, handle: string) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: 'يجب تسجيل الدخول' };
  if (user.id === targetUserId) return { ok: false as const, error: 'لا يمكنك متابعة نفسك' };

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('followers')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath(`/u/${handle}`);
    return { ok: true as const, following: false };
  }

  const { error } = await admin
    .from('followers')
    .insert({ follower_id: user.id, following_id: targetUserId });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/u/${handle}`);
  return { ok: true as const, following: true };
}
