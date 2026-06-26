import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'تعديل الملف' };

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/settings');

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, gender, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/dashboard');

  return (
    <main>
      <Header />
      <div className="container max-w-lg py-12">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-extrabold">تعديل ملفك</h1>
          <Link href={`/u/${profile.handle}`} className="text-sm text-primary hover:underline">
            عرض ملفك العام ←
          </Link>
        </div>
        <ProfileSettingsForm
          initial={{
            displayName: profile.display_name,
            handle: profile.handle,
            bio: profile.bio ?? '',
            gender: profile.gender,
            avatarUrl: profile.avatar_url,
          }}
        />
      </div>
    </main>
  );
}
