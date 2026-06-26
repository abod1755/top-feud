import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { GameCard } from '@/components/game-card';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { getPublishedGames, type GameSort } from '@/lib/queries/games';

export const metadata: Metadata = {
  title: 'اكتشف الألعاب',
  description: 'تصفّح ألعاب فاميلي فيود وسباق الحروف وأكثر.',
};

const TYPE_TABS: { key: string; label: string; href: string }[] = [
  { key: 'all', label: 'الكل', href: '/explore' },
  { key: 'family_feud', label: GAME_TYPES.family_feud.label, href: '/explore?type=family_feud' },
  { key: 'word_builder', label: GAME_TYPES.word_builder.label, href: '/explore?type=word_builder' },
];

const SORT_TABS: { key: GameSort; label: string }[] = [
  { key: 'recent', label: 'الأحدث' },
  { key: 'popular', label: 'الأكثر لعبًا' },
  { key: 'rating', label: 'الأعلى تقييمًا' },
];

function isGameType(v: string | undefined): v is GameTypeKey {
  return v === 'family_feud' || v === 'word_builder';
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const type = isGameType(sp.type) ? sp.type : undefined;
  const sort: GameSort =
    sp.sort === 'popular' || sp.sort === 'rating' ? sp.sort : 'recent';

  const games = await getPublishedGames({ type, sort });

  const buildHref = (next: { type?: string; sort?: string }) => {
    const params = new URLSearchParams();
    const t = next.type ?? type;
    const s = next.sort ?? sort;
    if (t) params.set('type', t);
    if (s && s !== 'recent') params.set('sort', s);
    const qs = params.toString();
    return `/explore${qs ? `?${qs}` : ''}`;
  };

  return (
    <main>
      <Header />
      <div className="container py-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-extrabold">اكتشف الألعاب</h1>
          <p className="text-muted-foreground">اختر لعبة، العبها مع عائلتك أو أصدقائك، أو أنشئ لعبتك الخاصة.</p>
        </div>

        {/* type tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => {
            const active = (tab.key === 'all' && !type) || tab.key === type;
            return (
              <Link
                key={tab.key}
                href={tab.key === 'all' ? buildHref({ type: undefined }) : buildHref({ type: tab.key })}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border bg-card/50 text-muted-foreground hover:border-primary/50',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* sort */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">ترتيب:</span>
          {SORT_TABS.map((s) => (
            <Link
              key={s.key}
              href={buildHref({ sort: s.key })}
              className={cn(
                'rounded-md px-3 py-1 transition',
                sort === s.key ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* grid */}
        {games.length === 0 ? (
          <div className="mt-10 glass rounded-2xl p-10 text-center text-muted-foreground">
            لا توجد ألعاب مطابقة بعد.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
