import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { retrieveMoyasarPayment } from '@/lib/payments/moyasar';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Moyasar returns the customer here after paying (`?id=<payment_id>&status=`).
 * We verify the payment server-side (the only source of truth), mark our
 * payment row, and credit the tickets via grant_tickets (idempotent). The
 * moyasar-webhook handles the case where the customer never returns here.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('id') ?? url.searchParams.get('payment_id');
  const storeUrl = `${siteUrl}/store`;

  if (!paymentId) return NextResponse.redirect(`${storeUrl}?payment=missing`);

  try {
    const payment = await retrieveMoyasarPayment(paymentId);
    const meta = payment.metadata ?? {};
    const admin = createSupabaseAdminClient();

    const paid = payment.status === 'paid';
    if (meta.payment_id) {
      await admin
        .from('payments')
        .update({ status: paid ? 'paid' : 'failed' })
        .eq('id', meta.payment_id);
    }

    if (!paid) return NextResponse.redirect(`${storeUrl}?payment=failed`);

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
