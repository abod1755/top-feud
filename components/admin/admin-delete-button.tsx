'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { adminDeleteGame } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export function AdminDeleteButton({ gameId, title }: { gameId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function del() {
    if (!window.confirm(`حذف «${title}» نهائيًا؟`)) return;
    startTransition(async () => {
      const res = await adminDeleteGame(gameId);
      if (res.ok) router.refresh();
      else window.alert(res.error ?? 'تعذّر الحذف');
    });
  }

  return (
    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={del} disabled={pending} aria-label="حذف">
      <Trash2 className="size-4" />
    </Button>
  );
}
