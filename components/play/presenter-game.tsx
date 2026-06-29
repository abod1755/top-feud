'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Maximize, Minimize, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

import { recordPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import type { PlayQuestion } from '@/components/play/solo-game';
import { playCorrect, playWrong, playFinish } from '@/lib/sounds';
import { cn, formatNumber } from '@/lib/utils';

interface PresenterGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  questions: PlayQuestion[];
}

const TEAM_COLORS = ['hsl(176 76% 49%)', '#F43F9D'];

export function PresenterGame({ gameId, gameSlug, gameTitle, questions }: PresenterGameProps) {
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [names, setNames] = useState<[string, string]>(['الفريق الأزرق', 'الفريق الوردي']);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [strikes, setStrikes] = useState(0);
  const [fs, setFs] = useState(false);
  const mutedRef = useRef(false);

  const question = questions[qIndex];
  const pot = question ? [...revealed].reduce((sum, i) => sum + (question.answers[i]?.points ?? 0), 0) : 0;

  const reveal = useCallback(
    (i: number) => {
      if (!question || i >= question.answers.length || revealed.has(i)) return;
      setRevealed((prev) => new Set(prev).add(i));
      if (!mutedRef.current) playCorrect();
    },
    [question, revealed],
  );

  const addStrike = useCallback(() => {
    setStrikes((s) => Math.min(s + 1, 3));
    if (!mutedRef.current) playWrong();
  }, []);

  const goto = useCallback(
    (delta: number) => {
      setQIndex((prev) => {
        const next = Math.min(Math.max(prev + delta, 0), questions.length - 1);
        if (next !== prev) {
          setRevealed(new Set());
          setStrikes(0);
        }
        return next;
      });
    },
    [questions.length],
  );

  function award(team: 0 | 1) {
    setScores((s) => {
      const copy: [number, number] = [s[0], s[1]];
      copy[team] += pot;
      return copy;
    });
    setRevealed(new Set());
    setStrikes(0);
    if (qIndex + 1 >= questions.length) {
      if (!mutedRef.current) playFinish();
    } else {
      goto(1);
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFs(true);
      } else {
        await document.exitFullscreen();
        setFs(false);
      }
    } catch {
      /* ignore */
    }
  }

  // Keyboard shortcuts.
  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      if (e.key >= '1' && e.key <= '9') reveal(Number(e.key) - 1);
      else if (e.key === '0') reveal(9);
      else if (e.key.toLowerCase() === 'x') addStrike();
      else if (e.key === 'ArrowRight') goto(-1); // RTL: right = previous
      else if (e.key === 'ArrowLeft') goto(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, reveal, addStrike, goto]);

  function start() {
    void recordPlay(gameId);
    setPhase('playing');
  }

  if (!question) {
    return <div className="container py-20 text-center text-muted-foreground">هذه اللعبة لا تحتوي أسئلة بعد.</div>;
  }

  if (phase === 'setup') {
    return (
      <div className="container grid min-h-[80vh] place-items-center">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold text-primary">{gameTitle}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">وضع المضيف / التلفاز</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            افتح ملء الشاشة على التلفاز، واكشف الإجابات للناس واحسب نقاط الفريقين.
          </p>
          <div className="mt-6 space-y-3 text-right">
            {[0, 1].map((i) => (
              <input
                key={i}
                value={names[i]}
                maxLength={24}
                onChange={(e) => setNames((n) => (i === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
                className="w-full rounded-xl border-2 border-border bg-background/60 px-4 py-2.5 text-center font-semibold outline-none focus:border-primary"
                style={{ borderColor: TEAM_COLORS[i] }}
              />
            ))}
          </div>
          <Button variant="gradient" size="lg" className="mt-6 w-full" onClick={start}>
            ابدأ العرض
          </Button>
          <Link href={`/games/${gameSlug}`} className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 md:p-8">
      {/* scoreboard */}
      <div className="flex items-stretch justify-between gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 rounded-2xl border-4 p-3 text-center" style={{ borderColor: TEAM_COLORS[i] }}>
            <div className="text-sm font-bold md:text-lg" style={{ color: TEAM_COLORS[i] }}>{names[i]}</div>
            <div className="font-display text-4xl font-extrabold tabular-nums md:text-6xl">{formatNumber(scores[i])}</div>
          </div>
        ))}
        <div className="grid place-items-center rounded-2xl border-4 border-primary px-4 text-center">
          <div className="text-xs text-muted-foreground md:text-sm">الرصيد</div>
          <div className="font-display text-3xl font-extrabold text-primary md:text-5xl">{formatNumber(pot)}</div>
          <div className="mt-1 flex gap-1">
            {[0, 1, 2].map((s) => (
              <X key={s} className={cn('size-5 md:size-7', s < strikes ? 'text-destructive' : 'text-muted-foreground/30')} strokeWidth={4} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={toggleFullscreen} className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:text-foreground" aria-label="ملء الشاشة">
            {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
          <Link href={`/games/${gameSlug}`} className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:text-foreground" aria-label="خروج">
            <X className="size-5" />
          </Link>
        </div>
      </div>

      {/* question */}
      <div className="mt-6 rounded-2xl border-4 border-primary/60 bg-card/70 p-5 text-center font-display text-2xl font-extrabold md:text-4xl">
        <span className="text-sm text-muted-foreground md:text-base">سؤال {qIndex + 1} / {questions.length}</span>
        <div className="mt-1">{question.prompt}</div>
      </div>

      {/* answer board */}
      <div className="mt-6 grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
        {question.answers.map((answer, i) => {
          const isRevealed = revealed.has(i);
          return (
            <button
              key={i}
              onClick={() => reveal(i)}
              className={cn(
                'flex items-center justify-between rounded-2xl border-4 px-5 py-4 text-right text-xl font-bold transition md:text-3xl',
                isRevealed ? 'border-success bg-success/15' : 'border-border bg-card/60 hover:border-primary/50',
              )}
            >
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-base text-muted-foreground md:size-12 md:text-xl">
                {i + 1}
              </span>
              {isRevealed ? (
                <span className="flex flex-1 items-center justify-between px-4">
                  <span>{answer.text}</span>
                  <span className="text-success">{answer.points}</span>
                </span>
              ) : (
                <span className="flex-1 px-4 text-muted-foreground/50">⬚⬚⬚⬚⬚</span>
              )}
            </button>
          );
        })}
      </div>

      {/* controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" size="lg" onClick={() => goto(-1)} disabled={qIndex === 0}>
          <ChevronRight className="size-5" /> السابق
        </Button>
        <Button variant="destructive" size="lg" onClick={addStrike}>
          <X className="size-5" strokeWidth={3} /> خطأ
        </Button>
        <Button size="lg" onClick={() => setStrikes(0)} variant="ghost">
          <RotateCcw className="size-5" />
        </Button>
        <Button size="lg" onClick={() => award(0)} className="text-[#06141a]" style={{ backgroundColor: TEAM_COLORS[0] }}>
          للفريق: {names[0]}
        </Button>
        <Button size="lg" onClick={() => award(1)} className="text-[#06141a]" style={{ backgroundColor: TEAM_COLORS[1] }}>
          للفريق: {names[1]}
        </Button>
        <Button variant="outline" size="lg" onClick={() => goto(1)} disabled={qIndex + 1 >= questions.length}>
          التالي <ChevronLeft className="size-5" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        اختصارات: الأرقام تكشف الإجابات · X خطأ · الأسهم للتنقّل
      </p>
    </div>
  );
}
