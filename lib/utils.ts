import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and dedupe conflicting Tailwind utilities.
 * Standard shadcn/ui helper used across every component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer with thousands separators using Arabic-Latin digits. */
export function formatNumber(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(value);
}

/** Build an absolute URL from a path using the configured site URL. */
export function absoluteUrl(path: string, base: string) {
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
