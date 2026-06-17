import { Header } from '@/components/header';
import { Hero } from '@/components/hero';

export default function HomePage() {
  return (
    <main>
      <Header />
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <Hero />
        <section className="grid gap-4 py-8 md:grid-cols-3">
          <Feature title="تسجيل إلزامي" text="أي شخص يريد إنشاء جلسة أو الانضمام لها يحتاج حسابًا مسجلاً." />
          <Feature title="جلسات محفوظة" text="الجلسات والأداء محفوظان في قاعدة البيانات ويستعيدهما المستخدم لاحقًا." />
          <Feature title="جاهز للنشر" text="الهيكل مبني على Next.js + Supabase من البداية وبشكل قابل للتوسع." />
        </section>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-glow">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-300">{text}</p>
    </div>
  );
}