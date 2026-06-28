'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface ToggleButtonProps {
  id: string;
  initial: boolean;
  onLabel: string;
  offLabel: string;
  action: (id: string, next: boolean) => Promise<{ ok: boolean; error?: string }>;
}

/** Generic admin boolean toggle (verify, feature, publish…). */
export function ToggleButton({ id, initial, onLabel, offLabel, action }: ToggleButtonProps) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function click() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await action(id, next);
      if (!res.ok) {
        setOn(!next);
        window.alert(res.error ?? 'تعذّر التنفيذ');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button size="sm" variant={on ? 'default' : 'outline'} onClick={click} disabled={pending}>
      {on ? onLabel : offLabel}
    </Button>
  );
}
