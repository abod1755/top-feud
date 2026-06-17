'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload =
      mode === 'register'
        ? { email, password, options: { data: { display_name: displayName } } }
        : { email, password };

    const result =
      mode === 'register'
        ? await supabase.auth.signUp(payload)
        : await supabase.auth.signInWithPassword(payload);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
      {mode === 'register' && (
        <div>
          <label className="mb-2 block text-sm text-slate-300">الاسم</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent" />
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm text-slate-300">البريد الإلكتروني</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent" />
      </div>
      <div>
        <label className="mb-2 block text-sm text-slate-300">كلمة المرور</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent" />
      </div>
      {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-l from-accent to-[#6df0c4] px-4 py-3 font-bold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'جارٍ التنفيذ...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
      </button>
    </form>
  );
}