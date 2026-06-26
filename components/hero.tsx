import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function Hero() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="grid gap-8 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary shadow-glow-primary" />
          نفس روح Family Feud بتجربة عربية أصلية
        </div>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          اسأل السؤال، اكشف الإجابات، وخذ النقاط قبل الفريق الثاني.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          منصة لاكتشاف وإنشاء ولعب ألعاب فاميلي فيود — مع وضع عرض على التلفاز، لوحات صدارة، ومجتمع صُنّاع.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <>
              <Button asChild variant="gradient" size="lg">
                <Link href="/dashboard">اذهب إلى لوحتك</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/explore">تصفّح الألعاب</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="gradient" size="lg">
                <Link href="/register">ابدأ مجانًا</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-glow">
        <div className="rounded-xl border border-border bg-background/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block text-lg">لوحة السؤال</strong>
              <span className="text-sm text-muted-foreground">الإجابات مخفية حتى يتم كشفها</span>
            </div>
            <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">الجولة 3</div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-sm">ما الشيء الذي لا يخرج الناس من البيت بدونه؟</div>
              <div className="mt-2 text-xs text-primary">سؤال سريع قبل الفريق الآخر</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              ●●●●●●●●  ٤٢ نقطة
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              ●●●●●●  ٢٥ نقطة
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
