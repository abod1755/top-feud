import 'server-only';

import type { GameCardData } from '@/components/game-card';
import type { GameTypeKey } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type GameSort = 'recent' | 'popular' | 'rating';

export interface GameQuery {
  type?: GameTypeKey;
  sort?: GameSort;
  search?: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches published, public games for discovery surfaces (Explore, Search,
 * Categories). Creators are resolved in a single follow-up query rather than a
 * typed embed, keeping the query simple and the result strongly typed.
 */
export async function getPublishedGames(opts: GameQuery = {}): Promise<GameCardData[]> {
  const { type, sort = 'recent', search, categorySlug, limit = 24, offset = 0 } = opts;
  const supabase = await createSupabaseServerClient();

  // When filtering by category we need the matching game ids first.
  let categoryGameIds: string[] | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();
    if (!cat) return [];
    const { data: links } = await supabase
      .from('game_categories')
      .select('game_id')
      .eq('category_id', cat.id);
    categoryGameIds = (links ?? []).map((l) => l.game_id);
    if (categoryGameIds.length === 0) return [];
  }

  let query = supabase
    .from('games')
    .select(
      'id, slug, title, tagline, game_type, difficulty, cover_image_url, rating_avg, rating_count, play_count, creator_id',
    )
    .eq('status', 'published')
    .eq('visibility', 'public');

  if (type) query = query.eq('game_type', type);
  if (search) query = query.ilike('title', `%${search}%`);
  if (categoryGameIds) query = query.in('id', categoryGameIds);

  if (sort === 'popular') query = query.order('play_count', { ascending: false });
  else if (sort === 'rating') {
    query = query.order('rating_avg', { ascending: false }).order('rating_count', { ascending: false });
  } else {
    query = query.order('published_at', { ascending: false, nullsFirst: false });
  }

  const { data: games } = await query.range(offset, offset + limit - 1);
  if (!games || games.length === 0) return [];

  const creatorIds = [...new Set(games.map((g) => g.creator_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', creatorIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return games.map((g) => ({
    slug: g.slug,
    title: g.title,
    tagline: g.tagline,
    game_type: g.game_type,
    difficulty: g.difficulty,
    cover_image_url: g.cover_image_url,
    rating_avg: g.rating_avg,
    rating_count: g.rating_count,
    play_count: g.play_count,
    creatorName: byId.get(g.creator_id)?.display_name ?? 'مجهول',
    creatorAvatar: byId.get(g.creator_id)?.avatar_url ?? null,
  }));
}
