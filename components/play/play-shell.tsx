'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Users } from 'lucide-react';

import { SoloGame, type PlayQuestion } from '@/components/play/solo-game';
import { TeamGame } from '@/components/play/team-game';

interface PlayShellProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  questions: PlayQuestion[];
}

type Mode = 'solo' | 'teams';

export function PlayShell(props: PlayShellProps) {
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode === 'solo') return <SoloGame {...props} />;
  if (mode === 'teams') return <TeamGame {...props} />;

  const options: { key: Mode; title: string; desc: string; tint: string; Icon: typeof User }[] = [
    { key: 'solo', title: 'لعب فردي', desc: 'تحدّى نفسك واجمع أعلى نقاط', tint: 'hsl(176 76% 49%)', Icon: User },
    { key: 'teams', title: 'فريقان', desc: 'تنافسوا بالتناوب على شاشة واحدة', tint: '#F43F9D', Icon: Users },
  ];

  return (
    <div className="container grid min-h-[70vh] place-items-center py-10 text-center">
      <div className="w-full max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold">{props.gameTitle}</h1>
        <p className="mt-2 text-muted-foreground">اختر طريقة اللعب</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className="group relative rounded-3xl border border-border bg-card/70 px-5 pb-5 pt-10 text-center backdrop-blur transition-transform hover:-translate-y-1"
            >
              <span
                className="absolute -top-7 right-1/2 grid h-14 w-14 translate-x-1/2 place-items-center rounded-2xl text-[#06141a] shadow-[0_5px_0_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: opt.tint }}
              >
                <opt.Icon className="size-7" />
              </span>
              <h3 className="font-display text-xl font-extrabold">{opt.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{opt.desc}</p>
              <span
                className="btn-chunky mt-4 inline-flex w-full items-center justify-center py-2.5"
                style={{ backgroundColor: opt.tint }}
              >
                ابدأ
              </span>
            </button>
          ))}
        </div>

        <Link href={`/games/${props.gameSlug}`} className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← رجوع للعبة
        </Link>
      </div>
    </div>
  );
}
