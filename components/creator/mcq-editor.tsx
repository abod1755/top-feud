'use client';

import { Plus, Trash2, CheckCircle2, Circle, ImageIcon } from 'lucide-react';

import type { McqQuestion } from '@/app/actions/games';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-lg border-2 border-border bg-background/60 px-3 py-2 outline-none focus:border-primary';

export function emptyMcqQuestion(): McqQuestion {
  return { prompt: '', imageUrl: '', options: ['', '', '', ''], correct: 0, seconds: 15 };
}

/**
 * Editor for multiple-choice questions. Used by the quiz type and — with
 * `withImage` — by photo_guess (every question then needs an image URL).
 */
export function McqEditor({
  questions,
  onChange,
  withImage,
}: {
  questions: McqQuestion[];
  onChange: (next: McqQuestion[]) => void;
  withImage: boolean;
}) {
  function mutate(fn: (draft: McqQuestion[]) => void) {
    const next = structuredClone(questions);
    fn(next);
    onChange(next);
  }

  return (
    <section className="mt-6 space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">س{qi + 1}</span>
            <input
              value={q.prompt}
              onChange={(e) => mutate((d) => void (d[qi].prompt = e.target.value))}
              maxLength={300}
              placeholder={withImage ? 'السؤال (اختياري) — مثال: من في الصورة؟' : 'نص السؤال'}
              className={inputClass}
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="number"
                min={5}
                max={120}
                value={q.seconds}
                onChange={(e) => mutate((d) => void (d[qi].seconds = Number(e.target.value) || 15))}
                className="w-16 rounded-lg border-2 border-border bg-background/60 px-2 py-2 text-center outline-none focus:border-primary"
                aria-label="مدة السؤال بالثواني"
              />
              ث
            </div>
            <button
              type="button"
              onClick={() => mutate((d) => void d.splice(qi, 1))}
              className="text-muted-foreground hover:text-destructive"
              aria-label="حذف السؤال"
            >
              <Trash2 className="size-5" />
            </button>
          </div>

          {withImage && (
            <div className="mt-2 flex items-center gap-2">
              <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={q.imageUrl ?? ''}
                onChange={(e) => mutate((d) => void (d[qi].imageUrl = e.target.value))}
                maxLength={1000}
                dir="ltr"
                placeholder="https://… رابط الصورة"
                className={cn(inputClass, 'text-left')}
              />
              {q.imageUrl?.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover" />
              )}
            </div>
          )}

          {/* options: click the circle to mark the correct one */}
          <div className="mt-3 grid grid-cols-1 gap-2 pr-6 sm:grid-cols-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mutate((d) => void (d[qi].correct = oi))}
                  aria-label="الإجابة الصحيحة"
                  className={q.correct === oi ? 'text-success' : 'text-muted-foreground/50 hover:text-muted-foreground'}
                >
                  {q.correct === oi ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>
                <input
                  value={opt}
                  onChange={(e) => mutate((d) => void (d[qi].options[oi] = e.target.value))}
                  maxLength={120}
                  placeholder={`خيار ${oi + 1}${oi < 2 ? '' : ' (اختياري)'}`}
                  className={cn(inputClass, q.correct === oi && 'border-success/60')}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 pr-6 text-xs text-muted-foreground">اضغط الدائرة لتحديد الإجابة الصحيحة.</p>
        </div>
      ))}

      <Button variant="outline" size="lg" className="w-full" onClick={() => onChange([...questions, emptyMcqQuestion()])}>
        <Plus className="size-5" /> إضافة سؤال
      </Button>
    </section>
  );
}
