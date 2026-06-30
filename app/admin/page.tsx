import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { RoleSelect } from '@/components/admin/role-select';
import { ToggleButton } from '@/components/admin/toggle-button';
import { ReportButtons } from '@/components/admin/report-buttons';
import { AdminDeleteButton } from '@/components/admin/admin-delete-button';
import { toggleVerify, setFeatured, adminSetPublished } from '@/app/actions/admin';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatNumber } from '@/lib/utils';

export const metadata: Metadata = { title: 'لوحة الأدمن' };

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseAdminClient();
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') redirect('/dashboard');

  const [usersCount, gamesCount, publishedCount, reportsCount, users, games, reports, logs] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('games').select('id', { count: 'exact', head: true }),
    admin.from('games').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('profiles').select('id, handle, display_name, role, is_verified, games_count, created_at').order('created_at', { ascending: false }).limit(40),
    admin.from('games').select('id, slug, title, status, is_featured, game_type, play_count, creator_id').order('created_at', { ascending: false }).limit(40),
    admin.from('reports').select('id, target_type, reason, status, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
    admin.from('audit_logs').select('action, target_type, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const stat = (label: string, value: number) => (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="font-display text-3xl font-extrabold text-primary">{formatNumber(value)}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <main>
      <Header />
      <div className="container space-y-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold">لوحة الأدمن</h1>
          <Button asChild variant="gradient" size="sm">
            <Link href="/admin/sales">💰 المبيعات والإيرادات</Link>
          </Button>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stat('المستخدمون', usersCount.count ?? 0)}
          {stat('الألعاب', gamesCount.count ?? 0)}
          {stat('منشورة', publishedCount.count ?? 0)}
          {stat('بلاغات مفتوحة', reportsCount.count ?? 0)}
        </section>

        {/* Reports */}
        <section>
          <h2 className="mb-3 text-xl font-bold">البلاغات المفتوحة</h2>
          {(reports.data ?? []).length === 0 ? (
            <div className="glass rounded-xl p-5 text-muted-foreground">لا توجد بلاغات.</div>
          ) : (
            <div className="grid gap-2">
              {(reports.data ?? []).map((r) => (
                <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
                  <div>
                    <strong className="block">{r.reason}</strong>
                    <span className="text-xs text-muted-foreground">على {r.target_type}</span>
                  </div>
                  <ReportButtons reportId={r.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Games */}
        <section>
          <h2 className="mb-3 text-xl font-bold">الألعاب</h2>
          <div className="grid gap-2">
            {(games.data ?? []).map((g) => {
              const type = GAME_TYPES[g.game_type as GameTypeKey];
              return (
                <div key={g.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{type.emoji}</span>
                    <div>
                      <strong className="block">{g.title}</strong>
                      <span className="text-xs text-muted-foreground">{g.status === 'published' ? 'منشورة' : 'مسودّة'} • {formatNumber(g.play_count)} لعبة</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ToggleButton id={g.id} initial={g.is_featured} onLabel="مميّزة ★" offLabel="تمييز" action={setFeatured} />
                    <ToggleButton id={g.id} initial={g.status === 'published'} onLabel="منشورة" offLabel="نشر" action={adminSetPublished} />
                    <AdminDeleteButton gameId={g.id} title={g.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Users */}
        <section>
          <h2 className="mb-3 text-xl font-bold">المستخدمون</h2>
          <div className="grid gap-2">
            {(users.data ?? []).map((u) => (
              <div key={u.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
                <div>
                  <strong className="block">{u.display_name}</strong>
                  <span className="text-xs text-muted-foreground">@{u.handle} • {u.games_count} لعبة</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleSelect userId={u.id} initial={u.role} />
                  <ToggleButton id={u.id} initial={u.is_verified} onLabel="موثّق ✓" offLabel="توثيق" action={toggleVerify} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit log */}
        <section>
          <h2 className="mb-3 text-xl font-bold">سجل التدقيق</h2>
          <div className="glass rounded-xl p-4 text-sm">
            {(logs.data ?? []).length === 0 ? (
              <span className="text-muted-foreground">لا يوجد نشاط بعد.</span>
            ) : (
              <ul className="space-y-1">
                {(logs.data ?? []).map((l, i) => (
                  <li key={i} className="flex justify-between text-muted-foreground">
                    <span>{l.action} ({l.target_type})</span>
                    <span dir="ltr">{new Date(l.created_at).toLocaleString('en-GB')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
