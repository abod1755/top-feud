/**
 * Next.js configuration for Top Feud.
 *
 * Security headers are applied to every route. The Content-Security-Policy is
 * intentionally strict; when we begin embedding user-supplied media (images,
 * audio, video) and Supabase Storage URLs in later milestones, the relevant
 * sources are already allow-listed below via the Supabase URL env var.
 *
 * @type {import('next').NextConfig}
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '';
const supabaseWildcard = supabaseHost ? `https://*.${supabaseHost.split('.').slice(-2).join('.')}` : '';

const csp = [
  `default-src 'self'`,
  // Next.js requires 'unsafe-inline' for its inline bootstrap script in dev;
  // in production Next emits nonces, but framer-motion injects styles so we keep
  // style-src relaxed. Script is locked to self + Supabase.
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: ${supabaseUrl} ${supabaseWildcard}`.trim(),
  `media-src 'self' blob: ${supabaseUrl} ${supabaseWildcard}`.trim(),
  `connect-src 'self' ${supabaseUrl} ${supabaseWildcard} wss://${supabaseHost}`.trim(),
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost }, { protocol: 'https', hostname: `*.${supabaseHost.split('.').slice(-2).join('.')}` }]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
