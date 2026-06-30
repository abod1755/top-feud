'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Loader2 } from 'lucide-react';

import { startCheckout } from '@/app/actions/payments';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/money';
import { cn } from '@/lib/utils';

export interface TicketPackageData {
  id: string;
  name: string;
  tickets: number;
  price_cents: number;
  currency: string;
}

/** A ticket package the player can buy. Starts a Tap checkout on click. */
export function PackageCard({
  pkg,
  isLoggedIn,
  highlight,
}: {
  pkg: TicketPackageData;
  isLoggedIn: boolean;
  highlight?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const perTicket = pkg.price_cents / pkg.tickets;

  function onClick() {
    if (!isLoggedIn) {
      router.push('/login?next=/store');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(pkg.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    });
  }

  return (
    <Card className={cn('flex flex-col items-center p-6 text-center', highlight && 'border-[#FFCE1F] shadow-glow')}>
      {highlight && (
        <span className="mb-2 rounded-full bg-[#FFCE1F] px-3 py-0.5 text-xs font-extrabold text-[#06141a]">الأكثر توفيرًا</span>
      )}
      <Ticket className="size-8 text-[#FFCE1F]" />
      <h3 className="mt-2 font-display text-lg font-bold">{pkg.name}</h3>
      <div className="mt-3 font-display text-4xl font-extrabold tabular-nums">{pkg.tickets}</div>
      <div className="text-sm text-muted-foreground">تذكرة</div>

      <div className="mt-4 font-display text-2xl font-extrabold text-primary">{formatPrice(pkg.price_cents, pkg.currency)}</div>
      <div className="text-xs text-muted-foreground">{formatPrice(Math.round(perTicket), pkg.currency)} / تذكرة</div>

      <Button variant="gradient" size="lg" className="mt-5 w-full" onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : 'شراء'}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Card>
  );
}
