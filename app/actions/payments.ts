'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createMoyasarInvoice } from '@/lib/payments/moyasar';
import { siteUrl } from '@/lib/env';

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Starts a Moyasar checkout to buy a ticket PACKAGE. Tickets are credited to
 * the wallet only after the payment is verified (callback / webhook) — never
 * from the client. Price and ticket count come from the DB. Amounts are in
 * halalas, which is exactly how `price_cents` is stored.
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
      provider: 'moyasar',
      amount_cents: pkg.price_cents,
      currency: pkg.currency,
      tickets_granted: pkg.tickets,
      status: 'pending',
    })
    .select('id')
    .single();
  if (payErr || !payment) return { ok: false, error: 'تعذّر بدء عملية الدفع.' };

  try {
    const invoice = await createMoyasarInvoice({
      amountHalalas: pkg.price_cents,
      currency: pkg.currency,
      description: `${pkg.name} — ${pkg.tickets} تذكرة`,
      successUrl: `${siteUrl}/checkout/callback`,
      metadata: {
        payment_id: payment.id,
        package_id: pkg.id,
        user_id: user.id,
        tickets: String(pkg.tickets),
      },
    });

    await admin.from('payments').update({ provider_charge_id: invoice.id }).eq('id', payment.id);
    return { ok: true, url: invoice.url };
  } catch (e) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { ok: false, error: e instanceof Error ? e.message : 'فشل الدفع.' };
  }
}
