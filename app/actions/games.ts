'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

type GameType = 'family_feud' | 'word_builder';
type Difficulty = 'easy' | 'medium' | 'hard';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Returns the authenticated user (validated against the Auth API), or null. */
async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Confirms the user may edit the game (creator or admin/moderator). */
async function assertCanEdit(gameId: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data: game } = await admin.from('games').select('creator_id').eq('id', gameId).maybeSingle();
  if (!game) return { ok: false as const, error: 'اللعبة غير موجودة' };
  if (game.creator_id === userId) return { ok: true as const, admin };

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role === 'admin' || profile?.role === 'moderator') return { ok: true as const, admin };
  return { ok: false as const, error: 'غير مصرّح لك بتعديل هذه اللعبة' };
}

/** Creates a draft game and sends the creator to its editor. */
export async function createGame(input: { title: string; gameType: GameType; difficulty: Difficulty }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const title = input.title.trim() || 'لعبة بدون عنوان';
  const slug = `${slugify(title) || 'game'}-${randomSuffix()}`;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('games')
    .insert({
      creator_id: user.id,
      slug,
      title,
      game_type: input.gameType,
      difficulty: input.difficulty,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'تعذّر إنشاء اللعبة');
  redirect(`/edit/${data.id}`);
}

export interface EditorRound {
  title: string;
  questions: { prompt: string; answers: { text: string; points: number }[] }[];
}

/** Saves game metadata + content (rounds/questions/answers) atomically. */
export async function saveGame(
  gameId: string,
  meta: { title: string; tagline: string; description: string; difficulty: Difficulty },
  content: EditorRound[],
) {
  const user = await getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  const auth = await assertCanEdit(gameId, user.id);
  if (!auth.ok) return { ok: false, error: auth.error };
  const { admin } = auth;

  const { error: metaError } = await admin
    .from('games')
    .update({
      title: meta.title.trim() || 'لعبة بدون عنوان',
      tagline: meta.tagline.trim() || null,
      description: meta.description.trim() || null,
      difficulty: meta.difficulty,
    })
    .eq('id', gameId);
  if (metaError) return { ok: false, error: metaError.message };

  const { error: contentError } = await admin.rpc('save_game_content', {
    gid: gameId,
    content: content as unknown as Json,
  });
  if (contentError) return { ok: false, error: contentError.message };

  revalidatePath(`/edit/${gameId}`);
  return { ok: true as const };
}

/** Flips a game between draft and published. */
export async function setGameStatus(gameId: string, status: 'draft' | 'published') {
  const user = await getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  const auth = await assertCanEdit(gameId, user.id);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.admin.from('games').update({ status }).eq('id', gameId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/explore');
  revalidatePath('/dashboard');
  revalidatePath(`/edit/${gameId}`);
  return { ok: true as const };
}
