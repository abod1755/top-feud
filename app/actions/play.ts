'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Records that a game was played (increments games.play_count via RPC). */
export async function recordPlay(gameId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('increment_play_count', { gid: gameId });
}

type StartPlayResult = { ok: true; slug: string } | { ok: false; error: string; balance?: number };

/**
 * Opens a play session for a game. Free games, the creator, and moderators play
 * without spending. Otherwise this spends `ticket_cost` tickets from the wallet
 * (atomically, via spend_ticket) and creates a 3h grant so refreshes during the
 * session don't recharge.
 */
export async function startPlay(gameId: string): Promise<StartPlayResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول.' };

  const admin = createSupabaseAdminClient();
  const { data: game } = await admin
    .from('games')
    .select('id, slug, ticket_cost, creator_id')
    .eq('id', gameId)
    .maybeSingle();
  if (!game) return { ok: false, error: 'اللعبة غير موجودة.' };

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isPrivileged =
    game.creator_id === user.id || profile?.role === 'admin' || profile?.role === 'moderator';

  if (game.ticket_cost === 0 || isPrivileged) {
    await admin.from('ticket_plays').insert({ user_id: user.id, game_id: game.id });
    return { ok: true, slug: game.slug };
  }

  const { data, error } = await admin.rpc('spend_ticket', { p_user: user.id, p_game: game.id });
  if (error) return { ok: false, error: 'تعذّر بدء اللعب.' };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) {
    return { ok: false, error: 'رصيدك من التذاكر لا يكفي. اشحن من المتجر.', balance: row?.balance ?? 0 };
  }
  return { ok: true, slug: game.slug };
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
