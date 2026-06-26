import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { CreateGameForm } from '@/components/creator/create-game-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'أنشئ لعبة' };

export default async function CreatePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main>
      <Header />
      <div className="container max-w-lg py-12">
        <h1 className="font-display text-3xl font-extrabold">أنشئ لعبة جديدة</h1>
        <p className="mt-2 text-muted-foreground">اختر النوع وابدأ، ثم أضف الأسئلة في المحرّر.</p>
        <CreateGameForm />
      </div>
    </main>
  );
}
