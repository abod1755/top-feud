'use client';

import { useState, useTransition } from 'react';
import { Users, Type, Zap, Image as ImageIcon, Hexagon } from 'lucide-react';

import { createGame } from '@/app/actions/games';
import { Button } from '@/components/ui/button';
import { DIFFICULTY_LABELS, GAME_TYPES } from '@/lib/brand';
import { cn } from '@/lib/utils';

type GameType = 'family_feud' | 'word_builder' | 'quiz' | 'photo_guess' | 'letter_hive';
type Difficulty = 'easy' | 'medium' | 'hard';

const TYPES: { key: GameType; label: string; Icon: typeof Users }[] = [
  { key: 'family_feud', label: GAME_TYPES.family_feud.label, Icon: Users },
  { key: 'word_builder', label: GAME_TYPES.word_builder.label, Icon: Type },
  { key: 'quiz', label: GAME_TYPES.quiz.label, Icon: Zap },
  { key: 'photo_guess', label: GAME_TYPES.photo_guess.label, Icon: ImageIcon },
  { key: 'letter_hive', label: GAME_TYPES.letter_hive.label, Icon: Hexagon },
];

const TYPE_HINTS: Partial<Record<GameType, string>> = {
  word_builder: 'محرّر سباق الحروف قيد البناء — يمكنك إنشاؤها وضبط محتواها لاحقًا.',
  quiz: 'أسئلة اختيار من متعدد بوقت محدد — الأسرع يكسب أكثر.',
  photo_guess: 'ضع صورة وخيارات، وخمّن اللاعبون من صاحبها.',
  letter_hive: 'خلية ٢٥ حرفًا: فريقان يتسابقان لتوصيل طرفَي الخلية.',
};

export function CreateGameForm() {
  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState<GameType>('family_feud');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) {
      setError('اكتب عنوان اللعبة.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createGame({ title, gameType, difficulty });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ، حاول مرة أخرى.');
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">عنوان اللعبة</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="مثال: تحدي العائلة الكبير"
          className="w-full rounded-xl border-2 border-border bg-background/60 px-4 py-3 outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">نوع اللعبة</label>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setGameType(t.key)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-semibold transition',
                gameType === t.key ? 'border-primary bg-primary/15' : 'border-border bg-background/40 text-muted-foreground hover:border-primary/50',
              )}
            >
              <t.Icon className="size-5" />
              {t.label}
            </button>
          ))}
        </div>
        {TYPE_HINTS[gameType] && <p className="mt-2 text-xs text-muted-foreground">{TYPE_HINTS[gameType]}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">الصعوبة</label>
        <div className="grid grid-cols-3 gap-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-xl border-2 px-4 py-2.5 font-semibold transition',
                difficulty === d ? 'border-primary bg-primary/15' : 'border-border bg-background/40 text-muted-foreground hover:border-primary/50',
              )}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </p>
      )}

      <Button variant="gradient" size="lg" className="w-full" onClick={submit} disabled={pending}>
        {pending ? 'جارٍ الإنشاء…' : 'إنشاء والانتقال للمحرّر'}
      </Button>
    </div>
  );
}
