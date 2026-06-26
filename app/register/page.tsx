import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { AuthForm } from '@/components/auth-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in? No need to register again.
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main>
      <Header />
      <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_.9fr] lg:items-start">
        <div>
          <h1 className="font-display text-4xl font-extrabold">إنشاء حساب</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            أنشئ حسابك لتصمّم ألعابك، تستضيف الجلسات، وتحفظ تقدّمك.
          </p>
        </div>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}
