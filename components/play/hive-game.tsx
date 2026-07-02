'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, Eye, Volume2, VolumeX } from 'lucide-react';

import { recordPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import { playCorrect, playWrong, playFinish } from '@/lib/sounds';
import { cn } from '@/lib/utils';

export interface HivePlayCell {
  letter: string;
  question: string;
  answer: string;
}

interface HiveGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  cells: HivePlayCell[];
}

const SIZE = 5;

type Team = 'a' | 'b';
type Claim = Team | null;

const TEAM_INFO: Record<Team, { name: string; color: string; goal: string }> = {
  a: { name: 'الفريق الأخضر', color: '#2FD573', goal: 'يوصل يمين ↔ يسار' },
  b: { name: 'الفريق الوردي', color: '#F43F9D', goal: 'يوصل فوق ↕ تحت' },
};

/** Hex-grid neighbors for an odd-r offset layout (odd rows shifted). */
function neighbors(col: number, row: number): [number, number][] {
  const odd = row % 2 === 1;
  const diag: [number, number][] = odd
    ? [
        [col, row - 1],
        [col + 1, row - 1],
        [col, row + 1],
        [col + 1, row + 1],
      ]
    : [
        [col - 1, row - 1],
        [col, row - 1],
        [col - 1, row + 1],
        [col, row + 1],
      ];
  return [[col - 1, row], [col + 1, row], ...diag].filter(
    ([c, r]) => c >= 0 && c < SIZE && r >= 0 && r < SIZE,
  ) as [number, number][];
}

/** BFS: does `team` connect its two sides? a = left↔right (cols), b = top↔bottom (rows). */
function hasWon(claims: Claim[], team: Team): boolean {
  const owned = (c: number, r: number) => claims[r * SIZE + c] === team;
  const starts: [number, number][] = [];
  for (let i = 0; i < SIZE; i++) {
    if (team === 'a' && owned(0, i)) starts.push([0, i]);
    if (team === 'b' && owned(i, 0)) starts.push([i, 0]);
  }
  const seen = new Set(starts.map(([c, r]) => r * SIZE + c));
  const queue = [...starts];
  while (queue.length) {
    const [c, r] = queue.pop()!;
    if (team === 'a' && c === SIZE - 1) return true;
    if (team === 'b' && r === SIZE - 1) return true;
    for (const [nc, nr] of neighbors(c, r)) {
      const key = nr * SIZE + nc;
      if (!seen.has(key) && owned(nc, nr)) {
        seen.add(key);
        queue.push([nc, nr]);
      }
    }
  }
  return false;
}

/**
 * خلية الحروف — local presenter game: two teams take turns picking a letter
 * cell; a correct answer (host judges) claims the cell. First team to connect
 * its two sides of the hex board wins.
 */
