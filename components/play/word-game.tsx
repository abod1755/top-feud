'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Timer, RotateCcw, X, Volume2, VolumeX, Check } from 'lucide-react';

import { recordPlay, recordScore } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import { ARABIC_WORDS } from '@/lib/arabic-words';
import { normalizeArabic } from '@/lib/match';
import { Confetti } from '@/components/play/confetti';
import { playCorrect, playWrong, playVictory, playTick } from '@/lib/sounds';
import { cn, formatNumber } from '@/lib/utils';

export interface WordRound {
  letters: string[];
  duration: number;
  minLen: number;
}
interface WordGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  rounds: WordRound[];
}

/** Counts how many of each letter are available (normalized). */
function letterCounts(letters: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const raw of letters) {
    const l = normalizeArabic(raw);
    if (l) m.set(l, (m.get(l) ?? 0) + 1);
  }
  return m;
}

function canForm(word: string, counts: Map<string, number>): boolean {
  const used = new Map<string, number>();
  for (const ch of word) {
    used.set(ch, (used.get(ch) ?? 0) + 1);
    if ((used.get(ch) ?? 0) > (counts.get(ch) ?? 0)) return false;
  }
  return true;
}

export function WordGame({ gameId, gameSlug, gameTitle, rounds }: WordGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'finished'>('playing');
  const [input, setInput] = useState('');
  const [found, setFound] = useState<{ word: string; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const round = rounds[roundIndex];
  const [timeLeft, setTimeLeft] = useState(round?.duration ?? 60);
  const mutedRef = useRef(false);
  const scoreRef = useRef(0);
  const counts = round ? letterCounts(round.letters) : new Map();

  const toggleMute = () => setMuted((m) => { mutedRef.current = !m; return !m; });

  const nextRound = useCallback(() => {
    setRoundIndex((prev) => {
      if (prev + 1 >= rounds.length) {
        setPhase('finished');
        if (!mutedRef.current) playVictory();
        void recordPlay(gameId);
        void recordScore(gameId, scoreRef.current);
        return prev;
      }
      return prev + 1;
    });
  }, [rounds.length, gameId]);

  // Reset per round.
  useEffect(() => {
    if (!round) return;
    setTimeLeft(round.duration);
    setFound([]);
    setInput('');
    setPhase('playing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      nextRound();
      return;
    }
    if (timeLeft <= 5 && !mutedRef.current) playTick();
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, nextRound]);

  function feedback(kind: 'correct' | 'wrong', msg?: string) {
    setFlash(kind);
    setHint(msg ?? null);
    if (kind === 'correct' && !mutedRef.current) playCorrect();
    if (kind === 'wrong' && !mutedRef.current) playWrong();
    setTimeout(() => {
      setFlash(null);
      setHint(null);
    }, 900);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== 'playing') return;
    const g = normalizeArabic(input);
    setInput('');
    if (!g) return;
    if (g.length < round.minLen) return feedback('wrong', `الحد الأدنى ${round.minLen} أحرف`);
    if (found.some((f) => f.word === g)) return feedback('wrong', 'مكرّرة');
    if (!canForm(g, counts)) return feedback('wrong', 'أحرف غير متاحة');
    if (!ARABIC_WORDS.has(g)) return feedback('wrong', 'غير موجودة في القاموس');

    const points = g.length;
    setFound((prev) => [{ word: g, points }, ...prev]);
    setScore((s) => {
      const ns = s + points;
      scoreRef.current = ns;
      return ns;
    });
    feedback('correct');
  }

  function restart() {
    setScore(0);
    scoreRef.current = 0;
    setRoundIndex(0);
    setFound([]);
    setInput('');
    setTimeLeft(rounds[0].duration);
    setPhase('playing');
  }

  if (!round) {
    return <div className="container py-20 text-center text-muted-foreground">هذه اللعبة لا تحتوي جولات بعد.</div>;
  }

  if (phase === 'finished') {
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <Confetti />
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} className="glass w-full max-w-md rounded-3xl p-10">
          <div className="text-6xl">🏆</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold">انتهى السباق!</h2>
          <p className="mt-2 text-muted-foreground">{gameTitle}</p>
          <div className="mt-6 text-sm text-muted-foreground">مجموع نقاطك</div>
          <div className="text-sticker font-display text-6xl font-extrabold">{formatNumber(score)}</div>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="gradient" size="lg" onClick={restart}><RotateCcw className="size-5" /> العب مجددًا</Button>
            <Button asChild variant="outline" size="lg"><Link href="/leaderboard">لوحة الصدارة</Link></Button>
            <Button asChild variant="ghost" size="lg"><Link href={`/games/${gameSlug}`}>رجوع للعبة</Link></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <div className="flex items-center justify-between">
        <Link href={`/games/${gameSlug}`} className="text-muted-foreground hover:text-foreground" aria-label="خروج"><X className="size-6" /></Link>
        <span className="text-sm font-semibold text-muted-foreground">جولة {roundIndex + 1} / {rounds.length}</span>
        <button type="button" onClick={toggleMute} className="text-muted-foreground hover:text-foreground" aria-label="صوت">
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      {/* letters */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {round.letters.map((l, i) => (
          <span key={i} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-primary/50 bg-card/70 font-display text-2xl font-extrabold shadow-glow">
            {l}
          </span>
        ))}
      </div>

      {/* status row */}
      <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
        <motion.div animate={flash === 'wrong' ? { x: [0, -9, 9, -7, 7, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
          <form onSubmit={submit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="كوّن كلمة من الأحرف…"
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
        <div className="grid place-items-center rounded-2xl border-2 border-border bg-card/70 px-5 py-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Timer className="size-3.5" /> {timeLeft}s</span>
          <span className="text-2xl font-extrabold tabular-nums">{formatNumber(score)}</span>
        </div>
      </div>

      <div className="mt-2 h-5 text-center text-sm">
        <AnimatePresence>
          {hint && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={flash === 'wrong' ? 'text-destructive' : 'text-success'}>
              {hint}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* found words */}
      <div className="mt-4">
        <p className="mb-2 text-sm text-muted-foreground">كلماتك ({found.length})</p>
        <div className="flex flex-wrap gap-2">
          {found.map((f, i) => (
            <motion.span key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-sm font-semibold">
              <Check className="size-3.5 text-success" /> {f.word} <span className="text-success">+{f.points}</span>
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
