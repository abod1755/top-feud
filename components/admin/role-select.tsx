'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { setUserRole } from '@/app/actions/admin';

type Role = 'player' | 'creator' | 'moderator' | 'admin';
const ROLES: [Role, string][] = [
  ['player', 'لاعب'],
  ['creator', 'صانع'],
  ['moderator', 'مشرف'],
  ['admin', 'أدمن'],
];

export function RoleSelect({ userId, initial }: { userId: string; initial: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={initial}
      disabled={pending}
      onChange={(e) => {
        const role = e.target.value as Role;
        startTransition(async () => {
          const res = await setUserRole(userId, role);
          if (res.ok) router.refresh();
          else window.alert(res.error ?? 'تعذّر التغيير');
        });
      }}
      className="rounded-lg border-2 border-border bg-background/60 px-2 py-1 text-sm outline-none focus:border-primary"
    >
      {ROLES.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
