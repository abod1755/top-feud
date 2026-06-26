import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول أولًا' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      owner_id: userData.user.id,
      status: 'active',
      current_round: 1,
      total_score: 0,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}