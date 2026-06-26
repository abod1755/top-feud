import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Pencil, Play } from 'lucide-react';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single();

  const { data: games } = await supabase
    .from('games')
    .select('id, slug, title, game_type, status, questions_count, play_count')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const isAdmin = profile?.role === 'admin';

  return (
    <main>
      <Header />
      <div className="container py-12">
        <section className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 shadow-glow">
          <div>
            <h1 className="font-display text-3xl font-extrabold">أهلًا {profile?.display_name ?? 'بك'}</h1>
            <p className="mt-1 text-muted-foreground">أنشئ ألعابك، عدّلها، وانشرها للعالم.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/create">
                <Plus className="size-5" /> أنشئ لعبة
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">لوحة الأدمن</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">ألعابي</h2>
          {(games ?? []).length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              لا توجد ألعاب بعد. اضغط «أنشئ لعبة» للبدء.
            </div>
          ) : (
            <div className="grid gap-3">
              {(games ?? []).map((game) => {
                const type = GAME_TYPES[game.game_type as GameTypeKey];
                return (
                  <div key={game.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>
                        {type.emoji}
                      </span>
                      <div>
                        <strong className="block">{game.title}</strong>
                        <span className="text-xs text-muted-foreground">
                          {type.label} • {game.questions_count} سؤال •{' '}
                          {game.status === 'published' ? 'منشورة' : 'مسودّة'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.status === 'published' && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/play/${game.slug}`}>
                            <Play className="size-4" /> العب
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/edit/${game.id}`}>
                          <Pencil className="size-4" /> تعديل
                        </Link>
                      </Button>
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
