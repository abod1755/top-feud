'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Records that a game was played (increments games.play_count via RPC). */
export async function recordPlay(gameId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc('increment_play_count', { gid: gameId });
}
