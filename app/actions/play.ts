'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Records that a game was played (increments games.play_count via RPC). */
export async function recordPlay(gameId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('increment_play_count', { gid: gameId });
}

/**
 * Records the signed-in player's score for a game, keeping their best. Used by
 * solo play on the result screen; powers the leaderboard. No-ops for guests.
 */
export async function recordScore(gameId: string, score: number) {
  if (!Number.isFinite(score) || score < 0) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('game_scores')
    .select('best_score, plays')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle();

  const best = Math.max(existing?.best_score ?? 0, Math.floor(score));
  const plays = (existing?.plays ?? 0) + 1;

  await admin.from('game_scores').upsert(
    { user_id: user.id, game_id: gameId, best_score: best, plays, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,game_id' },
  );
}
