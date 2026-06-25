'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setError(null);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback?next=/dashboard',
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تسجيل الدخول عبر Google';
      setError(message);
    } finally {
      setOauthLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();

      if (mode === 'register') {
        const { data, error: registerError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

        if (registerError) {
          throw registerError;
        }

        if (!data.session) {
          setError('تم إنشاء الحساب. إذا كان التفعيل بالإيميل موقوفًا فسيتم الدخول مباشرة بعد الموافقة من Supabase.');
          return;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء التسجيل';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
      {mode === 'register' && (
        <div>
          <label className="mb-2 block text-sm text-slate-300">الاسم</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
          />
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm text-slate-300">البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-slate-300">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
        />
      </div>
      {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <button
        disabled={loading || oauthLoading}
        className="w-full rounded-2xl bg-gradient-to-l from-accent to-[#6df0c4] px-4 py-3 font-bold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'جارٍ التنفيذ...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
      </button>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || oauthLoading}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {oauthLoading ? 'جارٍ فتح Google...' : 'التسجيل بواسطة Gmail'}
      </button>
    </form>
  );
}'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setError(null);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تسجيل الدخول عبر Google';
      setError(message);
    } finally {
      setOauthLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();

      if (mode === 'register') {
        const { data, error: registerError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

        if (registerError) {
          throw registerError;
        }

        if (!data.session) {
          setError('تم إنشاء الحساب. إذا كان التفعيل بالإيميل موقوفًا فسيتم الدخول مباشرة بعد الموافقة من Supabase.');
          return;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء التسجيل';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
      {mode === 'register' && (
        <div>
          <label className="mb-2 block text-sm text-slate-300">الاسم</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
          />
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm text-slate-300">البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-slate-300">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 focus:border-accent"
        />
      </div>
      {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <button
        disabled={loading || oauthLoading}
        className="w-full rounded-2xl bg-gradient-to-l from-accent to-[#6df0c4] px-4 py-3 font-bold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'جارٍ التنفيذ...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
      </button>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || oauthLoading}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {oauthLoading ? 'جارٍ فتح Google...' : 'التسجيل بواسطة Gmail'}
      </button>
    </form>
  );
}
