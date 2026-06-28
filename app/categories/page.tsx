import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/header';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'الفئات',
  description: 'تصفّح ألعاب لمّة حسب الفئة.',
};

export default async function CategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, name, description, color')
    .eq('is_active', true)
    .order('position');

  return (
    <main>
      <Header />
      <div className="container py-10">
        <h1 className="font-display text-4xl font-extrabold">الفئات</h1>
        <p className="mt-2 text-muted-foreground">اختر فئة لتتصفّح ألعابها.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c) => (
            <Link
              key={c.slug}
              href={`/explore?category=${c.slug}`}
              className="glass group rounded-2xl p-6 transition-transform hover:-translate-y-1"
            >
              <span
                className="block h-2 w-12 rounded-full"
                style={{ backgroundColor: c.color ?? 'hsl(var(--primary))' }}
              />
              <h2 className="mt-4 font-display text-xl font-extrabold">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
