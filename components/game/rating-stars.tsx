'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

import { rateGame } from '@/app/actions/engagement';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  gameId: string;
  slug: string;
  initialUserRating: number; // 0 = not rated
  average: number;
  count: number;
  isLoggedIn: boolean;
}

export function RatingStars({ gameId, slug, initialUserRating, average, count, isLoggedIn }: RatingStarsProps) {
  const router = useRouter();
  const [userRating, setUserRating] = useState(initialUserRating);
  const [hover, setHover] = useState(0);
  const [pending, startTransition] = useTransition();

  function rate(n: number) {
    if (!isLoggedIn) {
      router.push(`/login?next=/games/${slug}`);
      return;
    }
    setUserRating(n);
    startTransition(async () => {
      const res = await rateGame(gameId, slug, n);
      if (!res.ok) window.alert(res.error ?? 'تعذّر حفظ التقييم');
      else router.refresh();
    });
  }

  const display = hover || userRating;

  return (
    <div>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => rate(n)}
            onMouseEnter={() => setHover(n)}
            disabled={pending}
            aria-label={`${n} نجوم`}
          >
            <Star className={cn('size-6 transition', n <= display ? 'fill-primary text-primary' : 'text-muted-foreground/40')} />
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {count > 0 ? `${average.toFixed(1)} من ${count} تقييم` : 'كن أول من يقيّم'}
        {userRating > 0 && ` • تقييمك: ${userRating}`}
      </p>
    </div>
  );
}
