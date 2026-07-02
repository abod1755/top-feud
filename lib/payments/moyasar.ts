import 'server-only';

/**
 * Minimal Moyasar (https://moyasar.com) client — Invoices + Payments API.
 *
 * SERVER ONLY. Moyasar authenticates with HTTP Basic using the secret key as
 * the username and an empty password. Amounts are in the smallest currency
 * unit (halalas for SAR) — which is exactly how we store prices (`price_cents`),
 * so no conversion is needed. The client is never trusted to report success;
 * only a retrieved `paid` payment mints tickets.
 */

const MOYASAR_API_BASE = 'https://api.moyasar.com/v1';

export interface MoyasarInvoice {
  id: string;
  status: string; // initiated | paid | ...
  url: string; // hosted payment page
  amount: number;
  currency: string;
}

export interface MoyasarPayment {
  id: string;
  status: string; // initiated | paid | failed | ...
  amount: number;
  currency: string;
  metadata?: Record<string, string> | null;
  invoice_id?: string | null;
}

function authHeader(): string {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error('MOYASAR_SECRET_KEY غير مضبوط في إعدادات البيئة.');
  // Basic base64("<secret>:")
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

interface CreateInvoiceInput {
  amountHalalas: number;
  currency: string;
  description: string;
  successUrl: string;
  metadata: Record<string, string>;
}

/** Create a hosted Moyasar invoice; caller redirects the customer to `url`. */
export async function createMoyasarInvoice(input: CreateInvoiceInput): Promise<MoyasarInvoice> {
  const res = await fetch(`${MOYASAR_API_BASE}/invoices`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amountHalalas,
      currency: input.currency,
      description: input.description,
      success_url: input.successUrl,
      metadata: input.metadata,
    }),
    cache: 'no-store',
  });
  const json = (await res.json()) as MoyasarInvoice & { message?: string };
  if (!res.ok || !json.id || !json.url) {
    throw new Error(json.message ?? `فشل إنشاء عملية الدفع (HTTP ${res.status}).`);
  }
  return json;
}

/** Retrieve a payment to verify its final status server-side. */
export async function retrieveMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  const res = await fetch(`${MOYASAR_API_BASE}/payments/${paymentId}`, {
    method: 'GET',
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });
  const json = (await res.json()) as MoyasarPayment & { message?: string };
  if (!res.ok || !json.id) {
    throw new Error(json.message ?? `تعذّر التحقق من الدفع (HTTP ${res.status}).`);
  }
  return json;
}
