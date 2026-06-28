'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { resolveReport } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export function ReportButtons({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(status: 'resolved' | 'dismissed') {
    startTransition(async () => {
      const res = await resolveReport(reportId, status);
      if (res.ok) router.refresh();
      else window.alert(res.error ?? 'تعذّر التنفيذ');
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => act('resolved')} disabled={pending}>
        حلّ
      </Button>
      <Button size="sm" variant="ghost" onClick={() => act('dismissed')} disabled={pending}>
        تجاهل
      </Button>
    </div>
  );
}
