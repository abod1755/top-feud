import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { GameEditor, type EditorGame } from '@/components/creator/game-editor';
import { emptyMcqQuestion } from '@/components/creator/mcq-editor';
import { emptyHiveCells, HIVE_CELLS } from '@/components/creator/hive-editor';
import type { EditorRound, McqQuestion, HiveCell } from '@/app/actions/games';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'محرّر اللعبة' };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: game } = await supabase
    .from('games')
    .select('id, slug, title, tagline, description, difficulty, game_type, status, creator_id, ticket_cost, config')
    .eq('id', id)
    .maybeSingle();

  if (!game) notFound();
  if (game.creator_id !== user.id) redirect('/dashboard');

  // Load existing content.
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, position, title')
    .eq('game_id', id)
    .order('position');
  const roundIds = (rounds ?? []).map((r) => r.id);

  const { data: questions } = roundIds.length
    ? await supabase.from('questions').select('id, round_id, position, prompt').in('round_id', roundIds).order('position')
    : { data: [] };
  const questionIds = (questions ?? []).map((q) => q.id);

  const { data: answers } = questionIds.length
    ? await supabase.from('answers').select('question_id, position, text, points').in('question_id', questionIds).order('position')
    : { data: [] };

  const initialRounds: EditorRound[] = (rounds ?? []).map((r) => ({
    title: r.title,
    questions: (questions ?? [])
      .filter((q) => q.round_id === r.id)
      .map((q) => ({
        prompt: q.prompt,
        answers: (answers ?? [])
          .filter((a) => a.question_id === q.id)
          .map((a) => ({ text: a.text, points: a.points })),
      })),
  }));

  // Config-driven types keep their content in games.config.
  const cfg = (game.config ?? {}) as {
    questions?: { prompt?: string; image_url?: string; options?: string[]; correct?: number; seconds?: number }[];
    cells?: { letter?: string; question?: string; answer?: string }[];
  };
  const isMcq = game.game_type === 'quiz' || game.game_type === 'photo_guess';

  const initialMcq: McqQuestion[] | undefined = isMcq
    ? (cfg.questions ?? []).map((q) => ({
        prompt: q.prompt ?? '',
        imageUrl: q.image_url ?? '',
        options: [...(q.options ?? []), '', '', '', ''].slice(0, 4),
        correct: q.correct ?? 0,
        seconds: q.seconds ?? 15,
      }))
    : undefined;
  if (initialMcq && initialMcq.length === 0) initialMcq.push(emptyMcqQuestion());

  const initialHive: HiveCell[] | undefined =
    game.game_type === 'letter_hive'
      ? [...(cfg.cells ?? []).map((c) => ({ letter: c.letter ?? '', question: c.question ?? '', answer: c.answer ?? '' })), ...emptyHiveCells()].slice(0, HIVE_CELLS)
      : undefined;

  const editorGame: EditorGame = {
    id: game.id,
    slug: game.slug,
    title: game.title,
    tagline: game.tagline ?? '',
    description: game.description ?? '',
    difficulty: game.difficulty,
    gameType: game.game_type,
    status: game.status,
    ticketCost: game.ticket_cost,
  };

  return (
    <main>
      <Header />
      <GameEditor game={editorGame} initialRounds={initialRounds} initialMcq={initialMcq} initialHive={initialHive} />
    </main>
  );
}
