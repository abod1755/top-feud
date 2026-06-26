import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { CreateSessionButton } from '@/components/create-session-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userData.user.id)
    .single();

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('id, status, created_at, current_round, total_score')
    .order('created_at', { ascending: false })
    .limit(5);

  const isAdmin = profile?.role === 'admin';

  return (
    <main>
      <Header />
      <div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow">
          <h1 className="text-3xl font-extrabold text-white">لوحة اللاعب</h1>
          <p className="mt-2 text-slate-300">مرحبًا {profile?.display_name ?? 'بك'}، يمكنك الآن إنشاء جلسة جديدة أو متابعة الجلسات السابقة.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CreateSessionButton />
            {isAdmin && <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white">لوحة الأدمن</Link>}
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          <h2 className="text-xl font-bold text-white">آخر الجلسات</h2>
          <div className="grid gap-3">
            {(sessions ?? []).length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">لا توجد جلسات بعد.</div>}
            {(sessions ?? []).map((session) => (
              <Link key={session.id} href={`/game/${session.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white no-underline shadow-glow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong className="block">جلسة {session.id.slice(0, 8)}</strong>
                    <span className="text-sm text-slate-300">الجولة {session.current_round} • الحالة {session.status}</span>
                  </div>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-200">{session.total_score} نقطة</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}