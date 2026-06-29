import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { retrieveTapCharge } from '@/lib/payments/tap';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Tap redirects the player back here after the hosted payment with `?tap_id=`.
 * We verify the charge server-side (the only authoritative source of truth),
 * mark the payment, mint the ticket, and send the player into the game. A
 * matching webhook (supabase/functions/tap-webhook) handles the async case
 * where the player closes the tab before the redirect fires.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('tap_id');

  const gameUrl = `${siteUrl}/games/${slug}`;
  const playUrl = `${siteUrl}/play/${slug}`;

  if (!chargeId) {
    return NextResponse.redirect(`${gameUrl}?payment=missing`);
  }

  try {
    const charge = await retrieveTapCharge(chargeId);
    const meta = charge.metadata ?? {};
    const admin = createSupabaseAdminClient();

    const captured = charge.status === 'CAPTURED';

    // Reconcile the payment row by its Tap charge id.
    await admin
      .from('payments')
      .update({ status: captured ? 'paid' : 'failed' })
      .eq('provider_charge_id', chargeId);

    if (!captured) {
      return NextResponse.redirect(`${gameUrl}?payment=failed`);
    }

    if (meta.user_id && meta.game_id) {
      await admin.rpc('grant_ticket', {
        p_user: meta.user_id,
        p_game: meta.game_id,
        p_payment: meta.payment_id ?? undefined,
      });
    }

    return NextResponse.redirect(`${playUrl}?payment=success`);
  } catch {
    return NextResponse.redirect(`${gameUrl}?payment=error`);
  }
}
