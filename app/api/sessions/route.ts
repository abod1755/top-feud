import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Generates a short, human-friendly join code (e.g. "7KQ2P9"). */
function generateCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول أولًا' }, { status: 401 });
  }

  // Retry a few times in the astronomically unlikely event of a code collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({ host_id: user.id, code: generateCode(), status: 'lobby' })
      .select('id, code, status')
      .single();

    if (!error && data) {
      return NextResponse.json({ session: data });
    }
    // 23505 = unique_violation (code clash); anything else is a real error.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'تعذّر إنشاء الجلسة، حاول مرة أخرى' }, { status: 500 });
}
