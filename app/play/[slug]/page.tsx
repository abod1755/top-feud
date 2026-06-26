import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { SoloGame, type PlayQuestion } from '@/components/play/solo-game';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'العب' };

const DEFAULT_TIME = 60;

async function loadGame(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data: game } = await supabase
    .from('games')
    .select('id, slug, title, game_type, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!game) return null;

  if (game.game_type !== 'family_feud') return { game, questions: [] as PlayQuestion[] };

  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, position, time_limit_seconds')
    .eq('game_id', game.id)
    .order('position');

  const roundIds = (rounds ?? []).map((r) => r.id);
  if (roundIds.length === 0) return { game, questions: [] as PlayQuestion[] };

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

  const built: PlayQuestion[] = (questions ?? [])
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
      answers: (answers ?? [])
        .filter((a) => a.question_id === q.id)
        .map((a) => ({ text: a.text, points: a.points })),
    }))
    .filter((q) => q.answers.length > 0);

  return { game, questions: built };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadGame(slug);
  if (!result) notFound();

  const { game, questions } = result;

  if (game.game_type === 'word_builder') {
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <div className="glass max-w-md rounded-3xl p-10">
          <div className="text-5xl">🔤</div>
          <h2 className="mt-4 font-display text-2xl font-extrabold">سباق الحروف قريبًا</h2>
          <p className="mt-2 text-muted-foreground">محرّك لعبة الحروف قيد البناء. جرّب ألعاب فاميلي فيود الآن.</p>
          <Link href="/explore" className="mt-6 inline-block font-semibold text-primary">
            تصفّح الألعاب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <SoloGame gameId={game.id} gameSlug={game.slug} gameTitle={game.title} questions={questions} />
    </main>
  );
}
