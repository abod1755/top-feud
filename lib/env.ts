import { z } from 'zod';

/**
 * Centralised, validated environment configuration.
 *
 * Importing `env` anywhere guarantees the required variables exist and are
 * well-formed at boot; a misconfigured deployment fails fast with a clear
 * message instead of throwing deep inside a request. Server-only secrets are
 * never exposed to the client because this module is only imported from server
 * code paths, and the public vars are the only ones prefixed `NEXT_PUBLIC_`.
 */

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  TAP_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

const isServer = typeof window === 'undefined';

function parseEnv() {
  const source = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    TAP_SECRET_KEY: process.env.TAP_SECRET_KEY,
  };

  const schema = isServer ? serverSchema : clientSchema;
  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}

export const env = parseEnv();

export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
