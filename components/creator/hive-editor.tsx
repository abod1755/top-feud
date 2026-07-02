'use client';

import { Shuffle } from 'lucide-react';

import type { HiveCell } from '@/app/actions/games';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const HIVE_SIZE = 5;
export const HIVE_CELLS = HIVE_SIZE * HIVE_SIZE;

const ARABIC_LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');

const inputClass =
  'w-full rounded-lg border-2 border-border bg-background/60 px-3 py-2 outline-none focus:border-primary';

export function emptyHiveCells(): HiveCell[] {
  return Array.from({ length: HIVE_CELLS }, () => ({ letter: '', question: '', answer: '' }));
}

/** Editor for the 5×5 letter-hive board: letter + question + answer per cell. */
export function HiveEditor({ cells, onChange }: { cells: HiveCell[]; onChange: (next: HiveCell[]) => void }) {
  const filled = cells.filter((c) => c.letter && c.question && c.answer).length;

  function mutate(fn: (draft: HiveCell[]) => void) {
    const next = structuredClone(cells);
    fn(next);
    onChange(next);
  }

  function shuffleLetters() {
    const pool = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5).slice(0, HIVE_CELLS);
    mutate((d) => d.forEach((c, i) => (c.letter = pool[i] ?? '')));
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <h3 className="font-display font-extrabold">خلية الحروف — ٢٥ خلية</h3>
          <p className="text-xs text-muted-foreground">
            لكل خلية: حرف، وسؤال إجابته تبدأ بذلك الحرف. جاهز منها {filled} / {HIVE_CELLS}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={shuffleLetters}>
          <Shuffle className="size-4" /> توزيع الحروف عشوائيًا
        </Button>
      </div>

      <div className="space-y-3">
        {cells.map((cell, i) => {
          const ready = cell.letter && cell.question && cell.answer;
          return (
            <div key={i} className={cn('glass rounded-2xl p-3', !ready && 'opacity-80')}>
              <div className="flex items-center gap-2">
                <input
                  value={cell.letter}
                  onChange={(e) => mutate((d) => void (d[i].letter = e.target.value.slice(0, 1)))}
                  maxLength={1}
                  placeholder="ح"
                  aria-label={`حرف الخلية ${i + 1}`}
                  className={cn(
                    'w-12 shrink-0 rounded-lg border-2 bg-background/60 py-2 text-center font-display text-lg font-extrabold outline-none focus:border-primary',
                    ready ? 'border-success/50' : 'border-border',
                  )}
                />
                <input
                  value={cell.question}
                  onChange={(e) => mutate((d) => void (d[i].question = e.target.value))}
                  maxLength={300}
                  placeholder={`سؤال إجابته تبدأ بـ«${cell.letter || 'الحرف'}» — مثال: دولة عربية`}
                  className={inputClass}
                />
                <input
                  value={cell.answer}
                  onChange={(e) => mutate((d) => void (d[i].answer = e.target.value))}
                  maxLength={120}
                  placeholder="الإجابة"
                  className={cn(inputClass, 'max-w-44')}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
