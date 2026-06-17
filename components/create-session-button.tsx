'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateSessionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createSession() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/sessions', { method: 'POST' });
    setLoading(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? 'فشل إنشاء الجلسة');
      return;
    }

    const data = await res.json();
    router.push(`/game/${data.session.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button onClick={createSession} disabled={loading} className="rounded-2xl bg-gradient-to-l from-accent to-[#6df0c4] px-5 py-3 font-bold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'جارٍ إنشاء الجلسة...' : 'إنشاء جلسة لعب'}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}