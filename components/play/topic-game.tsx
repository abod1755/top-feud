'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Maximize, Minimize, RotateCcw, Star, Check, ChevronLeft } from 'lucide-react';

import { recordPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';
import type { PlayQuestion } from '@/components/play/solo-game';
import { playCorrect, playWrong, playFinish } from '@/lib/sounds';
import { cn, formatNumber } from '@/lib/utils';

export interface PlayTopic {
  title: string;
  questions: PlayQuestion[];
}
interface TopicGameProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  topics: PlayTopic[];
}

const TEAM_COLORS = ['hsl(176 76% 49%)', '#F43F9D'];

/** Splits a leading emoji (if any) from a topic title for nicer cards. */
function splitEmoji(title: string): { emoji: string | null; label: string } {
  const m = title.match(/^([^\p{L}\p{N}\s]+)\s*(.*)$/u);
  if (m && m[2]) return { emoji: m[1], label: m[2] };
  return { emoji: null, label: title };
}

export function TopicGame({ gameId, gameSlug, gameTitle, topics }: TopicGameProps) {
  const [phase, setPhase] = useState<'setup' | 'grid' | 'playing' | 'finished'>('setup');
  const [names, setNames] = useState<[string, string]>(['الفريق الأزرق', 'الفريق الوردي']);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [activeTeam, setActiveTeam] = useState<0 | 1>(0);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [topicIndex, setTopicIndex] = useState<number | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [strikes, setStrikes] = useState(0);
  const [fs, setFs] = useState(false);
  const mutedRef = useRef(false);

  const topic = topicIndex !== null ? topics[topicIndex] : null;
  const question = topic ? topic.questions[qIndex] : null;

  const reveal = useCallback(
    (i: number) => {
      if (!question || i >= question.answers.length || revealed.has(i)) return;
      setRevealed((prev) => new Set(prev).add(i));
      setScores((s) => {
        const copy: [number, number] = [s[0], s[1]];
        copy[activeTeam] += question.answers[i].points;
        return copy;
      });
      if (!mutedRef.current) playCorrect();
    },
    [question, revealed, activeTeam],
  );

  const addStrike = useCallback(() => {
    setStrikes((s) => Math.min(s + 1, 3));
    if (!mutedRef.current) playWrong();
  }, []);

  const finishTopic = useCallback(() => {
    if (topicIndex === null) return;
    setUsed((prev) => {
      const next = new Set(prev).add(topicIndex);
      if (next.size >= topics.length) {
        setPhase('finished');
        if (!mutedRef.current) playFinish();
      } else {
        setActiveTeam((t) => (t === 0 ? 1 : 0));
        setPhase('grid');
      }
      return next;
    });
    setTopicIndex(null);
  }, [topicIndex, topics.length]);

  function nextQuestion() {
    if (!topic) return;
    if (qIndex + 1 >= topic.questions.length) {
      finishTopic();
    } else {
      setQIndex((q) => q + 1);
      setRevealed(new Set());
      setStrikes(0);
    }
  }

  function pickTopic(i: number) {
    if (used.has(i)) return;
    setTopicIndex(i);
    setQIndex(0);
    setRevealed(new Set());
    setStrikes(0);
    setPhase('playing');
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

  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      if (e.key >= '1' && e.key <= '9') reveal(Number(e.key) - 1);
      else if (e.key === '0') reveal(9);
      else if (e.key.toLowerCase() === 'x') addStrike();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, reveal, addStrike]);

  function start() {
    void recordPlay(gameId);
    setPhase('grid');
  }
  function restart() {
    setScores([0, 0]);
    setActiveTeam(0);
    setUsed(new Set());
    setTopicIndex(null);
    setPhase('grid');
  }

  if (topics.length === 0) {
    return <div className="container py-20 text-center text-muted-foreground">هذه اللعبة لا تحتوي مواضيع بعد.</div>;
  }

  // ---- setup ----
  if (phase === 'setup') {
    return (
      <div className="container grid min-h-[80vh] place-items-center">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold text-primary">{gameTitle}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">وضع المضيف / التلفاز</h2>
          <p className="mt-1 text-sm text-muted-foreground">كل فريق يختار موضوعًا من الشبكة بالتناوب.</p>
          <div className="mt-6 space-y-3 text-right">
            {[0, 1].map((i) => (
              <input
                key={i}
                value={names[i]}
                maxLength={24}
                onChange={(e) => setNames((n) => (i === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
                className="w-full rounded-xl border-2 bg-background/60 px-4 py-2.5 text-center font-semibold outline-none"
                style={{ borderColor: TEAM_COLORS[i] }}
              />
            ))}
          </div>
          <Button variant="gradient" size="lg" className="mt-6 w-full" onClick={start}>ابدأ</Button>
          <Link href={`/games/${gameSlug}`} className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground">رجوع</Link>
        </div>
      </div>
    );
  }

  // ---- finished ----
  if (phase === 'finished') {
    const winner = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
    return (
      <div className="container grid min-h-[70vh] place-items-center text-center">
        <div className="glass w-full max-w-md rounded-3xl p-10">
          <div className="text-6xl">{winner === -1 ? '🤝' : '🏆'}</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold">{winner === -1 ? 'تعادل!' : `فاز ${names[winner]}`}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border-2 p-4" style={{ borderColor: TEAM_COLORS[i], opacity: winner === -1 || winner === i ? 1 : 0.6 }}>
                <div className="text-sm font-semibold" style={{ color: TEAM_COLORS[i] }}>{names[i]}</div>
                <div className="font-display text-4xl font-extrabold">{formatNumber(scores[i])}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="gradient" size="lg" onClick={restart}><RotateCcw className="size-5" /> العبوا مجددًا</Button>
            <Button asChild variant="outline" size="lg"><Link href={`/games/${gameSlug}`}>رجوع للعبة</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- topic grid ----
  if (phase === 'grid') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="flex items-center justify-between gap-3">
          {[0, 1].map((i) => (
            <div key={i} className={cn('flex-1 rounded-2xl border-4 p-2 text-center transition', activeTeam === i ? 'scale-105' : 'opacity-60')} style={{ borderColor: TEAM_COLORS[i] }}>
              <div className="text-xs font-bold md:text-sm" style={{ color: TEAM_COLORS[i] }}>{names[i]}</div>
              <div className="font-display text-2xl font-extrabold md:text-4xl">{formatNumber(scores[i])}</div>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={toggleFullscreen} className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:text-foreground" aria-label="ملء الشاشة">
              {fs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
            <Link href={`/games/${gameSlug}`} className="rounded-xl border-2 border-border p-2 text-muted-foreground hover:text-foreground" aria-label="خروج"><X className="size-5" /></Link>
          </div>
        </div>

        <h2 className="mt-6 text-center font-display text-2xl font-extrabold md:text-3xl">
          دور <span style={{ color: TEAM_COLORS[activeTeam] }}>{names[activeTeam]}</span> — اختر موضوعًا
        </h2>

        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {topics.map((t, i) => {
            const isUsed = used.has(i);
            const { emoji, label } = splitEmoji(t.title);
            return (
              <button
                key={i}
                onClick={() => pickTopic(i)}
                disabled={isUsed}
                className={cn(
                  'relative rounded-2xl border-2 bg-card/70 p-5 text-center transition',
                  isUsed ? 'cursor-not-allowed border-border opacity-40' : 'border-border hover:-translate-y-1 hover:border-primary/60',
                )}
              >
                <Star className="absolute left-3 top-3 size-4 text-muted-foreground/40" />
                {isUsed && <Check className="absolute right-3 top-3 size-4 text-success" />}
                <div className="text-3xl">{emoji ?? '🎯'}</div>
                <div className="mt-2 font-display text-lg font-extrabold">{label}</div>
                <div className="text-xs text-muted-foreground">{t.questions.length} سؤال</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- playing a topic ----
  if (!question || !topic) {
    return <div className="container py-20 text-center text-muted-foreground">لا توجد أسئلة في هذا الموضوع.</div>;
  }
  return (
    <div className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        {[0, 1].map((i) => (
          <div key={i} className={cn('flex-1 rounded-2xl border-4 p-2 text-center', activeTeam === i ? '' : 'opacity-60')} style={{ borderColor: TEAM_COLORS[i] }}>
            <div className="text-xs font-bold md:text-sm" style={{ color: TEAM_COLORS[i] }}>{names[i]} {activeTeam === i && '• دوركم'}</div>
            <div className="font-display text-2xl font-extrabold md:text-4xl">{formatNumber(scores[i])}</div>
          </div>
        ))}
        <div className="grid place-items-center rounded-2xl border-4 border-border px-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((s) => (<X key={s} className={cn('size-5', s < strikes ? 'text-destructive' : 'text-muted-foreground/30')} strokeWidth={4} />))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border-4 border-primary/60 bg-card/70 p-5 text-center font-display text-2xl font-extrabold md:text-4xl">
        <span className="text-sm text-muted-foreground">{topic.title} · سؤال {qIndex + 1}/{topic.questions.length}</span>
        <div className="mt-1">{question.prompt}</div>
      </div>

      <div className="mt-5 grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
        {question.answers.map((answer, i) => {
          const isR = revealed.has(i);
          return (
            <button key={i} onClick={() => reveal(i)} className={cn('flex items-center justify-between rounded-2xl border-4 px-5 py-4 text-xl font-bold transition md:text-3xl', isR ? 'border-success bg-success/15' : 'border-border bg-card/60 hover:border-primary/50')}>
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-base text-muted-foreground md:size-12 md:text-xl">{i + 1}</span>
              {isR ? (<span className="flex flex-1 items-center justify-between px-4"><span>{answer.text}</span><span className="text-success">{answer.points}</span></span>) : (<span className="flex-1 px-4 text-muted-foreground/50">⬚⬚⬚⬚</span>)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button variant="destructive" size="lg" onClick={addStrike}><X className="size-5" strokeWidth={3} /> خطأ</Button>
        <Button variant="ghost" size="lg" onClick={() => setStrikes(0)}><RotateCcw className="size-5" /></Button>
        <Button variant="gradient" size="lg" onClick={nextQuestion}>
          {qIndex + 1 >= topic.questions.length ? 'إنهاء الموضوع' : 'السؤال التالي'} <ChevronLeft className="size-5" />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">الأرقام تكشف الإجابات · X خطأ</p>
    </div>
  );
}
