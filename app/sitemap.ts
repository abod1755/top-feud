import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/env';

/**
 * Static routes are listed here today. Once the games catalog exists
 * (Milestone 3) this function will also stream published game and profile URLs
 * from Supabase so every public page is indexable.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/explore', '/leaderboard', '/login', '/register'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
