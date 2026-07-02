'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Timer, RotateCcw, Check, X, Volume2, VolumeX } from 'lucide-react';

import { recordPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/play/confetti';
import { findAnswerIndex } from '@/lib/match';
import { playCorrect, playWrong, playVictory, playTick, playTimeUp } from '@/lib/sounds';
import { cn, formatNumber } from '@/lib/utils';
import type { PlayQuestion } from '@/components/play/solo-game';

interface TeamGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  questions: PlayQuestion[];
}

const MAX_LIVES = 3;
const BETWEEN_MS = 2800;
const TEAM_COLORS = ['hsl(176 76% 49%)', '#F43F9D'];

export function TeamGame({ gameId, gameSlug, gameTitle, questions }: TeamGameProps) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'between' | 'finished'>('setup');
  const [names, setNames] = useState<[string, string]>(['الفريق الأول', 'الفريق الثاني']);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);

  const mutedRef = useRef(false);
  const toggleMute = () =>
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });
  const sfx = {
    correct: () => !mutedRef.current && playCorrect(),
    wrong: () => !mutedRef.current && playWrong(),
    finish: () => !mutedRef.current && playVictory(),
    tick: () => !mutedRef.current && playTick(),
    timeUp: () => !mutedRef.current && playTimeUp(),
  };

  const question = questions[qIndex];
  const activeTeam = qIndex % 2;
  const [timeLeft, setTimeLeft] = useState(question?.timeLimit ?? 60);
  const betweenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endTurn = useCallback(() => {
    setPhase('between');
    setRevealed(new Set(question.answers.map((_, i) => i)));
    betweenTimer.current = setTimeout(() => {
      setQIndex((prev) => {
        if (prev + 1 >= questions.length) {
          setPhase('finished');
          sfx.finish();
          void recordPlay(gameId);
          return prev;
        }
        return prev + 1;
      });
    }, BETWEEN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, questions.length, gameId]);

  useEffect(() => {
    if (phase === 'setup' || phase === 'finished' || !question) return;
    setRevealed(new Set());
    setLives(MAX_LIVES);
    setTimeLeft(question.timeLimit);
    setInput('');
    setPhase('playing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      sfx.timeUp();
      endTurn();
      return;
    }
    if (timeLeft <= 5) sfx.tick();
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, endTurn]);

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
      setScores((s) => {
        const copy: [number, number] = [s[0], s[1]];
        copy[activeTeam] += pts;
        return copy;
      });
      flashFeedback('correct', pts);
      sfx.correct();
      if (next.size === question.answers.length) {
        if (betweenTimer.current) clearTimeout(betweenTimer.current);
        setTimeout(endTurn, 600);
      }
    } else {
      flashFeedback('wrong');
      sfx.wrong();
      setLives((l) => {
        const remaining = l - 1;
        if (remaining <= 0) setTimeout(endTurn, 400);
        return Math.max(remaining, 0);
      });
    }
  }

  function startGame() {
    setScores([0, 0]);
    setQIndex(0);
    setRevealed(new Set());
    setLives(MAX_LIVES);
    setTimeLeft(questions[0].timeLimit);
    setInput('');
    setPhase('playing');
  }

  if (!question) {
    return <div className="container py-20 text-center text-muted-foreground">هذه اللعبة لا تحتوي أسئلة بعد.</div>;
  }

  // ---- setup ----
  if (phase === 'setup') {
    return (
      <div className="container grid min-h-[70vh] place-items-center">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold text-primary">{gameTitle}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">وضع الفريقين</h2>
          <p className="mt-1 text-sm text-muted-foreground">اكتبوا أسماء الفريقين، ثم مرّروا الجهاز بالتناوب.</p>
          <div className="mt-6 space-y-3 text-right">
            {[0, 1].map((i) => (
              <div key={i}>
                <label className="mb-1 block text-sm font-semibold" style={{ color: TEAM_COLORS[i] }}>
                  الفريق {i === 0 ? 'الأول' : 'الثاني'}
                </label>
                <input
                  value={names[i]}
                  maxLength={24}
                  onChange={(e) =>
                    setNames((n) => (i === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))
                  }
                  className="w-full rounded-xl border-2 border-border bg-background/60 px-4 py-2.5 text-center font-semibold outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          <Button variant="gradient" size="lg" className="mt-6 w-full" onClick={startGame}>
            ابدأوا اللعب
          </Button>
          <Link href={`/games/${gameSlug}`} className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  // ---- finished ----
  if (phase === 'finished') {
    const winner = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        {winner !== -1 && <Confetti />}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="glass w-full max-w-md rounded-3xl p-10"
        >
          <div className="text-6xl">{winner === -1 ? '🤝' : '🏆'}</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold">
            {winner === -1 ? 'تعادل!' : `فاز ${names[winner]}`}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-2xl border-2 p-4"
                style={{ borderColor: TEAM_COLORS[i], opacity: winner === -1 || winner === i ? 1 : 0.6 }}
              >
                <div className="text-sm font-semibold" style={{ color: TEAM_COLORS[i] }}>
                  {names[i]}
                </div>
                <div className="font-display text-4xl font-extrabold">{formatNumber(scores[i])}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="gradient" size="lg" onClick={startGame}>
              <RotateCcw className="size-5" /> العبوا مجددًا
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/games/${gameSlug}`}>رجوع للعبة</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- playing / between ----
  const answers = question.answers;
  return (
    <div className="container max-w-3xl py-6">
      {/* team scoreboards */}
      <div className="flex items-center justify-between gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-2xl border-2 px-4 py-2 text-center transition-all',
              activeTeam === i ? 'scale-105 shadow-glow' : 'opacity-60',
            )}
            style={{ borderColor: TEAM_COLORS[i] }}
          >
            <div className="text-xs font-semibold" style={{ color: TEAM_COLORS[i] }}>
              {names[i]} {activeTeam === i && '• دوركم'}
            </div>
            <div className="text-xl font-extrabold tabular-nums">{formatNumber(scores[i])}</div>
          </div>
        ))}
        <button type="button" onClick={toggleMute} className="text-muted-foreground hover:text-foreground" aria-label="صوت">
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <Link href={`/games/${gameSlug}`} aria-label="خروج" className="hover:text-foreground">
          <X className="size-5" />
        </Link>
        <span>سؤال {qIndex + 1} / {questions.length}</span>
        <span className="inline-flex items-center gap-1">
          <Timer className="size-4" /> {timeLeft}s
        </span>
      </div>

      <div
        className="mt-3 rounded-2xl border-2 bg-card/70 p-4 text-center font-display text-lg font-bold shadow-glow"
        style={{ borderColor: TEAM_COLORS[activeTeam] }}
      >
        {question.prompt}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <motion.div
          className="flex-1"
          animate={flash === 'wrong' ? { x: [0, -9, 9, -7, 7, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={submitGuess}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={phase !== 'playing'}
              placeholder={`إجابة ${names[activeTeam]}…`}
              autoFocus
              className={cn(
                'w-full rounded-2xl border-2 px-5 py-3 text-center text-lg font-semibold outline-none transition-colors',
                flash === 'correct' && 'border-success bg-success/10 ring-2 ring-success/40',
                flash === 'wrong' && 'border-destructive bg-destructive/10 ring-2 ring-destructive/40',
                !flash && 'border-border bg-background/60 focus:border-primary',
              )}
            />
          </form>
        </motion.div>
        <div className="relative flex items-center gap-1 rounded-2xl border-2 border-border bg-card/70 px-3 py-3">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} className={cn('size-4', i < lives ? 'fill-[#F43F9D] text-[#F43F9D]' : 'text-muted-foreground/40')} />
          ))}
          <AnimatePresence>
            {gain && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -26 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 right-2 font-extrabold text-success"
              >
                +{gain}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {answers.map((answer, i) => {
          const isRevealed = revealed.has(i);
          return (
            <motion.div
              key={i}
              layout
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors',
                isRevealed ? 'border-success/50 bg-success/10' : 'border-border bg-card/50',
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                #{i + 1}
              </span>
              {isRevealed ? (
                <span className="flex w-full items-center justify-between font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-success" />
                    {answer.text}
                  </span>
                  <span className="text-success">{answer.points}</span>
                </span>
              ) : (
                <span className="h-2 w-full rounded-full bg-muted" />
              )}
            </motion.div>
          );
        })}
      </div>

      {phase === 'between' && (
        <p className="mt-5 text-center text-sm font-semibold" style={{ color: TEAM_COLORS[(qIndex + 1) % 2] }}>
          استعدوا… الدور القادم لـ {names[(qIndex + 1) % 2]}
        </p>
      )}
    </div>
  );
}
