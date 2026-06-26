'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { updateProfile, type ProfileInput } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { PRESET_AVATARS } from '@/lib/avatars';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-xl border-2 border-border bg-background/60 px-4 py-3 outline-none transition focus:border-primary';

export function ProfileSettingsForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [handle, setHandle] = useState(initial.handle);
  const [bio, setBio] = useState(initial.bio);
  const [gender, setGender] = useState<'male' | 'female' | null>(initial.gender);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile({ displayName, handle, bio, gender, avatarUrl });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? 'تعذّر الحفظ');
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">الصورة الرمزية</label>
        <div className="grid grid-cols-6 gap-2.5">
          {PRESET_AVATARS.map((avatar) => {
            const selected = avatarUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                title={avatar.label}
                onClick={() => {
                  setAvatarUrl(avatar.url);
                  setSaved(false);
                }}
                aria-pressed={selected}
                className={cn(
                  'aspect-square rounded-xl border-2 bg-cover bg-center transition',
                  selected ? 'scale-105 border-primary ring-2 ring-primary/40' : 'border-transparent opacity-80 hover:opacity-100',
                )}
                style={{ backgroundImage: `url("${avatar.url}")` }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">الاسم</label>
        <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }} maxLength={60} className={inputClass} />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">المعرّف (يظهر في رابط ملفك)</label>
        <input
          value={handle}
          onChange={(e) => { setHandle(e.target.value); setSaved(false); }}
          maxLength={30}
          dir="ltr"
          className={inputClass}
          placeholder="username"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">نبذة</label>
        <textarea value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false); }} maxLength={280} rows={2} className={cn(inputClass, 'resize-y')} placeholder="عرّف بنفسك باختصار" />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">النوع</label>
        <div className="grid grid-cols-2 gap-3">
          {([{ value: 'male', label: 'ذكر', emoji: '👨' }, { value: 'female', label: 'أنثى', emoji: '👩' }] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setGender(opt.value); setSaved(false); }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-semibold transition',
                gender === opt.value ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-background/40 text-muted-foreground hover:border-primary/50',
              )}
              aria-pressed={gender === opt.value}
            >
              <span aria-hidden>{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button variant="gradient" size="lg" onClick={save} disabled={pending}>
          {pending ? 'يحفظ…' : 'حفظ التغييرات'}
        </Button>
        {saved && <span className="text-sm text-success">تم الحفظ ✓</span>}
      </div>
    </div>
  );
}
