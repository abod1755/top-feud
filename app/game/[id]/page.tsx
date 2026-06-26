import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: session } = await supabase
    .from('game_sessions')
    .select('id, code, status, started_at')
    .eq('id', id)
    .single();

  if (!session) {
    redirect('/dashboard');
  }

  return (
    <main>
      <Header />
      <div className="container py-12">
        <section className="glass rounded-2xl p-6 shadow-glow">
          <h1 className="font-display text-3xl font-extrabold">جلسة {session.code}</h1>
          <p className="mt-2 text-muted-foreground">الحالة: {session.status}</p>
          <div className="mt-6 rounded-xl border border-border bg-background/40 p-5 text-muted-foreground">
            وضع الاستضافة الكامل (لوحة السؤال، المؤقّت، الأجراس، النتائج) يُبنى في مرحلة تجربة اللعب.
          </div>
        </section>
      </div>
    </main>
  );
}
