import Link from 'next/link';
import { ShoppingBag, type LucideIcon } from 'lucide-react';

import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface NavLink {
  href: string;
  label: string;
  Icon?: LucideIcon;
}

const NAV_LINKS: NavLink[] = [
  { href: '/store', label: 'المتجر', Icon: ShoppingBag },
  { href: '/explore', label: 'اكتشف' },
  { href: '/categories', label: 'الفئات' },
  { href: '/leaderboard', label: 'لوحة الصدارة' },
  { href: '/dashboard', label: 'لوحتي' },
];

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.user_metadata?.display_name as string | undefined;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', user.id)
      .maybeSingle();

    displayName = profile?.display_name ?? displayName ?? user.email?.split('@')[0] ?? 'لاعب';
    isAdmin = profile?.role === 'admin';
  }

  const navLinks: NavLink[] = isAdmin
    ? [...NAV_LINKS, { href: '/admin/sales', label: 'المبيعات' }]
    : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary font-display text-xl font-extrabold text-primary-foreground">
            ل
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <strong className="font-display text-lg">{BRAND.name}</strong>
            <span className="mt-1 text-xs text-muted-foreground">{BRAND.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>
                {link.Icon && <link.Icon className="size-4" />}
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">{displayName}</Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  خروج
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">دخول</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link href="/register">ابدأ مجانًا</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
