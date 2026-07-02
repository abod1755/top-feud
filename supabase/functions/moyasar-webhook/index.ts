// Moyasar payment webhook (Supabase Edge Function, Deno runtime).
//
// Moyasar POSTs an event ({ type, data: <payment> }) whenever a payment
// changes state. Because a redirect can be lost (customer closes the tab),
// this webhook is the reliable path that credits tickets. We never trust the
// POST body's status — we re-retrieve the payment from Moyasar with the secret
// key, and only a `paid` payment grants tickets. grant_tickets is idempotent
// (one credit per payment), so the redirect callback and this webhook both
// firing for the same payment is safe.
//
// Required secret (set with `supabase secrets set`):
//   MOYASAR_SECRET_KEY   — your Moyasar secret (sk_test_... / sk_live_...)
// Auto-provided by the platform:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MOYASAR_API_BASE = 'https://api.moyasar.com/v1';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const moyasarSecret = Deno.env.get('MOYASAR_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!moyasarSecret || !supabaseUrl || !serviceKey) {
    return new Response('Server not configured', { status: 500 });
  }

  let paymentId: string | undefined;
  try {
    const body = await req.json();
    paymentId = body?.data?.id ?? body?.id;
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!paymentId) return new Response('Missing payment id', { status: 400 });

  // Re-retrieve the payment from Moyasar — the authoritative status.
  const auth = `Basic ${btoa(`${moyasarSecret}:`)}`;
  const mRes = await fetch(`${MOYASAR_API_BASE}/payments/${paymentId}`, {
    headers: { Authorization: auth },
  });
  const payment = await mRes.json();
  if (!mRes.ok || !payment?.id) return new Response('Could not verify payment', { status: 502 });

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const paid = payment.status === 'paid';
  const meta = payment.metadata ?? {};

  if (meta.payment_id) {
    await supabase
      .from('payments')
      .update({ status: paid ? 'paid' : 'failed' })
      .eq('id', meta.payment_id);
  }

  const tickets = Number(meta.tickets ?? 0);
  if (paid && meta.user_id && tickets > 0) {
    await supabase.rpc('grant_tickets', {
      p_user: meta.user_id,
      p_count: tickets,
      p_payment: meta.payment_id ?? null,
      p_package: meta.package_id ?? null,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
