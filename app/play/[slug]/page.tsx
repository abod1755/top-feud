import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { PlayShell } from '@/components/play/play-shell';
import type { PlayQuestion } from '@/components/play/solo-game';
import type { PlayTopic } from '@/components/play/topic-game';
import { WordGame, type WordRound } from '@/components/play/word-game';
import { QuizGame, type McqPlayQuestion } from '@/components/play/quiz-game';
import { HiveGame, type HivePlayCell } from '@/components/play/hive-game';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'العب' };

const DEFAULT_TIME = 60;

interface WordConfig {
  rounds?: { letters?: string[]; duration_seconds?: number; min_word_length?: number }[];
}

interface McqConfig {
  questions?: { prompt?: string; image_url?: string; options?: string[]; correct?: number; seconds?: number }[];
}

interface HiveConfig {
  cells?: { letter?: string; question?: string; answer?: string }[];
}

function EmptyGame({ message }: { message: string }) {
  return (
    <div className="container grid min-h-[70vh] place-items-center text-center text-muted-foreground">{message}</div>
  );
}

async function loadFeud(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  gameId: string,
): Promise<{ questions: PlayQuestion[]; topics: PlayTopic[] }> {
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, position, title, time_limit_seconds')
    .eq('game_id', gameId)
    .order('position');
  const roundIds = (rounds ?? []).map((r) => r.id);
  if (roundIds.length === 0) return { questions: [], topics: [] };

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

  const roundTime = new Map((rounds ?? []).map((r) => [r.id, r.time_limit_seconds]));

  const toPlay = (q: { id: string; round_id: string; prompt: string; time_limit_seconds: number | null }): PlayQuestion => ({
    id: q.id,
    prompt: q.prompt,
    timeLimit: q.time_limit_seconds ?? roundTime.get(q.round_id) ?? DEFAULT_TIME,
    answers: (answers ?? []).filter((a) => a.question_id === q.id).map((a) => ({ text: a.text, points: a.points })),
  });

  const topics: PlayTopic[] = (rounds ?? [])
    .map((r) => ({
      title: r.title,
      questions: (questions ?? [])
        .filter((q) => q.round_id === r.id)
        .sort((a, b) => a.position - b.position)
        .map(toPlay)
        .filter((q) => q.answers.length > 0),
    }))
    .filter((t) => t.questions.length > 0);

  const flat = topics.flatMap((t) => t.questions);
  return { questions: flat, topics };
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
    .select('id, slug, title, game_type, status, config, ticket_cost, creator_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!game) notFound();

  // Paid games need an active play grant (created when a ticket is spent).
  // Free games, the creator, and moderators play without one.
  if (game.ticket_cost > 0 && game.creator_id !== user.id) {
    const [{ data: active }, { data: profile }] = await Promise.all([
      supabase.rpc('has_active_play', { gid: game.id, uid: user.id }),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ]);
    const isPrivileged = profile?.role === 'admin' || profile?.role === 'moderator';
    if (!active && !isPrivileged) redirect(`/games/${slug}`);
  }

  if (game.game_type === 'word_builder') {
    const cfg = (game.config ?? {}) as unknown as WordConfig;
    const wordRounds: WordRound[] = (cfg.rounds ?? [])
      .map((r) => ({ letters: r.letters ?? [], duration: r.duration_seconds ?? 90, minLen: r.min_word_length ?? 3 }))
      .filter((r) => r.letters.length > 0);
    if (wordRounds.length === 0) return <EmptyGame message="لم تُضبط أحرف هذه اللعبة بعد." />;
    return (
      <main className="min-h-screen">
        <WordGame gameId={game.id} gameSlug={game.slug} gameTitle={game.title} rounds={wordRounds} />
      </main>
    );
  }

  if (game.game_type === 'quiz' || game.game_type === 'photo_guess') {
    const cfg = (game.config ?? {}) as unknown as McqConfig;
    const questions: McqPlayQuestion[] = (cfg.questions ?? [])
      .map((q) => ({
        prompt: q.prompt ?? '',
        imageUrl: q.image_url || undefined,
        options: (q.options ?? []).filter((o): o is string => !!o),
        correct: q.correct ?? 0,
        seconds: q.seconds ?? 15,
      }))
      .filter(
        (q) =>
          (q.prompt !== '' || q.imageUrl) && q.options.length >= 2 && q.correct >= 0 && q.correct < q.options.length,
      );
    if (questions.length === 0) return <EmptyGame message="لم تُضف أسئلة لهذه اللعبة بعد." />;
    return (
      <main className="min-h-screen">
        <QuizGame gameId={game.id} gameSlug={game.slug} gameTitle={game.title} questions={questions} />
      </main>
    );
  }

  if (game.game_type === 'letter_hive') {
    const cfg = (game.config ?? {}) as unknown as HiveConfig;
    const cells: HivePlayCell[] = (cfg.cells ?? []).map((c) => ({
      letter: c.letter ?? '',
      question: c.question ?? '',
      answer: c.answer ?? '',
    }));
    const ready = cells.length === 25 && cells.every((c) => c.letter && c.question && c.answer);
    if (!ready) return <EmptyGame message="لم تكتمل خلايا هذه اللعبة بعد (تحتاج ٢٥ خلية بحرف وسؤال وإجابة)." />;
    return (
      <main className="min-h-screen">
        <HiveGame gameId={game.id} gameSlug={game.slug} gameTitle={game.title} cells={cells} />
      </main>
    );
  }

  const { questions, topics } = await loadFeud(supabase, game.id);

  return (
    <main className="min-h-screen">
      <PlayShell gameId={game.id} gameSlug={game.slug} gameTitle={game.title} questions={questions} topics={topics} />
    </main>
  );
}
