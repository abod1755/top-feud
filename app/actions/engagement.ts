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

/** Adds or removes the game from the user's favorites. */
export async function toggleFavorite(gameId: string, slug: string) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: 'يجب تسجيل الدخول' };

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('game_favorites')
    .select('game_id')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('game_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('game_id', gameId);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath(`/games/${slug}`);
    return { ok: true as const, favorited: false };
  }

  const { error } = await admin.from('game_favorites').insert({ user_id: user.id, game_id: gameId });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/games/${slug}`);
  return { ok: true as const, favorited: true };
}

/** Sets (upserts) the user's 1–5 star rating for a game. */
export async function rateGame(gameId: string, slug: string, rating: number) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: 'يجب تسجيل الدخول' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false as const, error: 'تقييم غير صالح' };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('game_ratings')
    .upsert({ user_id: user.id, game_id: gameId, rating }, { onConflict: 'user_id,game_id' });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/games/${slug}`);
  return { ok: true as const };
}
