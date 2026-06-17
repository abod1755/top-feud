import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4 py-4">
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
          <Link href="/admin">الأدمن</Link>
        </nav>
      </div>
    </header>
  );
}