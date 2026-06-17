import Link from 'next/link';

export function Hero() {
  return (
    <section className="grid gap-8 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_#26e0a3]" />
          نفس روح Family Feud لكن بتجربة عربية أصلية
        </div>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
          اسأل السؤال، اكشف الإجابات، وخذ النقاط قبل الفريق الثاني.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          منصة ترفيهية متعددة اللاعبين تعتمد على تسجيل الدخول، الجلسات المحفوظة، وقاعدة بيانات فعلية للجولات والنقاط.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-2xl bg-gradient-to-l from-accent to-[#6df0c4] px-5 py-3 font-bold text-slate-950">ابدأ بحسابك</Link>
          <Link href="/login" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white">تسجيل الدخول</Link>
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block text-lg">لوحة السؤال</strong>
              <span className="text-sm text-slate-400">الإجابات مخفية حتى يتم كشفها</span>
            </div>
            <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">الجولة 3</div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-slate-300">ما الشيء الذي لا يغادر البيت بدونه الناس؟</div>
              <div className="mt-2 text-xs text-accent">سؤال سريع قبل الفريق الآخر</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">********** 25 نقطة</div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">******** 18 نقطة</div>
          </div>
        </div>
      </div>
    </section>
  );
}