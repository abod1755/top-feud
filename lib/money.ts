/**
 * Money helpers. Prices are stored as integer minor units (e.g. halalas /
 * cents) to avoid floating-point drift, and only converted to a decimal at the
 * payment-gateway boundary or for display.
 */

const CURRENCY_LABELS: Record<string, string> = {
  SAR: 'ريال',
  AED: 'درهم',
  KWD: 'دينار',
  USD: 'دولار',
};

/** Convert integer minor units to the major decimal the gateway expects. */
export function toMajorUnits(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/** Format a price for display, e.g. 1500 SAR -> "١٥٫٠٠ ريال" style text. */
export function formatPrice(cents: number, currency = 'SAR'): string {
  const amount = (cents / 100).toLocaleString('ar-SA', {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const label = CURRENCY_LABELS[currency] ?? currency;
  return `${amount} ${label}`;
}
