'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
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

/** Creates a draft game and sends the creator to its editor. */
export async function createGame(input: { title: string; gameType: GameType; difficulty: Difficulty }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const title = input.title.trim() || 'لعبة بدون عنوان';
  const slug = `${slugify(title) || 'game'}-${randomSuffix()}`;

  const { data, error } = await supabase
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

  if (error || !data) {
    throw new Error(error?.message ?? 'تعذّر إنشاء اللعبة');
  }

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
  const supabase = await createSupabaseServerClient();

  const { error: metaError } = await supabase
    .from('games')
    .update({
      title: meta.title.trim() || 'لعبة بدون عنوان',
      tagline: meta.tagline.trim() || null,
      description: meta.description.trim() || null,
      difficulty: meta.difficulty,
    })
    .eq('id', gameId);
  if (metaError) return { ok: false, error: metaError.message };

  const { error: contentError } = await supabase.rpc('save_game_content', {
    gid: gameId,
    content: content as unknown as Json,
  });
  if (contentError) return { ok: false, error: contentError.message };

  revalidatePath(`/edit/${gameId}`);
  return { ok: true as const };
}

/** Flips a game between draft and published. */
export async function setGameStatus(gameId: string, status: 'draft' | 'published') {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('games').update({ status }).eq('id', gameId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/explore');
  revalidatePath('/dashboard');
  revalidatePath(`/edit/${gameId}`);
  return { ok: true as const };
}
