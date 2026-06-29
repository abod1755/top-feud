import 'server-only';

import { toMajorUnits } from '@/lib/money';

/**
 * Minimal Tap (https://tap.company) Charges API client.
 *
 * SERVER ONLY — the secret key never reaches the browser. We deliberately keep
 * the surface tiny: create a hosted charge (redirect flow) and retrieve a
 * charge to verify its final status server-side. The client is never trusted to
 * report payment success; only a retrieved `CAPTURED` charge mints a ticket.
 */

const TAP_API_BASE = 'https://api.tap.company/v2';

export interface TapCharge {
  id: string;
  status: string; // INITIATED | IN_PROGRESS | CAPTURED | FAILED | DECLINED | ...
  amount: number;
  currency: string;
  reference?: { transaction?: string; order?: string };
  transaction?: { url?: string };
  metadata?: Record<string, string>;
}

function tapHeaders(): HeadersInit {
  const key = process.env.TAP_SECRET_KEY;
  if (!key) {
    throw new Error('TAP_SECRET_KEY غير مضبوط في إعدادات البيئة.');
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

interface CreateChargeInput {
  amountCents: number;
  currency: string;
  description: string;
  customer: { name: string; email?: string };
  redirectUrl: string;
  webhookUrl?: string;
  metadata: Record<string, string>;
}

/** Create a hosted Tap charge and return it (caller redirects to transaction.url). */
export async function createTapCharge(input: CreateChargeInput): Promise<TapCharge> {
  const body = {
    amount: toMajorUnits(input.amountCents),
    currency: input.currency,
    threeDSecure: true,
    description: input.description,
    customer: { first_name: input.customer.name, email: input.customer.email },
    source: { id: 'src_all' },
    redirect: { url: input.redirectUrl },
    ...(input.webhookUrl ? { post: { url: input.webhookUrl } } : {}),
    metadata: input.metadata,
  };

  const res = await fetch(`${TAP_API_BASE}/charges`, {
    method: 'POST',
    headers: tapHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = (await res.json()) as TapCharge & { errors?: { description?: string }[] };
  if (!res.ok || !json.id) {
    const msg = json.errors?.[0]?.description ?? `فشل إنشاء عملية الدفع (HTTP ${res.status}).`;
    throw new Error(msg);
  }
  return json;
}

/** Retrieve a charge to verify its final status server-side. */
export async function retrieveTapCharge(chargeId: string): Promise<TapCharge> {
  const res = await fetch(`${TAP_API_BASE}/charges/${chargeId}`, {
    method: 'GET',
    headers: tapHeaders(),
    cache: 'no-store',
  });
  const json = (await res.json()) as TapCharge & { errors?: { description?: string }[] };
  if (!res.ok || !json.id) {
    const msg = json.errors?.[0]?.description ?? `تعذّر التحقق من الدفع (HTTP ${res.status}).`;
    throw new Error(msg);
  }
  return json;
}
