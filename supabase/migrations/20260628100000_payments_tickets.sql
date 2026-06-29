-- ============================================================================
-- 20260628100000_payments_tickets
-- Paid games: each game can have a price; a player buys a "ticket" (one-time
-- purchase that grants permanent access to play that game). Payments are
-- processed by Tap (https://tap.company) and recorded here. Tickets are only
-- ever minted server-side after a charge is verified — never by the client.
-- ============================================================================

-- Pricing on the game itself. price_cents = 0 means the game is free.
alter table public.games
  add column price_cents integer not null default 0 check (price_cents >= 0),
  add column currency    text    not null default 'SAR' check (char_length(currency) = 3);

-- Lifecycle of a payment attempt.
do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- One row per checkout attempt. provider_charge_id is Tap's charge id (chg_...).
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  game_id            uuid not null references public.games (id) on delete cascade,
  provider           text not null default 'tap',
  provider_charge_id text unique,
  amount_cents       integer not null check (amount_cents >= 0),
  currency           text not null default 'SAR' check (char_length(currency) = 3),
  status             public.payment_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index payments_user_idx   on public.payments (user_id, created_at desc);
create index payments_game_idx   on public.payments (game_id);
create index payments_charge_idx on public.payments (provider_charge_id);
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- A ticket = the right to play a specific game. One active ticket per
-- (user, game); buying again is a no-op.
create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  game_id     uuid not null references public.games (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (user_id, game_id)
);
create index tickets_user_idx on public.tickets (user_id);
create index tickets_game_idx on public.tickets (game_id);

-- True if the given user may play the game without paying (again):
-- the game is free, they already own a ticket, they created it, or they are a
-- moderator/admin. SECURITY DEFINER so it can read past RLS without recursion.
create or replace function public.user_has_ticket(gid uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.games g
    where g.id = gid
      and (
        g.price_cents = 0
        or g.creator_id = uid
        or public.is_moderator()
        or exists (select 1 from public.tickets t where t.game_id = gid and t.user_id = uid)
      )
  );
$$;

-- Mint a ticket after a verified payment. Idempotent: a second call for the
-- same (user, game) does nothing. Restricted to the service role (the webhook /
-- callback runs with the service key); regular users can never call it.
create or replace function public.grant_ticket(p_user uuid, p_game uuid, p_payment uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'grant_ticket: forbidden';
  end if;
  insert into public.tickets (user_id, game_id, payment_id)
  values (p_user, p_game, p_payment)
  on conflict (user_id, game_id) do nothing;
end;
$$;

revoke all on function public.grant_ticket(uuid, uuid, uuid) from public, anon, authenticated;

-- Row Level Security -------------------------------------------------------
alter table public.payments enable row level security;
alter table public.tickets  enable row level security;

-- Users can read their own payments / tickets. Writes happen only via the
-- service-role key (no insert/update policy for normal roles), so the client
-- can never forge a paid status or a ticket.
create policy "payments_select_own" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());

create policy "tickets_select_own" on public.tickets
  for select using (user_id = auth.uid() or public.is_admin());
