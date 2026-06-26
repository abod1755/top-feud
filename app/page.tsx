import Link from 'next/link';
import { Users, Type, Gamepad2, ArrowLeft, Rocket } from 'lucide-react';

import { Header } from '@/components/header';
import { DoodleBackground } from '@/components/doodle-background';
import { BRAND } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const MODES = [
  {
    title: 'فاميلي فيود',
    desc: 'خمّن أشهر الإجابات قبل خصمك',
    href: '/explore?type=family_feud',
    tint: 'hsl(176 76% 49%)',
    badge: 'الأشهر',
    Icon: Users,
  },
  {
    title: 'سباق الحروف',
    desc: 'كوّن أكثر كلمات في وقت محدد',
    href: '/explore?type=word_builder',
    tint: '#FFCE1F',
    badge: 'جديد',
    Icon: Type,
  },
  {
    title: 'كل الألعاب',
    desc: 'تصفّح كل ألعاب لمّة',
    href: '/explore',
    tint: '#F43F9D',
    badge: null,
    Icon: Gamepad2,
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative overflow-hidden">
      <DoodleBackground />
      <Header />

      <section className="container flex flex-col items-center pb-20 pt-16 text-center">
        <h1 className="text-sticker font-display text-7xl font-extrabold leading-none md:text-8xl">
          {BRAND.name}
        </h1>
        <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-muted-foreground">
          فكّر خارج الصندوق! اجمع لمّتك، اختر لعبة، وتحدّى أصحابك أو العب أونلاين. الأكثر نقاطًا هو البطل.
        </p>

        <div className="mt-8">
          {user ? (
            <Link
              href="/dashboard"
              className="btn-chunky inline-flex items-center gap-2 px-8 py-3.5 text-lg"
              style={{ backgroundColor: 'hsl(176 76% 49%)' }}
            >
              <Rocket className="size-5" />
              اذهب إلى لوحتك
            </Link>
          ) : (
            <Link
              href="/register"
              className="btn-chunky inline-flex items-center gap-2 px-8 py-3.5 text-lg"
              style={{ backgroundColor: 'hsl(176 76% 49%)' }}
            >
              <Rocket className="size-5" />
              سجّل الآن وانطلق
            </Link>
          )}
        </div>

        {/* mode cards */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {MODES.map((mode) => (
            <div
              key={mode.title}
              className="relative rounded-3xl border border-border bg-card/70 px-5 pb-5 pt-10 text-center backdrop-blur transition-transform hover:-translate-y-1"
            >
              {mode.badge && (
                <span
                  className="absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#06141a]"
                  style={{ backgroundColor: '#F43F9D' }}
                >
                  {mode.badge}
                </span>
              )}
              <span
                className="absolute -top-7 right-1/2 grid h-14 w-14 translate-x-1/2 place-items-center rounded-2xl text-[#06141a] shadow-[0_5px_0_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: mode.tint }}
              >
                <mode.Icon className="size-7" />
              </span>
              <h3 className="font-display text-xl font-extrabold">{mode.title}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{mode.desc}</p>
              <Link
                href={mode.href}
                className="btn-chunky mt-4 flex w-full items-center justify-center gap-2 py-2.5"
                style={{ backgroundColor: mode.tint }}
              >
                ابدأ <ArrowLeft className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
