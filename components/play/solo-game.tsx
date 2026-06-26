'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Timer, RotateCcw, ArrowLeft, Check, X } from 'lucide-react';

import { recordPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import { findAnswerIndex } from '@/lib/match';
import { cn, formatNumber } from '@/lib/utils';

export interface PlayAnswer {
  text: string;
  points: number;
}
export interface PlayQuestion {
  id: string;
  prompt: string;
  timeLimit: number;
  answers: PlayAnswer[];
}
interface SoloGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  questions: PlayQuestion[];
}

const MAX_LIVES = 3;
const BETWEEN_MS = 2600;

export function SoloGame({ gameId, gameSlug, gameTitle, questions }: SoloGameProps) {
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'between' | 'finished'>('playing');
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [gain, setGain] = useState<number | null>(null);

  const question = questions[qIndex];
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit ?? 60);
  const betweenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endQuestion = useCallback(() => {
    setPhase('between');
    setRevealed(new Set(question.answers.map((_, i) => i))); // reveal all (incl. missed)
    betweenTimer.current = setTimeout(() => {
      setQIndex((prev) => {
        if (prev + 1 >= questions.length) {
          setPhase('finished');
          void recordPlay(gameId);
          return prev;
        }
        return prev + 1;
      });
    }, BETWEEN_MS);
  }, [question, questions.length, gameId]);

  // Reset per-question state when the question changes.
  useEffect(() => {
    if (!question) return;
    setRevealed(new Set());
    setLives(MAX_LIVES);
    setTimeLeft(question.timeLimit);
    setPhase('playing');
    setInput('');
  }, [question]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      endQuestion();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, endQuestion]);

  useEffect(() => () => void (betweenTimer.current && clearTimeout(betweenTimer.current)), []);

  function flashFeedback(kind: 'correct' | 'wrong', points?: number) {
    setFlash(kind);
    if (points) setGain(points);
    setTimeout(() => {
      setFlash(null);
      setGain(null);
    }, 700);
  }

  function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== 'playing' || !input.trim()) return;

    const idx = findAnswerIndex(input, question.answers, revealed);
    setInput('');

    if (idx >= 0) {
      const next = new Set(revealed);
      next.add(idx);
      setRevealed(next);
      const pts = question.answers[idx].points;
      setScore((s) => s + pts);
      flashFeedback('correct', pts);
      if (next.size === question.answers.length) {
        if (betweenTimer.current) clearTimeout(betweenTimer.current);
        setTimeout(endQuestion, 600);
      }
    } else {
      flashFeedback('wrong');
      setLives((l) => {
        const remaining = l - 1;
        if (remaining <= 0) setTimeout(endQuestion, 400);
        return Math.max(remaining, 0);
      });
    }
  }

  function restart() {
    if (betweenTimer.current) clearTimeout(betweenTimer.current);
    setScore(0);
    setQIndex(0);
    setRevealed(new Set());
    setLives(MAX_LIVES);
    setTimeLeft(questions[0].timeLimit);
    setPhase('playing');
    setInput('');
  }

  if (!question) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        هذه اللعبة لا تحتوي أسئلة بعد.
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="glass w-full max-w-md rounded-3xl p-10"
        >
          <div className="text-6xl">🏆</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold">انتهت اللعبة!</h2>
          <p className="mt-2 text-muted-foreground">{gameTitle}</p>
          <div className="mt-6 text-sm text-muted-foreground">مجموع نقاطك</div>
          <div className="text-sticker font-display text-6xl font-extrabold">{formatNumber(score)}</div>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="gradient" size="lg" onClick={restart}>
              <RotateCcw className="size-5" /> العب مجددًا
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/games/${gameSlug}`}>رجوع للعبة</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const answers = question.answers;

  return (
    <div className="container max-w-3xl py-6">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <Link href={`/games/${gameSlug}`} className="text-muted-foreground hover:text-foreground" aria-label="خروج">
          <X className="size-6" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground">
          سؤال {qIndex + 1} / {questions.length}
        </span>
        <span className="w-6" />
      </div>

      {/* question banner */}
      <div className="mt-4 rounded-2xl border-2 border-primary/60 bg-card/70 p-4 text-center font-display text-lg font-bold shadow-glow">
        {question.prompt}
      </div>

      {/* input + status */}
      <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
        <form onSubmit={submitGuess}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={phase !== 'playing'}
            placeholder="اكتب إجابتك هنا…"
            autoFocus
            className={cn(
              'h-full w-full rounded-2xl border-2 bg-background/60 px-5 text-center text-lg font-semibold outline-none transition',
              flash === 'correct' && 'border-primary',
              flash === 'wrong' && 'border-destructive',
              !flash && 'border-border focus:border-primary',
            )}
          />
        </form>
        <div className="relative grid place-items-center rounded-2xl border-2 border-border bg-card/70 px-5 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="size-3.5" /> {timeLeft}s
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{formatNumber(score)}</div>
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={cn('size-4', i < lives ? 'fill-[#F43F9D] text-[#F43F9D]' : 'text-muted-foreground/40')}
              />
            ))}
          </div>
          <AnimatePresence>
            {gain && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -24 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 font-extrabold text-primary"
              >
                +{gain}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* board */}
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {answers.map((answer, i) => {
          const isRevealed = revealed.has(i);
          return (
            <motion.div
              key={i}
              layout
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm',
                isRevealed ? 'border-primary/40 bg-primary/10' : 'border-border bg-card/50',
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                #{i + 1}
              </span>
              {isRevealed ? (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex w-full items-center justify-between font-semibold"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-primary" />
                    {answer.text}
                  </span>
                  <span className="text-primary">{answer.points}</span>
                </motion.span>
              ) : (
                <span className="h-2 w-full rounded-full bg-muted" />
              )}
            </motion.div>
          );
        })}
      </div>

      {phase === 'between' && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <ArrowLeft className="inline size-4" /> ننتقل للسؤال التالي…
        </p>
      )}
    </div>
  );
}
