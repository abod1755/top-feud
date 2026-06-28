'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBox({ initial = '', category }: { initial?: string; category?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category) params.set('category', category);
    const qs = params.toString();
    router.push(`/explore${qs ? `?${qs}` : ''}`);
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث عن لعبة…"
        className="w-full rounded-2xl border-2 border-border bg-card/60 py-3 pr-12 pl-4 text-lg outline-none transition focus:border-primary"
      />
    </form>
  );
}
