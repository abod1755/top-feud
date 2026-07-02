'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Timer, RotateCcw, X, Volume2, VolumeX, Flame } from 'lucide-react';

import { recordPlay, recordScore } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/play/confetti';
import { playCorrect, playWrong, playVictory, playTick, playTimeUp } from '@/lib/sounds';
import { cn, formatNumber } from '@/lib/utils';

/** One multiple-choice question. `imageUrl` makes it a photo question. */
export interface McqPlayQuestion {
  prompt: string;
  imageUrl?: string;
  options: string[];
  correct: number;
  seconds: number;
}

interface QuizGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  questions: McqPlayQuestion[];
}

const BETWEEN_MS = 1400;
const BASE_POINTS = 50;

/** Timed MCQ engine: faster answers earn more, streaks add a bonus. */
export function QuizGame({ gameId, gameSlug, gameTitle, questions }: QuizGameProps) {
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'revealed' | 'finished'>('playing');
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gain, setGain] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);

  const question = questions[qIndex];
  const [timeLeft, setTimeLeft] = useState(question?.seconds ?? 15);
  const mutedRef = useRef(false);
  const scoreRef = useRef(0);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMute = () =>
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });

  const goNext = useCallback(() => {
    nextTimer.current = setTimeout(() => {
      setQIndex((prev) => {
        if (prev + 1 >= questions.length) {
          setPhase('finished');
          if (!mutedRef.current) playVictory();
          void recordPlay(gameId);
          void recordScore(gameId, scoreRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, BETWEEN_MS);
  }, [questions.length, gameId]);

  // Reset per question.
  useEffect(() => {
    if (!question) return;
    setPicked(null);
    setTimeLeft(question.seconds);
    setPhase('playing');
  }, [question, qIndex]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('revealed');
      setStreak(0);
      if (!mutedRef.current) playTimeUp();
      goNext();
      return;
    }
    if (timeLeft <= 5 && !mutedRef.current) playTick();
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, goNext]);

  useEffect(() => () => void (nextTimer.current && clearTimeout(nextTimer.current)), []);

  function pick(i: number) {
    if (phase !== 'playing') return;
    setPicked(i);
    setPhase('revealed');

    if (i === question.correct) {
      // Speed bonus: up to +BASE_POINTS extra when answering instantly.
      const bonus = Math.round((BASE_POINTS * timeLeft) / question.seconds);
      const streakBonus = Math.min(streak, 5) * 10;
      const pts = BASE_POINTS + bonus + streakBonus;
      setScore((s) => {
        const ns = s + pts;
        scoreRef.current = ns;
        return ns;
      });
      setGain(pts);
      setTimeout(() => setGain(null), 900);
      setStreak((s) => s + 1);
      setCorrectCount((c) => c + 1);
      if (!mutedRef.current) playCorrect();
    } else {
      setStreak(0);
      if (!mutedRef.current) playWrong();
    }
    goNext();
  }

  function restart() {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setCorrectCount(0);
    setQIndex(0);
    setPicked(null);
    setTimeLeft(questions[0]?.seconds ?? 15);
    setPhase('playing');
  }

  if (!question) {
    return (
      <div className="container py-20 text-center text-muted-foreground">هذه اللعبة لا تحتوي أسئلة بعد.</div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <Confetti />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="glass w-full max-w-md rounded-3xl p-10"
        >
          <div className="text-6xl">⚡</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold">انتهى الكويز!</h2>
          <p className="mt-2 text-muted-foreground">{gameTitle}</p>
          <div className="mt-6 text-sm text-muted-foreground">
            أجبت {formatNumber(correctCount)} من {formatNumber(questions.length)} صح
          </div>
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

  const urgent = phase === 'playing' && timeLeft <= 5;

  return (
    <div className="container max-w-3xl py-6">
      <div className="flex items-center justify-between">
        <Link href={`/games/${gameSlug}`} className="text-muted-foreground hover:text-foreground" aria-label="خروج">
          <X className="size-6" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground">
          سؤال {qIndex + 1} / {questions.length}
        </span>
        <button
          type="button"
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground"
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      {/* score / timer / streak strip */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-border bg-card/70 px-5 py-3">
        <div className="relative text-2xl font-extrabold tabular-nums">
          {formatNumber(score)}
          <AnimatePresence>
            {gain && (
              <motion.span
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -22 }}
                exit={{ opacity: 0 }}
                className="absolute -top-1 right-full ml-2 whitespace-nowrap px-2 text-base font-extrabold text-success"
              >
                +{gain}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {streak >= 2 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFCE1F]/20 px-3 py-1 text-sm font-bold text-[#FFCE1F]">
            <Flame className="size-4" /> {streak} متتالية
          </span>
        )}
        <div
          className={cn(
            'flex items-center gap-1.5 text-lg font-bold tabular-nums',
            urgent ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          <Timer className="size-5" /> {timeLeft}
        </div>
      </div>

      {/* question */}
      <div className="mt-5 rounded-2xl border-2 border-primary/60 bg-card/70 p-4 text-center shadow-glow">
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.imageUrl}
            alt=""
            className="mx-auto mb-3 max-h-64 w-auto rounded-xl object-contain"
          />
        )}
        {question.prompt && <div className="font-display text-lg font-bold">{question.prompt}</div>}
      </div>

      {/* options */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const revealed = phase === 'revealed';
          const isCorrect = i === question.correct;
          const isPicked = i === picked;
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={revealed}
              whileTap={{ scale: 0.97 }}
              animate={revealed && isPicked && !isCorrect ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              className={cn(
                'rounded-2xl border-2 px-4 py-4 text-center font-semibold transition-colors',
                !revealed && 'border-border bg-card/50 hover:border-primary hover:bg-primary/10',
                revealed && isCorrect && 'border-success bg-success/15 text-success',
                revealed && isPicked && !isCorrect && 'border-destructive bg-destructive/15 text-destructive-foreground',
                revealed && !isPicked && !isCorrect && 'border-border bg-card/30 opacity-50',
              )}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
