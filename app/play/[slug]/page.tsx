import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { PlayShell } from '@/components/play/play-shell';
import type { PlayQuestion } from '@/components/play/solo-game';
import { WordGame, type WordRound } from '@/components/play/word-game';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'العب' };

const DEFAULT_TIME = 60;

interface WordConfig {
  rounds?: { letters?: string[]; duration_seconds?: number; min_word_length?: number }[];
}

async function loadFeudQuestions(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, gameId: string) {
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, position, time_limit_seconds')
    .eq('game_id', gameId)
    .order('position');
  const roundIds = (rounds ?? []).map((r) => r.id);
  if (roundIds.length === 0) return [] as PlayQuestion[];

  const { data: questions } = await supabase
    .from('questions')
    .select('id, round_id, position, prompt, time_limit_seconds')
    .in('round_id', roundIds)
    .order('position');
  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, position, text, points')
    .in('question_id', questionIds)
    .order('position');

  const roundOrder = new Map((rounds ?? []).map((r, i) => [r.id, i]));
  const roundTime = new Map((rounds ?? []).map((r) => [r.id, r.time_limit_seconds]));

  return (questions ?? [])
    .slice()
    .sort((a, b) => {
      const ra = roundOrder.get(a.round_id) ?? 0;
      const rb = roundOrder.get(b.round_id) ?? 0;
      return ra - rb || a.position - b.position;
    })
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      timeLimit: q.time_limit_seconds ?? roundTime.get(q.round_id) ?? DEFAULT_TIME,
      answers: (answers ?? []).filter((a) => a.question_id === q.id).map((a) => ({ text: a.text, points: a.points })),
    }))
    .filter((q) => q.answers.length > 0) satisfies PlayQuestion[];
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/play/${slug}`);

  const { data: game } = await supabase
    .from('games')
    .select('id, slug, title, game_type, status, config')
    .eq('slug', slug)
    .maybeSingle();
  if (!game) notFound();

  if (game.game_type === 'word_builder') {
    const cfg = (game.config ?? {}) as unknown as WordConfig;
    const wordRounds: WordRound[] = (cfg.rounds ?? [])
      .map((r) => ({
        letters: r.letters ?? [],
        duration: r.duration_seconds ?? 90,
        minLen: r.min_word_length ?? 3,
      }))
      .filter((r) => r.letters.length > 0);

    if (wordRounds.length === 0) {
      return (
        <div className="container grid min-h-[70vh] place-items-center text-center text-muted-foreground">
          لم تُضبط أحرف هذه اللعبة بعد.
        </div>
      );
    }

    return (
      <main className="min-h-screen">
        <WordGame gameId={game.id} gameSlug={game.slug} gameTitle={game.title} rounds={wordRounds} />
      </main>
    );
  }

  const questions = await loadFeudQuestions(supabase, game.id);

  return (
    <main className="min-h-screen">
      <PlayShell gameId={game.id} gameSlug={game.slug} gameTitle={game.title} questions={questions} />
    </main>
  );
}
