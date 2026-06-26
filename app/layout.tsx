import type { Metadata, Viewport } from 'next';
import { Cairo, Inter } from 'next/font/google';

import './globals.css';
import { BRAND } from '@/lib/brand';
import { siteUrl } from '@/lib/env';
import { cn } from '@/lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDisplay = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: ['لمّة', 'Lamma', 'ألعاب جماعية', 'فاميلي فيود', 'سباق الحروف', 'ألعاب عائلية', 'مسابقات'],
  authors: [{ name: BRAND.name }],
  applicationName: BRAND.name,
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.name,
    description: BRAND.tagline,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#07111f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn('dark', fontSans.variable, fontDisplay.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
