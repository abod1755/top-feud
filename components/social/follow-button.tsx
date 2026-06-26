'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck } from 'lucide-react';

import { toggleFollow } from '@/app/actions/social';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  targetUserId: string;
  handle: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export function FollowButton({ targetUserId, handle, initialFollowing, isLoggedIn }: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/u/${handle}`);
      return;
    }
    const optimistic = !following;
    setFollowing(optimistic); // optimistic update
    startTransition(async () => {
      const res = await toggleFollow(targetUserId, handle);
      if (!res.ok) {
        setFollowing(!optimistic); // revert
        window.alert(res.error ?? 'تعذّر تنفيذ العملية');
      } else {
        setFollowing(res.following);
        router.refresh();
      }
    });
  }

  return (
    <Button variant={following ? 'outline' : 'gradient'} size="sm" onClick={onClick} disabled={pending}>
      {following ? (
        <>
          <UserCheck className="size-4" /> متابَع
        </>
      ) : (
        <>
          <UserPlus className="size-4" /> متابعة
        </>
      )}
    </Button>
  );
}
