'use client';

import { useState, useTransition } from 'react';
import { Users, Type } from 'lucide-react';

import { createGame } from '@/app/actions/games';
import { Button } from '@/components/ui/button';
import { DIFFICULTY_LABELS } from '@/lib/brand';
import { cn } from '@/lib/utils';

type GameType = 'family_feud' | 'word_builder';
type Difficulty = 'easy' | 'medium' | 'hard';

const TYPES: { key: GameType; label: string; Icon: typeof Users }[] = [
  { key: 'family_feud', label: 'فاميلي فيود', Icon: Users },
  { key: 'word_builder', label: 'سباق الحروف', Icon: Type },
];

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
        {gameType === 'word_builder' && (
          <p className="mt-2 text-xs text-muted-foreground">محرّر سباق الحروف قيد البناء — يمكنك إنشاؤها وضبط محتواها لاحقًا.</p>
        )}
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
