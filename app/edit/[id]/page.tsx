import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { GameEditor, type EditorGame } from '@/components/creator/game-editor';
import type { EditorRound } from '@/app/actions/games';
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
    .select('id, slug, title, tagline, description, difficulty, game_type, status, creator_id')
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

  const editorGame: EditorGame = {
    id: game.id,
    slug: game.slug,
    title: game.title,
    tagline: game.tagline ?? '',
    description: game.description ?? '',
    difficulty: game.difficulty,
    gameType: game.game_type,
    status: game.status,
  };

  return (
    <main>
      <Header />
      <GameEditor game={editorGame} initialRounds={initialRounds} />
    </main>
  );
}
