import type { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';

import { Header } from '@/components/header';
import { StoreCard, type StoreCardData } from '@/components/store/store-card';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'المتجر',
  description: 'اشترِ تذاكر أفضل ألعاب السهرات والتحديات.',
};

export default async function StorePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games } = await supabase
    .from('games')
    .select('id, slug, title, tagline, game_type, price_cents, currency, play_count, rating_avg, rating_count, creator_id')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .gt('price_cents', 0)
    .order('is_featured', { ascending: false })
    .order('play_count', { ascending: false });

  const list = games ?? [];

  // Which of these does the current user already own (ticket or creator)?
  const owned = new Set<string>();
  if (user && list.length) {
    const ids = list.map((g) => g.id);
    const { data: tickets } = await supabase
      .from('tickets')
      .select('game_id')
      .eq('user_id', user.id)
      .in('game_id', ids);
    (tickets ?? []).forEach((t) => owned.add(t.game_id));
    list.forEach((g) => {
      if (g.creator_id === user.id) owned.add(g.id);
    });
  }

  return (
    <main>
      <Header />
      <div className="container py-10">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFCE1F] text-[#06141a] shadow-[0_5px_0_rgba(0,0,0,0.35)]">
            <ShoppingBag className="size-7" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">المتجر</h1>
            <p className="text-sm text-muted-foreground">اشترِ تذكرة والعب — دفع آمن عبر Tap.</p>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-muted-foreground">
            لا توجد ألعاب مدفوعة بعد. تابعنا قريبًا! 🎟️
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((g) => {
              const data: StoreCardData = {
                id: g.id,
                slug: g.slug,
                title: g.title,
                tagline: g.tagline,
                game_type: (g.game_type as GameTypeKey) in GAME_TYPES ? (g.game_type as GameTypeKey) : 'family_feud',
                price_cents: g.price_cents,
                currency: g.currency,
                play_count: g.play_count,
                rating_avg: g.rating_avg,
                rating_count: g.rating_count,
              };
              return <StoreCard key={g.id} game={data} owned={owned.has(g.id)} isLoggedIn={Boolean(user)} />;
            })}
          </div>
        )}
      </div>
    </main>
  );
}
