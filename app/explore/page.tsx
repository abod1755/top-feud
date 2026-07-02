import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { GameCard } from '@/components/game-card';
import { SearchBox } from '@/components/explore/search-box';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublishedGames, type GameSort } from '@/lib/queries/games';

export const metadata: Metadata = {
  title: 'اكتشف الألعاب',
  description: 'تصفّح وابحث في ألعاب فاميلي فيود وسباق الحروف.',
};

const TYPE_TABS = [
  { key: 'all', label: 'الكل' },
  ...(Object.keys(GAME_TYPES) as GameTypeKey[]).map((key) => ({ key, label: GAME_TYPES[key].label })),
];

const SORT_TABS: { key: GameSort; label: string }[] = [
  { key: 'recent', label: 'الأحدث' },
  { key: 'popular', label: 'الأكثر لعبًا' },
  { key: 'rating', label: 'الأعلى تقييمًا' },
];

function isGameType(v: string | undefined): v is GameTypeKey {
  return v != null && v in GAME_TYPES;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string; q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const type = isGameType(sp.type) ? sp.type : undefined;
  const sort: GameSort = sp.sort === 'popular' || sp.sort === 'rating' ? sp.sort : 'recent';
  const q = sp.q?.trim() || undefined;
  const category = sp.category || undefined;

  const supabase = await createSupabaseServerClient();
  const [{ data: categories }, games] = await Promise.all([
    supabase.from('categories').select('slug, name').eq('is_active', true).order('position'),
    getPublishedGames({ type, sort, search: q, categorySlug: category }),
  ]);

  const activeCategory = (categories ?? []).find((c) => c.slug === category);

  const buildHref = (next: Partial<{ type: string; sort: string; q: string; category: string }>) => {
    const params = new URLSearchParams();
    const t = next.type !== undefined ? next.type : type;
    const s = next.sort !== undefined ? next.sort : sort;
    const query = next.q !== undefined ? next.q : q;
    const cat = next.category !== undefined ? next.category : category;
    if (t) params.set('type', t);
    if (s && s !== 'recent') params.set('sort', s);
    if (query) params.set('q', query);
    if (cat) params.set('category', cat);
    const qs = params.toString();
    return `/explore${qs ? `?${qs}` : ''}`;
  };

  return (
    <main>
      <Header />
      <div className="container py-10">
        <h1 className="font-display text-4xl font-extrabold">اكتشف الألعاب</h1>
        <p className="mt-2 text-muted-foreground">ابحث، فلتر حسب النوع والفئة، وابدأ اللعب.</p>

        <div className="mt-6">
          <SearchBox initial={q ?? ''} category={category} />
        </div>

        {/* category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={buildHref({ category: '' })}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition',
              !category ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card/50 text-muted-foreground hover:border-primary/50',
            )}
          >
            كل الفئات
          </Link>
          {(categories ?? []).map((c) => (
            <Link
              key={c.slug}
              href={buildHref({ category: c.slug })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                category === c.slug ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card/50 text-muted-foreground hover:border-primary/50',
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* type tabs + sort */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TYPE_TABS.map((tab) => {
            const active = (tab.key === 'all' && !type) || tab.key === type;
            return (
              <Link
                key={tab.key}
                href={buildHref({ type: tab.key === 'all' ? '' : tab.key })}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  active ? 'border-secondary bg-secondary/15 text-foreground' : 'border-border bg-card/50 text-muted-foreground hover:border-secondary/50',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
          <span className="mx-2 text-muted-foreground">·</span>
          {SORT_TABS.map((s) => (
            <Link
              key={s.key}
              href={buildHref({ sort: s.key })}
              className={cn('rounded-md px-3 py-1 text-sm transition', sort === s.key ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {(q || activeCategory) && (
          <p className="mt-4 text-sm text-muted-foreground">
            {games.length} نتيجة
            {q && <> للبحث «{q}»</>}
            {activeCategory && <> في فئة «{activeCategory.name}»</>}
          </p>
        )}

        {games.length === 0 ? (
          <div className="mt-8 glass rounded-2xl p-10 text-center text-muted-foreground">لا توجد ألعاب مطابقة.</div>
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
