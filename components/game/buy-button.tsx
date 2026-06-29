'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Loader2 } from 'lucide-react';

import { startCheckout } from '@/app/actions/payments';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/money';

interface BuyButtonProps {
  gameId: string;
  slug: string;
  priceCents: number;
  currency: string;
  isLoggedIn: boolean;
}

/**
 * Starts a Tap checkout and redirects the player to the hosted payment page.
 * If they already own a ticket (or the game became free), sends them to play.
 */
export function BuyButton({ gameId, slug, priceCents, currency, isLoggedIn }: BuyButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/games/${slug}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(gameId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if ('owned' in res) {
        router.push(`/play/${res.slug}`);
        return;
      }
      window.location.href = res.url;
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="gradient" size="lg" className="w-full" onClick={onClick} disabled={pending}>
        {pending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Ticket className="size-5" />
        )}
        اشترِ تذكرة · {formatPrice(priceCents, currency)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">دفع آمن عبر Tap — مدى، Apple Pay، وبطاقات</p>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
