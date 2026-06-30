'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Ticket } from 'lucide-react';

import { startPlay } from '@/app/actions/play';
import { Button } from '@/components/ui/button';

interface PlayButtonProps {
  gameId: string;
  slug: string;
  ticketCost: number;
  balance: number;
  isLoggedIn: boolean;
}

/**
 * Starts a play session. Free games play directly; paid games spend tickets
 * (handled server-side in startPlay) and redirect into the game. Shows the
 * wallet balance and a recharge link when the balance is short.
 */
export function PlayButton({ gameId, slug, ticketCost, balance, isLoggedIn }: PlayButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shortBalance, setShortBalance] = useState(false);

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/games/${slug}`);
      return;
    }
    setError(null);
    setShortBalance(false);
    startTransition(async () => {
      const res = await startPlay(gameId);
      if (res.ok) {
        router.push(`/play/${res.slug}`);
        return;
      }
      setError(res.error);
      if (typeof res.balance === 'number') setShortBalance(true);
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="gradient" size="lg" className="w-full" onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
        {ticketCost > 0 ? `العب · 🎟️ ${ticketCost} ${ticketCost === 1 ? 'تذكرة' : 'تذاكر'}` : 'العب الآن'}
      </Button>

      {ticketCost > 0 && isLoggedIn && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Ticket className="size-3.5" /> رصيدك: {balance} تذكرة
        </p>
      )}

      {error && (
        <div className="text-center text-sm text-destructive">
          {error}
          {shortBalance && (
            <Link href="/store" className="mt-1 block font-bold text-primary underline">
              اشحن تذاكر من المتجر ←
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
