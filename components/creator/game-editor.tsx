'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, Eye, Globe, Lock } from 'lucide-react';

import { saveGame, setGameStatus, type EditorRound } from '@/app/actions/games';
import { Button } from '@/components/ui/button';
import { DIFFICULTY_LABELS } from '@/lib/brand';
import { cn } from '@/lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';

export interface EditorGame {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  gameType: 'family_feud' | 'word_builder';
  status: string;
  priceCents: number;
}

const inputClass =
  'w-full rounded-lg border-2 border-border bg-background/60 px-3 py-2 outline-none focus:border-primary';

export function GameEditor({ game, initialRounds }: { game: EditorGame; initialRounds: EditorRound[] }) {
  const [title, setTitle] = useState(game.title);
  const [tagline, setTagline] = useState(game.tagline);
  const [description, setDescription] = useState(game.description);
  const [difficulty, setDifficulty] = useState<Difficulty>(game.difficulty);
  const [priceRiyals, setPriceRiyals] = useState<number>(game.priceCents / 100);
  const [rounds, setRounds] = useState<EditorRound[]>(initialRounds);
  const [status, setStatus] = useState(game.status);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [publishing, startPublish] = useTransition();

  const isWord = game.gameType === 'word_builder';
  const questionCount = rounds.reduce((sum, r) => sum + r.questions.length, 0);

  function mutate(fn: (draft: EditorRound[]) => void) {
    setRounds((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setSavedAt(null);
  }

  function save() {
    setError(null);
    startSave(async () => {
      const res = await saveGame(game.id, { title, tagline, description, difficulty, priceCents: Math.round(priceRiyals * 100) }, rounds);
      if (res.ok) setSavedAt(Date.now());
      else setError(res.error ?? 'تعذّر الحفظ');
    });
  }

  function togglePublish() {
    setError(null);
    const next = status === 'published' ? 'draft' : 'published';
    startPublish(async () => {
      // Persist content first so a freshly-published game has its questions.
      const saveRes = await saveGame(game.id, { title, tagline, description, difficulty, priceCents: Math.round(priceRiyals * 100) }, rounds);
      if (!saveRes.ok) {
        setError(saveRes.error ?? 'تعذّر الحفظ');
        return;
      }
      const res = await setGameStatus(game.id, next);
      if (res.ok) {
        setStatus(next);
        setSavedAt(Date.now());
      } else setError(res.error ?? 'تعذّر تغيير الحالة');
    });
  }

  return (
    <div className="container max-w-3xl py-8">
      {/* toolbar */}
      <div className="glass sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold',
              status === 'published' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground',
            )}
          >
            {status === 'published' ? 'منشورة' : 'مسودّة'}
          </span>
          <span className="text-xs text-muted-foreground">{questionCount} سؤال</span>
          {savedAt && <span className="text-xs text-success">تم الحفظ ✓</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/play/${game.slug}`} target="_blank">
              <Eye className="size-4" /> معاينة
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            <Save className="size-4" /> {saving ? 'يحفظ…' : 'حفظ'}
          </Button>
          <Button variant={status === 'published' ? 'ghost' : 'gradient'} size="sm" onClick={togglePublish} disabled={publishing}>
            {status === 'published' ? <Lock className="size-4" /> : <Globe className="size-4" />}
            {publishing ? '…' : status === 'published' ? 'إلغاء النشر' : 'نشر'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </p>
      )}

      {/* metadata */}
      <section className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSavedAt(null);
          }}
          maxLength={120}
          placeholder="عنوان اللعبة"
          className="w-full rounded-xl border-2 border-border bg-background/60 px-4 py-3 font-display text-xl font-bold outline-none focus:border-primary"
        />
        <input
          value={tagline}
          onChange={(e) => {
            setTagline(e.target.value);
            setSavedAt(null);
          }}
          maxLength={160}
          placeholder="وصف قصير (سطر تشويقي)"
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSavedAt(null);
          }}
          maxLength={4000}
          rows={2}
          placeholder="وصف تفصيلي (اختياري)"
          className={cn(inputClass, 'resize-y')}
        />
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDifficulty(d);
                setSavedAt(null);
              }}
              className={cn(
                'rounded-lg border-2 px-4 py-1.5 text-sm font-semibold transition',
                difficulty === d ? 'border-primary bg-primary/15' : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Pricing: 0 = free, otherwise players buy a ticket to play. */}
        <div className="rounded-xl border-2 border-border bg-background/40 p-4">
          <label className="mb-1 block text-sm font-semibold">سعر التذكرة</label>
          <p className="mb-3 text-xs text-muted-foreground">
            اتركه ٠ لجعل اللعبة مجانية، أو حدّد سعراً ليشتري اللاعب تذكرة قبل اللعب.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={5000}
              step={1}
              value={priceRiyals}
              onChange={(e) => {
                setPriceRiyals(Math.max(0, Number(e.target.value) || 0));
                setSavedAt(null);
              }}
              className="w-32 rounded-lg border-2 border-border bg-background/60 px-3 py-2 text-center outline-none focus:border-primary"
              aria-label="سعر التذكرة بالريال"
            />
            <span className="text-sm text-muted-foreground">ريال سعودي</span>
            {priceRiyals > 0 ? (
              <span className="ms-auto rounded-full bg-[#FFCE1F]/20 px-3 py-1 text-xs font-semibold text-[#FFCE1F]">
                🎟️ مدفوعة
              </span>
            ) : (
              <span className="ms-auto rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                مجانية
              </span>
            )}
          </div>
        </div>
      </section>

      {isWord ? (
        <div className="mt-6 glass rounded-2xl p-8 text-center text-muted-foreground">
          محرّر محتوى سباق الحروف قيد البناء. يمكنك حفظ بيانات اللعبة الآن.
        </div>
      ) : (
        <section className="mt-6 space-y-5">
          {rounds.map((round, ri) => (
            <div key={ri} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <input
                  value={round.title}
                  onChange={(e) => mutate((d) => void (d[ri].title = e.target.value))}
                  placeholder={`الجولة ${ri + 1}`}
                  className={cn(inputClass, 'font-bold')}
                />
                <button type="button" onClick={() => mutate((d) => void d.splice(ri, 1))} className="text-muted-foreground hover:text-destructive" aria-label="حذف الجولة">
                  <Trash2 className="size-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {round.questions.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">س{qi + 1}</span>
                      <input
                        value={q.prompt}
                        onChange={(e) => mutate((d) => void (d[ri].questions[qi].prompt = e.target.value))}
                        placeholder="نص السؤال — مثال: اذكر دولة عربية"
                        className={inputClass}
                      />
                      <button type="button" onClick={() => mutate((d) => void d[ri].questions.splice(qi, 1))} className="text-muted-foreground hover:text-destructive" aria-label="حذف السؤال">
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-2 space-y-2 pr-6">
                      {q.answers.map((a, ai) => (
                        <div key={ai} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{ai + 1}</span>
                          <input
                            value={a.text}
                            onChange={(e) => mutate((d) => void (d[ri].questions[qi].answers[ai].text = e.target.value))}
                            placeholder="إجابة"
                            className={inputClass}
                          />
                          <input
                            type="number"
                            value={a.points}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              mutate((d) => void (d[ri].questions[qi].answers[ai].points = Number(e.target.value) || 0))
                            }
                            className="w-20 rounded-lg border-2 border-border bg-background/60 px-2 py-2 text-center outline-none focus:border-primary"
                            aria-label="النقاط"
                          />
                          <button type="button" onClick={() => mutate((d) => void d[ri].questions[qi].answers.splice(ai, 1))} className="text-muted-foreground hover:text-destructive" aria-label="حذف الإجابة">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => mutate((d) => void d[ri].questions[qi].answers.push({ text: '', points: 10 }))}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                      >
                        <Plus className="size-4" /> إضافة إجابة
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => mutate((d) => void d[ri].questions.push({ prompt: '', answers: [] }))}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  <Plus className="size-4" /> إضافة سؤال
                </button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => mutate((d) => d.push({ title: '', questions: [] }))}
          >
            <Plus className="size-5" /> إضافة جولة
          </Button>
        </section>
      )}
    </div>
  );
}
