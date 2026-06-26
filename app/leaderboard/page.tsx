import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'لوحة الصدارة',
  description: 'أعلى النتائج في ألعاب لمّة.',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: scores } = await supabase
    .from('game_scores')
    .select('user_id, game_id, best_score, plays')
    .order('best_score', { ascending: false })
    .limit(50);

  const rows = scores ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const gameIds = [...new Set(rows.map((r) => r.game_id))];

  const [{ data: profiles }, { data: games }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, handle, display_name, avatar_url').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; handle: string; display_name: string; avatar_url: string | null }[] }),
    gameIds.length
      ? supabase.from('games').select('id, slug, title').in('id', gameIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const gameById = new Map((games ?? []).map((g) => [g.id, g]));

  return (
    <main>
      <Header />
      <div className="container max-w-3xl py-10">
        <h1 className="font-display text-4xl font-extrabold">لوحة الصدارة 🏆</h1>
        <p className="mt-2 text-muted-foreground">أعلى النتائج في وضع اللعب الفردي.</p>

        {rows.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-muted-foreground">
            لا توجد نتائج بعد — كن أول من يتصدّر! العب أي لعبة لتظهر هنا.
            <div className="mt-4">
              <Link href="/explore" className="font-semibold text-primary">تصفّح الألعاب</Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-2">
            {rows.map((row, i) => {
              const p = profileById.get(row.user_id);
              const g = gameById.get(row.game_id);
              return (
                <div
                  key={`${row.user_id}-${row.game_id}`}
                  className="glass flex items-center gap-4 rounded-xl p-3"
                >
                  <span className="w-8 text-center text-lg font-extrabold tabular-nums">
                    {i < 3 ? MEDALS[i] : i + 1}
                  </span>
                  <Link href={p ? `/u/${p.handle}` : '#'} className="flex flex-1 items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cover bg-center text-sm font-bold text-primary-foreground"
                      style={
                        p?.avatar_url
                          ? { backgroundImage: `url("${p.avatar_url}")` }
                          : { background: 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' }
                      }
                    >
                      {p?.avatar_url ? '' : (p?.display_name ?? '?').charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p?.display_name ?? 'لاعب'}</span>
                      {g && <span className="block truncate text-xs text-muted-foreground">{g.title}</span>}
                    </span>
                  </Link>
                  <span className="font-display text-xl font-extrabold text-primary">{formatNumber(row.best_score)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
