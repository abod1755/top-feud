'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

type Role = 'player' | 'creator' | 'moderator' | 'admin';

/** Verifies the caller is an admin and returns an elevated client + actor id. */
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') return null;
  return { actorId: user.id, admin };
}

async function audit(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  await admin
    .from('audit_logs')
    .insert({ actor_id: actorId, action, target_type: targetType, target_id: targetId, metadata: metadata as Json });
}

export async function setUserRole(userId: string, role: Role) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const { error } = await ctx.admin.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'set_user_role', 'profile', userId, { role });
  revalidatePath('/admin');
  return { ok: true as const };
}

export async function toggleVerify(userId: string, verified: boolean) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const { error } = await ctx.admin.from('profiles').update({ is_verified: verified }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'set_verified', 'profile', userId, { verified });
  revalidatePath('/admin');
  return { ok: true as const };
}

export async function setFeatured(gameId: string, featured: boolean) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const { error } = await ctx.admin
    .from('games')
    .update({ is_featured: featured, featured_at: featured ? new Date().toISOString() : null })
    .eq('id', gameId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'set_featured', 'game', gameId, { featured });
  revalidatePath('/admin');
  revalidatePath('/explore');
  return { ok: true as const };
}

export async function adminSetPublished(gameId: string, published: boolean) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const status = published ? 'published' : 'draft';
  const { error } = await ctx.admin.from('games').update({ status }).eq('id', gameId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'set_game_status', 'game', gameId, { status });
  revalidatePath('/admin');
  revalidatePath('/explore');
  return { ok: true as const };
}

export async function adminDeleteGame(gameId: string) {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const { error } = await ctx.admin.from('games').delete().eq('id', gameId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'delete_game', 'game', gameId);
  revalidatePath('/admin');
  revalidatePath('/explore');
  return { ok: true as const };
}

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: 'غير مصرّح' };
  const { error } = await ctx.admin
    .from('reports')
    .update({ status, resolved_by: ctx.actorId, resolved_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) return { ok: false, error: error.message };
  await audit(ctx.admin, ctx.actorId, 'resolve_report', 'report', reportId, { status });
  revalidatePath('/admin');
  return { ok: true as const };
}
