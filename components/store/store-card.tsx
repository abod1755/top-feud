import Link from 'next/link';
import { Star, Play } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BuyButton } from '@/components/game/buy-button';
import { GAME_TYPES, type GameTypeKey } from '@/lib/brand';
import { formatNumber } from '@/lib/utils';
import { formatPrice } from '@/lib/money';

export interface StoreCardData {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  game_type: GameTypeKey;
  price_cents: number;
  currency: string;
  play_count: number;
  rating_avg: number;
  rating_count: number;
}

/** A single shop tile: cover, price badge, and a buy (or play, if owned) CTA. */
export function StoreCard({ game, owned, isLoggedIn }: { game: StoreCardData; owned: boolean; isLoggedIn: boolean }) {
  const type = GAME_TYPES[game.game_type];

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link href={`/games/${game.slug}`} className="group block">
        <div className="relative grid h-32 place-items-center bg-gradient-to-br from-[#FFCE1F]/25 to-secondary/20">
          <span className="text-5xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
            {type.emoji}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-[#FFCE1F] px-3 py-1 text-xs font-extrabold text-[#06141a] shadow">
            🎟️ {formatPrice(game.price_cents, game.currency)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link href={`/games/${game.slug}`}>
            <h3 className="font-display text-lg font-bold leading-tight line-clamp-1 hover:text-primary">{game.title}</h3>
          </Link>
          {game.tagline && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{game.tagline}</p>}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-primary text-primary" />
            {game.rating_count > 0 ? game.rating_avg.toFixed(1) : '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Play className="size-3.5" />
            {formatNumber(game.play_count)}
          </span>
        </div>

        <div className="mt-auto">
          {owned ? (
            <div className="space-y-1.5">
              <Button asChild variant="gradient" size="sm" className="w-full">
                <Link href={`/play/${game.slug}`}>العب الآن</Link>
              </Button>
              <p className="text-center text-[11px] font-semibold text-success">✓ تملك تذكرتها</p>
            </div>
          ) : (
            <BuyButton
              gameId={game.id}
              slug={game.slug}
              priceCents={game.price_cents}
              currency={game.currency}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
