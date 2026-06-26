import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('id, host_id, code, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: gamesCount } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true });

  return (
    <main>
      <Header />
      <div className="container py-12">
        <section className="glass rounded-2xl p-6 shadow-glow">
          <h1 className="font-display text-3xl font-extrabold">لوحة الأدمن</h1>
          <p className="mt-2 text-muted-foreground">إدارة الألعاب والمستخدمين والإشراف.</p>
        </section>
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6 shadow-glow">
            <h2 className="text-xl font-bold">الألعاب</h2>
            <p className="mt-2 text-4xl font-extrabold text-primary">{gamesCount ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">إجمالي الألعاب في المنصة</p>
          </div>
          <div className="glass rounded-2xl p-6 shadow-glow">
            <h2 className="text-xl font-bold">آخر الجلسات</h2>
            <div className="mt-4 grid gap-3">
              {(sessions ?? []).length === 0 && (
                <div className="rounded-xl border border-border bg-background/40 p-4 text-muted-foreground">
                  لا توجد جلسات بعد.
                </div>
              )}
              {(sessions ?? []).map((session) => (
                <div key={session.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <strong className="block">رمز {session.code}</strong>
                  <span className="text-sm text-muted-foreground">الحالة: {session.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
