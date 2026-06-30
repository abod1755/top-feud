import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, TrendingUp, Ticket, Wallet, Tag } from 'lucide-react';

import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatNumber } from '@/lib/utils';
import { formatPrice } from '@/lib/money';

export const metadata: Metadata = { title: 'المبيعات والإيرادات' };

export default async function SalesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdminClient();
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') redirect('/dashboard');

  // Paid transactions power revenue; everything else is reconciliation context.
  const [{ data: paid }, { data: recent }, { data: paidGames }] = await Promise.all([
    admin.from('payments').select('game_id, amount_cents, currency').eq('status', 'paid'),
    admin
      .from('payments')
      .select('id, game_id, user_id, amount_cents, currency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
    admin.from('games').select('id, title, slug, price_cents').gt('price_cents', 0),
  ]);

  const paidRows = paid ?? [];
  const totalRevenue = paidRows.reduce((s, p) => s + p.amount_cents, 0);
  const totalTickets = paidRows.length;
  const avgTicket = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;

  // Per-game revenue & tickets.
  const titleById = new Map((paidGames ?? []).map((g) => [g.id, g.title]));
  const slugById = new Map((paidGames ?? []).map((g) => [g.id, g.slug]));
  const perGame = new Map<string, { tickets: number; revenue: number }>();
  for (const p of paidRows) {
    const cur = perGame.get(p.game_id) ?? { tickets: 0, revenue: 0 };
    cur.tickets += 1;
    cur.revenue += p.amount_cents;
    perGame.set(p.game_id, cur);
  }
  const gameRows = [...perGame.entries()]
    .map(([id, v]) => ({ id, title: titleById.get(id) ?? '—', slug: slugById.get(id), ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // Buyer names for the recent list.
  const buyerIds = [...new Set((recent ?? []).map((r) => r.user_id))];
  const { data: buyers } = buyerIds.length
    ? await admin.from('profiles').select('id, display_name').in('id', buyerIds)
    : { data: [] };
  const buyerName = new Map((buyers ?? []).map((b) => [b.id, b.display_name]));

  const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
    paid: { text: 'مدفوعة', cls: 'bg-success/15 text-success' },
    pending: { text: 'معلّقة', cls: 'bg-muted text-muted-foreground' },
    failed: { text: 'فاشلة', cls: 'bg-destructive/15 text-destructive' },
    refunded: { text: 'مستردّة', cls: 'bg-secondary/15 text-secondary' },
  };

  const stat = (Icon: typeof Wallet, label: string, value: string) => (
    <div className="glass rounded-2xl p-5">
      <Icon className="size-5 text-primary" />
      <div className="mt-2 font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <main>
      <Header />
      <div className="container space-y-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold">المبيعات والإيرادات</h1>
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="size-4" /> رجوع للوحة الأدمن
          </Link>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stat(Wallet, 'إجمالي الإيراد', formatPrice(totalRevenue))}
          {stat(Ticket, 'تذاكر مباعة', formatNumber(totalTickets))}
          {stat(Tag, 'متوسط التذكرة', formatPrice(avgTicket))}
          {stat(TrendingUp, 'ألعاب مدفوعة', formatNumber((paidGames ?? []).length))}
        </section>

        {/* Per-game breakdown */}
        <section>
          <h2 className="mb-3 text-xl font-bold">الإيراد حسب اللعبة</h2>
          {gameRows.length === 0 ? (
            <div className="glass rounded-xl p-5 text-muted-foreground">لا توجد مبيعات بعد.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">اللعبة</th>
                    <th className="px-4 py-3 font-semibold">تذاكر</th>
                    <th className="px-4 py-3 font-semibold">الإيراد</th>
                  </tr>
                </thead>
                <tbody>
                  {gameRows.map((g) => (
                    <tr key={g.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">
                        {g.slug ? (
                          <Link href={`/games/${g.slug}`} className="hover:text-primary">{g.title}</Link>
                        ) : (
                          g.title
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatNumber(g.tickets)}</td>
                      <td className="px-4 py-3 font-bold tabular-nums text-success">{formatPrice(g.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent transactions */}
        <section>
          <h2 className="mb-3 text-xl font-bold">آخر العمليات</h2>
          {(recent ?? []).length === 0 ? (
            <div className="glass rounded-xl p-5 text-muted-foreground">لا توجد عمليات بعد.</div>
          ) : (
            <div className="grid gap-2">
              {(recent ?? []).map((r) => {
                const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                return (
                  <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
                    <div>
                      <strong className="block">{titleById.get(r.game_id) ?? 'لعبة'}</strong>
                      <span className="text-xs text-muted-foreground">
                        {buyerName.get(r.user_id) ?? 'مستخدم'} •{' '}
                        <span dir="ltr">{new Date(r.created_at).toLocaleString('en-GB')}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold tabular-nums">{formatPrice(r.amount_cents, r.currency)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
