'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

type GameType = 'family_feud' | 'word_builder' | 'quiz' | 'photo_guess' | 'letter_hive';
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

/** One multiple-choice question (quiz + photo_guess). */
export interface McqQuestion {
  prompt: string;
  imageUrl?: string;
  options: string[];
  correct: number;
  seconds: number;
}

/** One hive cell (letter_hive). */
export interface HiveCell {
  letter: string;
  question: string;
  answer: string;
}

/** Editor payload for config-driven game types. */
export type EditorConfig =
  | { kind: 'mcq'; questions: McqQuestion[] }
  | { kind: 'hive'; cells: HiveCell[] };

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Sanitizes MCQ questions (quiz / photo_guess) into a config blob. */
function sanitizeMcq(questions: McqQuestion[], requireImage: boolean) {
  const clean = (Array.isArray(questions) ? questions : [])
    .slice(0, 100)
    .map((q) => {
      // Drop empty options and remap the correct index onto the kept ones.
      const raw = (Array.isArray(q.options) ? q.options : []).map((o) => str(o, 120)).slice(0, 4);
      const correctRaw = clampInt(q.correct, 0, 3, 0);
      const kept = raw.map((text, i) => ({ text, i })).filter((x) => x.text !== '');
      const correct = kept.findIndex((x) => x.i === correctRaw);
      return {
        prompt: str(q.prompt, 300),
        image_url: str(q.imageUrl, 1000),
        options: kept.map((x) => x.text),
        correct,
        seconds: clampInt(q.seconds, 5, 120, 15),
      };
    })
    // A playable question needs a prompt (photo games: an image), 2+ options,
    // and a correct option that wasn't dropped as empty.
    .filter(
      (q) =>
        (requireImage ? q.image_url !== '' : q.prompt !== '') &&
        q.options.length >= 2 &&
        q.correct >= 0,
    );
  return { questions: clean };
}

/** Sanitizes hive cells; the board is a 5×5 hex grid (25 cells). */
function sanitizeHive(cells: HiveCell[]) {
  const clean = (Array.isArray(cells) ? cells : []).slice(0, 25).map((c) => ({
    letter: str(c.letter, 2),
    question: str(c.question, 300),
    answer: str(c.answer, 120),
  }));
  return { cells: clean };
}

/** Saves game metadata + content (rounds/questions/answers) atomically. */
export async function saveGame(
  gameId: string,
  meta: { title: string; tagline: string; description: string; difficulty: Difficulty; ticketCost: number },
  content: EditorRound[],
  editorConfig?: EditorConfig,
) {
  const user = await getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  const auth = await assertCanEdit(gameId, user.id);
  if (!auth.ok) return { ok: false, error: auth.error };
  const { admin } = auth;

  // Cost to play, in tickets. 0 = free; capped to a sane max.
  const ticketCost = Math.max(0, Math.min(50, Math.round(meta.ticketCost || 0)));

  // Config-driven types (quiz/photo_guess/letter_hive) persist content in games.config.
  let config: Json | undefined;
  if (editorConfig) {
    const { data: g } = await admin.from('games').select('game_type').eq('id', gameId).maybeSingle();
    if (editorConfig.kind === 'mcq' && (g?.game_type === 'quiz' || g?.game_type === 'photo_guess')) {
      config = sanitizeMcq(editorConfig.questions, g.game_type === 'photo_guess') as unknown as Json;
    } else if (editorConfig.kind === 'hive' && g?.game_type === 'letter_hive') {
      config = sanitizeHive(editorConfig.cells) as unknown as Json;
    }
  }

  const { error: metaError } = await admin
    .from('games')
    .update({
      title: meta.title.trim() || 'لعبة بدون عنوان',
      tagline: meta.tagline.trim() || null,
      description: meta.description.trim() || null,
      difficulty: meta.difficulty,
      ticket_cost: ticketCost,
      ...(config !== undefined ? { config } : {}),
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

/** Permanently deletes a game (and its rounds/questions/answers via cascade). */
export async function deleteGame(gameId: string) {
  const user = await getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  const auth = await assertCanEdit(gameId, user.id);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.admin.from('games').delete().eq('id', gameId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/explore');
  return { ok: true as const };
}
