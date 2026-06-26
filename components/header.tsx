import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function Header() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let displayName = user?.user_metadata?.display_name as string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    displayName = profile?.display_name ?? displayName ?? user.email?.split('@')[0] ?? 'لاعب';
  }

  return (
    <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-white no-underline">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent2 font-extrabold text-slate-950">F</div>
          <div>
            <strong className="block text-lg leading-none">Top Feud</strong>
            <span className="mt-1 block text-xs text-slate-400">لعبة العائلة والأسئلة السريعة</span>
          </div>
        </Link>

        <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
          <Link href="/tournaments">الجولات</Link>
          <Link href="/leaderboard">لوحة النقاط</Link>
          <Link href="/dashboard">لوحة اللاعب</Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 font-bold text-emerald-100">
              داخل الآن: {displayName}
            </div>
          ) : (
            <Link href="/login" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-bold text-white">
              تسجيل الدخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