export function HiveGame({ gameId, gameSlug, gameTitle, cells }: HiveGameProps) {
  const [claims, setClaims] = useState<Claim[]>(() => Array(cells.length).fill(null));
  const [turn, setTurn] = useState<Team>('a');
  const [openCell, setOpenCell] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [winner, setWinner] = useState<Team | null>(null);
  const [muted, setMuted] = useState(false);

  const rows = useMemo(
    () => Array.from({ length: SIZE }, (_, r) => cells.slice(r * SIZE, r * SIZE + SIZE)),
    [cells],
  );

  function closeModal() {
    setOpenCell(null);
    setShowAnswer(false);
  }

  function award(team: Team | null) {
    if (openCell === null) return;
    if (team) {
      const next = [...claims];
      next[openCell] = team;
      setClaims(next);
      if (!muted) playCorrect();
      if (hasWon(next, team)) {
        setWinner(team);
        if (!muted) playFinish();
        void recordPlay(gameId);
      }
    } else if (!muted) {
      playWrong();
    }
    setTurn((t) => (t === 'a' ? 'b' : 'a'));
    closeModal();
  }

  function restart() {
    setClaims(Array(cells.length).fill(null));
    setTurn('a');
    setWinner(null);
    closeModal();
  }

  if (winner) {
    const info = TEAM_INFO[winner];
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="glass w-full max-w-md rounded-3xl p-10"
        >
          <div className="text-6xl">🏆</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold" style={{ color: info.color }}>
            فاز {info.name}!
          </h2>
          <p className="mt-2 text-muted-foreground">وصّل طرفي الخلية في {gameTitle}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="gradient" size="lg" onClick={restart}>
              <RotateCcw className="size-5" /> جولة جديدة
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/games/${gameSlug}`}>رجوع للعبة</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const current = TEAM_INFO[turn];

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between">
        <Link href={`/games/${gameSlug}`} className="text-muted-foreground hover:text-foreground" aria-label="خروج">
          <X className="size-6" />
        </Link>
        <h1 className="font-display text-xl font-extrabold">{gameTitle}</h1>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      {/* turn + goals */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {(['a', 'b'] as Team[]).map((t) => (
          <div
            key={t}
            className={cn(
              'rounded-full border-2 px-4 py-1.5 text-sm font-bold transition',
              turn === t ? 'scale-105' : 'opacity-50',
            )}
            style={{ borderColor: TEAM_INFO[t].color, color: TEAM_INFO[t].color }}
          >
            {TEAM_INFO[t].name} — {TEAM_INFO[t].goal}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        الدور على <span style={{ color: current.color }} className="font-bold">{current.name}</span> — اختاروا حرفًا
      </p>

      {/* board: green edges right/left, pink edges top/bottom */}
      <div
        className="mx-auto mt-6 w-fit rounded-3xl p-3 sm:p-4"
        style={{
          background: `linear-gradient(to bottom, ${TEAM_INFO.b.color}33, transparent 18%, transparent 82%, ${TEAM_INFO.b.color}33), linear-gradient(to right, ${TEAM_INFO.a.color}33, transparent 18%, transparent 82%, ${TEAM_INFO.a.color}33)`,
        }}
      >
        {rows.map((row, r) => (
          <div
            key={r}
            className={cn('flex', r > 0 && '-mt-3 sm:-mt-4', r % 2 === 1 && 'ps-7 sm:ps-10')}
          >
            {row.map((cell, c) => {
              const idx = r * SIZE + c;
              const claim = claims[idx];
              return (
                <button
                  key={c}
                  type="button"
                  disabled={claim !== null}
                  onClick={() => setOpenCell(idx)}
                  className={cn(
                    'grid h-16 w-14 place-items-center font-display text-xl font-extrabold transition-transform sm:h-[5.25rem] sm:w-[4.5rem] sm:text-2xl',
                    claim === null && 'bg-card text-foreground hover:scale-105 hover:bg-primary/25',
                  )}
                  style={{
                    clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                    ...(claim ? { backgroundColor: TEAM_INFO[claim].color, color: '#06141a' } : {}),
                  }}
                  aria-label={`الخلية ${cell.letter}`}
                >
                  {cell.letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* question modal */}
      <AnimatePresence>
        {openCell !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 12 }}
              className="glass w-full max-w-lg rounded-3xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="mx-auto grid h-16 w-14 place-items-center font-display text-2xl font-extrabold text-[#06141a]"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                  backgroundColor: current.color,
                }}
              >
                {cells[openCell].letter}
              </div>
              <p className="mt-4 font-display text-xl font-bold">{cells[openCell].question}</p>
              <p className="mt-1 text-sm text-muted-foreground">الإجابة تبدأ بحرف «{cells[openCell].letter}»</p>

              {showAnswer ? (
                <p className="mt-4 rounded-xl bg-success/15 px-4 py-3 font-bold text-success">
                  {cells[openCell].answer}
                </p>
              ) : (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAnswer(true)}>
                  <Eye className="size-4" /> إظهار الإجابة
                </Button>
              )}

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['a', 'b'] as Team[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => award(t)}
                    className="btn-chunky py-2.5 text-sm text-[#06141a]"
                    style={{ backgroundColor: TEAM_INFO[t].color }}
                  >
                    نقطة لـ{TEAM_INFO[t].name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => award(null)}
                  className="rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  لا أحد أجاب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
