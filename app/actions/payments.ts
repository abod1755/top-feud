'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createTapCharge } from '@/lib/payments/tap';
import { siteUrl } from '@/lib/env';

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Starts a Tap checkout to buy a ticket PACKAGE. Tickets are credited to the
 * player's wallet only after the charge is verified (callback / webhook) — never
 * from the client. The price and ticket count come from the DB, not the client.
 */
export async function startCheckout(packageId: string): Promise<CheckoutResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول أولاً.' };

  const admin = createSupabaseAdminClient();

  const { data: pkg } = await admin
    .from('ticket_packages')
    .select('id, name, tickets, price_cents, currency, is_active')
    .eq('id', packageId)
    .maybeSingle();
  if (!pkg || !pkg.is_active) return { ok: false, error: 'الباقة غير متاحة.' };

  const { data: payment, error: payErr } = await admin
    .from('payments')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      amount_cents: pkg.price_cents,
      currency: pkg.currency,
      tickets_granted: pkg.tickets,
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
      amountCents: pkg.price_cents,
      currency: pkg.currency,
      description: `${pkg.name} — ${pkg.tickets} تذكرة`,
      customer: { name: profile?.display_name ?? 'لاعب', email: user.email ?? undefined },
      redirectUrl: `${siteUrl}/checkout/callback`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tap-webhook`,
      metadata: {
        payment_id: payment.id,
        package_id: pkg.id,
        user_id: user.id,
        tickets: String(pkg.tickets),
      },
    });

    await admin.from('payments').update({ provider_charge_id: charge.id }).eq('id', payment.id);

    const url = charge.transaction?.url;
    if (!url) return { ok: false, error: 'لم تُرجِع بوابة الدفع رابطاً.' };
    return { ok: true, url };
  } catch (e) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { ok: false, error: e instanceof Error ? e.message : 'فشل الدفع.' };
  }
}
