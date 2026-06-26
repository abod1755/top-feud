import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BadgeCheck } from 'lucide-react';

import { Header } from '@/components/header';
import { GameCard, type GameCardData } from '@/components/game-card';
import { FollowButton } from '@/components/social/follow-button';
import type { GameTypeKey } from '@/lib/brand';
import { formatNumber } from '@/lib/utils';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function loadProfile(handle: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url, role, is_verified, followers_count, following_count, games_count')
    .eq('handle', handle)
    .maybeSingle();
  if (!profile) return null;

  const { data: games } = await supabase
    .from('games')
    .select('slug, title, tagline, game_type, difficulty, cover_image_url, rating_avg, rating_count, play_count')
    .eq('creator_id', profile.id)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('published_at', { ascending: false, nullsFirst: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: f } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();
    isFollowing = Boolean(f);
  }

  const cards: GameCardData[] = (games ?? []).map((g) => ({
    slug: g.slug,
    title: g.title,
    tagline: g.tagline,
    game_type: g.game_type as GameTypeKey,
    difficulty: g.difficulty,
    cover_image_url: g.cover_image_url,
    rating_avg: g.rating_avg,
    rating_count: g.rating_count,
    play_count: g.play_count,
    creatorName: profile.display_name,
    creatorAvatar: profile.avatar_url,
  }));

  return { profile, cards, user, isFollowing, isSelf: user?.id === profile.id };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const result = await loadProfile(handle);
  if (!result) return { title: 'ملف غير موجود' };
  return { title: `${result.profile.display_name} (@${result.profile.handle})` };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const result = await loadProfile(handle);
  if (!result) notFound();

  const { profile, cards, user, isFollowing, isSelf } = result;

  return (
    <main>
      <Header />
      <div className="container py-10">
        <section className="glass flex flex-col items-center gap-4 rounded-2xl p-8 text-center sm:flex-row sm:text-right">
          <span
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-cover bg-center font-display text-3xl font-bold text-primary-foreground"
            style={
              profile.avatar_url
                ? { backgroundImage: `url("${profile.avatar_url}")` }
                : { background: 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' }
            }
          >
            {profile.avatar_url ? '' : profile.display_name.charAt(0)}
          </span>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-extrabold">{profile.display_name}</h1>
              {profile.is_verified && <BadgeCheck className="size-5 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            {profile.bio && <p className="mt-2 max-w-xl text-sm">{profile.bio}</p>}

            <div className="mt-3 flex flex-wrap justify-center gap-5 text-sm sm:justify-start">
              <span><strong>{formatNumber(profile.games_count)}</strong> <span className="text-muted-foreground">لعبة</span></span>
              <span><strong>{formatNumber(profile.followers_count)}</strong> <span className="text-muted-foreground">متابِع</span></span>
              <span><strong>{formatNumber(profile.following_count)}</strong> <span className="text-muted-foreground">يتابع</span></span>
            </div>
          </div>

          {!isSelf && (
            <FollowButton
              targetUserId={profile.id}
              handle={profile.handle}
              initialFollowing={isFollowing}
              isLoggedIn={Boolean(user)}
            />
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">ألعاب {profile.display_name}</h2>
          {cards.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">لا توجد ألعاب منشورة بعد.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((game) => (
                <GameCard key={game.slug} game={game} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
