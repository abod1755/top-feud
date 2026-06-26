import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Play, Layers, ListChecks } from 'lucide-react';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/game/favorite-button';
import { RatingStars } from '@/components/game/rating-stars';
import { GAME_TYPES, DIFFICULTY_LABELS, type GameTypeKey } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';

async function getGame(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: game } = await supabase
    .from('games')
    .select(
      'id, slug, title, tagline, description, game_type, difficulty, rounds_count, questions_count, play_count, favorites_count, rating_avg, rating_count, creator_id',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!game) return null;

  const { data: creator } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url')
    .eq('id', game.creator_id)
    .maybeSingle();

  return { game, creator };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGame(slug);
  if (!result) return { title: 'لعبة غير موجودة' };
  return { title: result.game.title, description: result.game.tagline ?? undefined };
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getGame(slug);
  if (!result) notFound();

  const { game, creator } = result;
  const type = GAME_TYPES[game.game_type as GameTypeKey];

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favorited = false;
  let userRating = 0;
  if (user) {
    const [{ data: fav }, { data: rating }] = await Promise.all([
      supabase.from('game_favorites').select('game_id').eq('user_id', user.id).eq('game_id', game.id).maybeSingle(),
      supabase.from('game_ratings').select('rating').eq('user_id', user.id).eq('game_id', game.id).maybeSingle(),
    ]);
    favorited = Boolean(fav);
    userRating = rating?.rating ?? 0;
  }

  return (
    <main>
      <Header />
      <div className="container py-10">
        <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
          ← رجوع للاكتشاف
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                {type.emoji} {type.label}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {DIFFICULTY_LABELS[game.difficulty] ?? game.difficulty}
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl font-extrabold">{game.title}</h1>
            {game.tagline && <p className="mt-2 text-lg text-muted-foreground">{game.tagline}</p>}
            {game.description && <p className="mt-6 leading-8 text-foreground/90">{game.description}</p>}

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Play className="size-4" /> {formatNumber(game.play_count)} لعبة
              </span>
              {game.game_type === 'family_feud' && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="size-4" /> {game.rounds_count} جولات
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="size-4" /> {game.questions_count} سؤال
                  </span>
                </>
              )}
            </div>
          </div>

          <aside className="glass space-y-5 rounded-2xl p-6 shadow-glow">
            {creator && (
              <Link
                href={`/u/${creator.handle}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition hover:border-primary/40"
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full bg-cover bg-center font-bold text-primary-foreground"
                  style={
                    creator.avatar_url
                      ? { backgroundImage: `url("${creator.avatar_url}")` }
                      : { background: 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' }
                  }
                >
                  {creator.avatar_url ? '' : creator.display_name.charAt(0)}
                </span>
                <span>
                  <span className="block font-semibold">{creator.display_name}</span>
                  <span className="text-xs text-muted-foreground">@{creator.handle}</span>
                </span>
              </Link>
            )}

            <Button asChild variant="gradient" size="lg" className="w-full">
              <Link href={`/play/${game.slug}`}>العب الآن</Link>
            </Button>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">أعجبتك؟</span>
              <FavoriteButton
                gameId={game.id}
                slug={game.slug}
                initialFavorited={favorited}
                initialCount={game.favorites_count}
                isLoggedIn={Boolean(user)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <span className="mb-2 block text-sm text-muted-foreground">قيّم اللعبة</span>
              <RatingStars
                gameId={game.id}
                slug={game.slug}
                initialUserRating={userRating}
                average={game.rating_avg}
                count={game.rating_count}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
