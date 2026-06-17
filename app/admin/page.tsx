import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userData.user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('id, owner_id, status, current_round, total_score, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <main>
      <Header />
      <div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow">
          <h1 className="text-3xl font-extrabold text-white">لوحة الأدمن</h1>
          <p className="mt-2 text-slate-300">هنا نرتب إدارة السؤال، الجولات، والأدوار قبل إضافة بنك الأسئلة الكامل.</p>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-glow">
            <h2 className="text-xl font-bold text-white">إدارة بنك الأسئلة</h2>
            <p className="mt-2 text-slate-300">لاحقًا نضيف: إنشاء سؤال، الإجابات الصحيحة، النقاط، والفئة.</p>
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-slate-400">مساحة بنك الأسئلة</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-glow">
            <h2 className="text-xl font-bold text-white">الجلسات الأخيرة</h2>
            <div className="mt-4 grid gap-3">
              {(sessions ?? []).length === 0 && <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">لا توجد جلسات بعد.</div>}
              {(sessions ?? []).map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-200">
                  <strong className="block">{session.id.slice(0, 8)}</strong>
                  <span className="text-sm text-slate-400">{session.status} • الجولة {session.current_round} • {session.total_score} نقطة</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}