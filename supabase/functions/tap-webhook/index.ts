// Tap payment webhook (Supabase Edge Function, Deno runtime).
//
// Tap POSTs the charge object here after a payment. Because a redirect can be
// lost (player closes the tab), this webhook is the reliable path that mints
// the ticket. We never trust the POST body's status field — we re-retrieve the
// charge from Tap using the secret key, and only a `CAPTURED` charge grants a
// ticket. Ticket creation is idempotent (grant_ticket upserts), so the redirect
// callback and this webhook firing for the same charge is safe.
//
// Required secrets (set with `supabase secrets set`):
//   TAP_SECRET_KEY            — your Tap secret (sk_live_... / sk_test_...)
// Auto-provided by the platform:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TAP_API_BASE = 'https://api.tap.company/v2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const tapSecret = Deno.env.get('TAP_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!tapSecret || !supabaseUrl || !serviceKey) {
    return new Response('Server not configured', { status: 500 });
  }

  let chargeId: string | undefined;
  try {
    const body = await req.json();
    chargeId = body?.id;
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!chargeId) return new Response('Missing charge id', { status: 400 });

  // Re-retrieve the charge from Tap — the authoritative status.
  const tapRes = await fetch(`${TAP_API_BASE}/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${tapSecret}` },
  });
  const charge = await tapRes.json();
  if (!tapRes.ok || !charge?.id) {
    return new Response('Could not verify charge', { status: 502 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const captured = charge.status === 'CAPTURED';
  const meta = charge.metadata ?? {};

  await supabase
    .from('payments')
    .update({ status: captured ? 'paid' : 'failed' })
    .eq('provider_charge_id', chargeId);

  if (captured && meta.user_id && meta.game_id) {
    await supabase.rpc('grant_ticket', {
      p_user: meta.user_id,
      p_game: meta.game_id,
      p_payment: meta.payment_id ?? null,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
