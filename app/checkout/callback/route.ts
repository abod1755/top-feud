import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { retrieveTapCharge } from '@/lib/payments/tap';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Tap returns the player here after paying for a ticket package (`?tap_id=`).
 * We verify the charge server-side, mark the payment, and credit the tickets to
 * the wallet via grant_tickets (idempotent). The tap-webhook handles the case
 * where the player never makes it back to this redirect.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('tap_id');
  const storeUrl = `${siteUrl}/store`;

  if (!chargeId) return NextResponse.redirect(`${storeUrl}?payment=missing`);

  try {
    const charge = await retrieveTapCharge(chargeId);
    const meta = charge.metadata ?? {};
    const admin = createSupabaseAdminClient();

    const captured = charge.status === 'CAPTURED';
    await admin
      .from('payments')
      .update({ status: captured ? 'paid' : 'failed' })
      .eq('provider_charge_id', chargeId);

    if (!captured) return NextResponse.redirect(`${storeUrl}?payment=failed`);

    const tickets = Number(meta.tickets ?? 0);
    if (meta.user_id && tickets > 0) {
      await admin.rpc('grant_tickets', {
        p_user: meta.user_id,
        p_count: tickets,
        p_payment: meta.payment_id ?? null,
        p_package: meta.package_id ?? undefined,
      });
    }

    return NextResponse.redirect(`${storeUrl}?payment=success`);
  } catch {
    return NextResponse.redirect(`${storeUrl}?payment=error`);
  }
}
