import type { Metadata, Viewport } from 'next';
import { Cairo, Inter } from 'next/font/google';

import './globals.css';
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
    default: 'Top Feud — منصة ألعاب فاميلي فيود',
    template: '%s · Top Feud',
  },
  description:
    'اكتشف، أنشئ، والعب أفضل ألعاب فاميلي فيود العربية. منصة احترافية لصُنّاع المحتوى واللاعبين مع وضع العرض على التلفاز، لوحات الصدارة، والمجتمع.',
  keywords: ['Family Feud', 'فاميلي فيود', 'ألعاب عائلية', 'مسابقات', 'Top Feud', 'العاب جماعية'],
  authors: [{ name: 'Top Feud' }],
  applicationName: 'Top Feud',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'Top Feud',
    title: 'Top Feud — منصة ألعاب فاميلي فيود',
    description: 'اكتشف، أنشئ، والعب أفضل ألعاب فاميلي فيود العربية.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Feud',
    description: 'اكتشف، أنشئ، والعب أفضل ألعاب فاميلي فيود العربية.',
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
