'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { deleteGame } from '@/app/actions/games';
import { Button } from '@/components/ui/button';

export function DeleteGameButton({ gameId, title }: { gameId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(`حذف «${title}» نهائيًا؟ لا يمكن التراجع عن هذا.`)) return;
    startTransition(async () => {
      const res = await deleteGame(gameId);
      if (res.ok) router.refresh();
      else window.alert(res.error ?? 'تعذّر الحذف');
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onDelete}
      disabled={pending}
      className="text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="size-4" /> {pending ? 'يحذف…' : 'حذف'}
    </Button>
  );
}
