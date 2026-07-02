import Link from 'next/link';
import { Star, Play, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { GAME_TYPES, DIFFICULTY_LABELS, type GameTypeKey } from '@/lib/brand';
import { cn, formatNumber } from '@/lib/utils';

export interface GameCardData {
  slug: string;
  title: string;
  tagline: string | null;
  game_type: GameTypeKey;
  difficulty: string;
  cover_image_url: string | null;
  rating_avg: number;
  rating_count: number;
  play_count: number;
  creatorName: string;
  creatorAvatar: string | null;
}

const TYPE_GRADIENT: Record<GameTypeKey, string> = {
  family_feud: 'from-primary/30 to-secondary/20',
  word_builder: 'from-secondary/30 to-primary/20',
  quiz: 'from-[#FFCE1F]/30 to-primary/20',
  photo_guess: 'from-[#F43F9D]/30 to-secondary/20',
  letter_hive: 'from-success/30 to-[#FFCE1F]/20',
};

export function GameCard({ game }: { game: GameCardData }) {
  const type = GAME_TYPES[game.game_type];

  return (
    <Link href={`/games/${game.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-primary/40">
        <div
          className={cn(
            'relative grid h-32 place-items-center bg-gradient-to-br',
            TYPE_GRADIENT[game.game_type],
          )}
        >
          {game.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl" aria-hidden>
              {type.emoji}
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-background/70 px-3 py-1 text-xs font-semibold backdrop-blur">
            {type.label}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-display text-lg font-bold leading-tight line-clamp-1">{game.title}</h3>
            {game.tagline && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{game.tagline}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className="grid h-6 w-6 place-items-center rounded-full bg-cover bg-center text-[10px] font-bold text-primary-foreground"
              style={
                game.creatorAvatar
                  ? { backgroundImage: `url("${game.creatorAvatar}")` }
                  : { background: 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))' }
              }
            >
              {game.creatorAvatar ? '' : game.creatorName.charAt(0)}
            </span>
            <span className="line-clamp-1">{game.creatorName}</span>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-primary text-primary" />
              {game.rating_count > 0 ? game.rating_avg.toFixed(1) : '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Play className="size-3.5" />
              {formatNumber(game.play_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {DIFFICULTY_LABELS[game.difficulty] ?? game.difficulty}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
