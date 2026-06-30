import type { Metadata } from 'next';
import { ShoppingBag, Ticket } from 'lucide-react';

import { Header } from '@/components/header';
import { PackageCard, type TicketPackageData } from '@/components/store/package-card';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'المتجر',
  description: 'اشترِ باقة تذاكر والعب أي لعبة.',
};

export default async function StorePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: packages } = await supabase
    .from('ticket_packages')
    .select('id, name, tickets, price_cents, currency, position')
    .eq('is_active', true)
    .order('position');

  let balance = 0;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('ticket_balance').eq('id', user.id).maybeSingle();
    balance = profile?.ticket_balance ?? 0;
  }

  const list = packages ?? [];
  // Best per-ticket value gets the highlight.
  let bestId: string | null = null;
  let bestPer = Infinity;
  for (const p of list) {
    const per = p.price_cents / p.tickets;
    if (per < bestPer) {
      bestPer = per;
      bestId = p.id;
    }
  }

  return (
    <main>
      <Header />
      <div className="container py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFCE1F] text-[#06141a] shadow-[0_5px_0_rgba(0,0,0,0.35)]">
              <ShoppingBag className="size-7" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-extrabold">المتجر</h1>
              <p className="text-sm text-muted-foreground">اشترِ باقة تذاكر — كل لعبة تكلّف تذكرة. دفع آمن عبر Tap.</p>
            </div>
          </div>

          {user && (
            <div className="glass flex items-center gap-2 rounded-2xl px-5 py-3">
              <Ticket className="size-5 text-[#FFCE1F]" />
              <span className="text-sm text-muted-foreground">رصيدك:</span>
              <span className="font-display text-2xl font-extrabold tabular-nums">{balance}</span>
              <span className="text-sm text-muted-foreground">تذكرة</span>
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-muted-foreground">لا توجد باقات متاحة حاليًا.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => {
              const data: TicketPackageData = {
                id: p.id,
                name: p.name,
                tickets: p.tickets,
                price_cents: p.price_cents,
                currency: p.currency,
              };
              return <PackageCard key={p.id} pkg={data} isLoggedIn={Boolean(user)} highlight={p.id === bestId} />;
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          التذكرة تفتح جلسة لعب واحدة للعبة المدفوعة. الألعاب المجانية لا تحتاج تذاكر.
        </p>
      </div>
    </main>
  );
}
