'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createTapCharge } from '@/lib/payments/tap';
import { siteUrl } from '@/lib/env';

type CheckoutResult =
  | { ok: true; url: string }
  | { ok: true; owned: true; slug: string }
  | { ok: false; error: string };

/**
 * Starts a Tap checkout for a paid game. Returns a hosted-payment URL the
 * client redirects to. If the game is free or the user already owns a ticket,
 * returns `owned` so the UI can send them straight to play. All trust lives on
 * the server: the price comes from the DB (never the client), and a ticket is
 * only minted later by the verified callback / webhook — never here.
 */
export async function startCheckout(gameId: string): Promise<CheckoutResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول أولاً.' };

  const admin = createSupabaseAdminClient();

  const { data: game } = await admin
    .from('games')
    .select('id, slug, title, price_cents, currency, status, visibility')
    .eq('id', gameId)
    .maybeSingle();
  if (!game) return { ok: false, error: 'اللعبة غير موجودة.' };

  // Already entitled? (free game, owns a ticket, creator, or moderator.)
  const { data: entitled } = await admin.rpc('user_has_ticket', { gid: game.id, uid: user.id });
  if (entitled || game.price_cents <= 0) {
    return { ok: true, owned: true, slug: game.slug };
  }

  // Record a pending payment first so we always have a row to reconcile against.
  const { data: payment, error: payErr } = await admin
    .from('payments')
    .insert({
      user_id: user.id,
      game_id: game.id,
      amount_cents: game.price_cents,
      currency: game.currency,
      status: 'pending',
    })
    .select('id')
    .single();
  if (payErr || !payment) return { ok: false, error: 'تعذّر بدء عملية الدفع.' };

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  try {
    const charge = await createTapCharge({
      amountCents: game.price_cents,
      currency: game.currency,
      description: `تذكرة لعبة: ${game.title}`,
      customer: { name: profile?.display_name ?? 'لاعب', email: user.email ?? undefined },
      redirectUrl: `${siteUrl}/play/${game.slug}/callback`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tap-webhook`,
      metadata: { payment_id: payment.id, game_id: game.id, user_id: user.id },
    });

    await admin
      .from('payments')
      .update({ provider_charge_id: charge.id })
      .eq('id', payment.id);

    const url = charge.transaction?.url;
    if (!url) return { ok: false, error: 'لم تُرجِع بوابة الدفع رابطاً.' };
    return { ok: true, url };
  } catch (e) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { ok: false, error: e instanceof Error ? e.message : 'فشل الدفع.' };
  }
}
