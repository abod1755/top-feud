import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { CreateSessionButton } from '@/components/create-session-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
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

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('id, code, status, created_at')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const isAdmin = profile?.role === 'admin';

  return (
    <main>
      <Header />
      <div className="container py-12">
        <section className="glass rounded-2xl p-6 shadow-glow">
          <h1 className="font-display text-3xl font-extrabold">لوحة اللاعب</h1>
          <p className="mt-2 text-muted-foreground">
            مرحبًا {profile?.display_name ?? 'بك'}، يمكنك إنشاء جلسة استضافة جديدة أو متابعة جلساتك.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CreateSessionButton />
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl border border-border bg-card/60 px-5 py-3 font-bold"
              >
                لوحة الأدمن
              </Link>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          <h2 className="text-xl font-bold">آخر جلساتك</h2>
          <div className="grid gap-3">
            {(sessions ?? []).length === 0 && (
              <div className="glass rounded-xl p-5 text-muted-foreground">لا توجد جلسات بعد.</div>
            )}
            {(sessions ?? []).map((session) => (
              <Link key={session.id} href={`/game/${session.id}`} className="glass rounded-xl p-5 shadow-glow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong className="block">رمز الانضمام: {session.code}</strong>
                    <span className="text-sm text-muted-foreground">الحالة: {session.status}</span>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm">فتح</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
