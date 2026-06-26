import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    redirect('/dashboard');
  }

  return (
    <main>
      <Header />
      <div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow">
          <h1 className="text-3xl font-extrabold text-white">الجلسة {id.slice(0, 8)}</h1>
          <p className="mt-2 text-slate-300">{session.status} • الجولة {session.current_round} • {session.total_score} نقطة</p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-slate-200">
            هنا لاحقًا نضع لوحة السؤال، مؤقت الجولة، وأزرار الكشف عن الإجابات.
          </div>
        </section>
      </div>
    </main>
  );
}