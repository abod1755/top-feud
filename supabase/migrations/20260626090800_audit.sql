-- ============================================================================
-- 20260626090800_audit
-- Tamper-evident audit trail for admin and security-sensitive actions.
-- ============================================================================

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null check (char_length(action) between 1 and 100),
  target_type text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index audit_logs_actor_idx  on public.audit_logs (actor_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id);

alter table public.audit_logs enable row level security;

-- Only moderators/admins may read the audit trail. Inserts are restricted to
-- the acting user recording their own action or a moderator; rows are
-- append-only (no update/delete policy => those operations are denied).
create policy "audit_select_mod" on public.audit_logs
  for select using (public.is_moderator());
create policy "audit_insert" on public.audit_logs
  for insert with check (auth.uid() = actor_id or public.is_moderator());
