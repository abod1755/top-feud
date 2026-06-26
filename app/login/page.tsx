import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { AuthForm } from '@/components/auth-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo = next && next.startsWith('/') ? next : '/dashboard';

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in? Don't show the auth form — go straight to the destination.
  if (user) {
    redirect(redirectTo);
  }

  return (
    <main>
      <Header />
      <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_.9fr] lg:items-start">
        <div>
          <h1 className="font-display text-4xl font-extrabold">تسجيل الدخول</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            ادخل بحسابك للوصول إلى جلساتك وإنشاء ألعابك.
          </p>
        </div>
        <AuthForm mode="login" redirectTo={redirectTo} />
      </div>
    </main>
  );
}
