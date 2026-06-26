'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { toggleFavorite } from '@/app/actions/engagement';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';

interface FavoriteButtonProps {
  gameId: string;
  slug: string;
  initialFavorited: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export function FavoriteButton({ gameId, slug, initialFavorited, initialCount, isLoggedIn }: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/games/${slug}`);
      return;
    }
    const next = !favorited;
    setFavorited(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleFavorite(gameId, slug);
      if (!res.ok) {
        setFavorited(!next);
        setCount((c) => c + (next ? -1 : 1));
        window.alert(res.error ?? 'تعذّر تنفيذ العملية');
      } else {
        setFavorited(res.favorited);
        router.refresh();
      }
    });
  }

  return (
    <Button variant={favorited ? 'default' : 'outline'} size="sm" onClick={onClick} disabled={pending}>
      <Heart className={cn('size-4', favorited && 'fill-current')} />
      {formatNumber(count)}
    </Button>
  );
}
