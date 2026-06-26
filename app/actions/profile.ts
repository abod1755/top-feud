'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface ProfileInput {
  displayName: string;
  handle: string;
  bio: string;
  gender: 'male' | 'female' | null;
  avatarUrl: string | null;
}

/** Updates the signed-in user's own profile. */
export async function updateProfile(input: ProfileInput) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: 'يجب تسجيل الدخول' };

  const displayName = input.displayName.trim();
  if (displayName.length < 1 || displayName.length > 60) {
    return { ok: false as const, error: 'الاسم يجب أن يكون بين 1 و60 حرفًا' };
  }

  const handle = input.handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    return { ok: false as const, error: 'المعرّف: حروف إنجليزية صغيرة وأرقام و _ فقط (3–30 حرفًا)' };
  }

  const admin = createSupabaseAdminClient();

  // Ensure the handle is unique (ignoring the user's current one).
  const { data: clash } = await admin
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .neq('id', user.id)
    .maybeSingle();
  if (clash) return { ok: false as const, error: 'هذا المعرّف مستخدم، اختر غيره' };

  const { error } = await admin
    .from('profiles')
    .update({
      display_name: displayName,
      handle,
      bio: input.bio.trim() || null,
      gender: input.gender,
      avatar_url: input.avatarUrl,
    })
    .eq('id', user.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/settings');
  revalidatePath(`/u/${handle}`);
  return { ok: true as const, handle };
}
