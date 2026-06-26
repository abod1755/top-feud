'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { PRESET_AVATARS, DEFAULT_AVATAR } from '@/lib/avatars';
import { cn } from '@/lib/utils';

type Gender = 'male' | 'female';

const inputClass =
  'w-full rounded-xl border border-border bg-background/50 px-4 py-3 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR.url);
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
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول عبر Google');
      setOauthLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mode === 'register' && !gender) {
      setError('اختر النوع (ذكر أو أنثى) قبل المتابعة.');
      return;
    }

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
            data: { display_name: displayName, gender, avatar_url: avatarUrl },
          },
        });
        if (registerError) throw registerError;
        if (!data.session) {
          setError('تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلاً، افتح رسالة التفعيل ثم سجّل دخولك.');
          return;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-5 rounded-2xl p-6 shadow-glow">
      {mode === 'register' && (
        <>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">الاسم</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={60}
              className={inputClass}
              placeholder="مثال: عبدالله"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">النوع</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'male', label: 'ذكر', emoji: '👨' },
                { value: 'female', label: 'أنثى', emoji: '👩' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition',
                    gender === opt.value
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/50',
                  )}
                  aria-pressed={gender === opt.value}
                >
                  <span aria-hidden>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">اختر صورتك</label>
            <div className="grid grid-cols-6 gap-2.5">
              {PRESET_AVATARS.map((avatar) => {
                const selected = avatarUrl === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    title={avatar.label}
                    onClick={() => setAvatarUrl(avatar.url)}
                    aria-pressed={selected}
                    className={cn(
                      'aspect-square rounded-xl border-2 bg-cover bg-center transition',
                      selected
                        ? 'border-primary ring-2 ring-primary/40 scale-105'
                        : 'border-transparent opacity-80 hover:opacity-100',
                    )}
                    style={{ backgroundImage: `url("${avatar.url}")` }}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          dir="ltr"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={inputClass}
          dir="ltr"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </p>
      )}

      <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading || oauthLoading}>
        {loading ? 'جارٍ التنفيذ…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
      </Button>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>أو</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading || oauthLoading}
      >
        {oauthLoading ? 'جارٍ فتح Google…' : 'المتابعة بواسطة Google'}
      </Button>
    </form>
  );
}
