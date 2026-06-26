-- ============================================================================
-- 20260626095000_increment_play_count
-- Lets any player bump a published game's play_count without granting them
-- UPDATE on games. SECURITY DEFINER bypasses RLS for this single safe action.
-- ============================================================================

create or replace function public.increment_play_count(gid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.games
  set play_count = play_count + 1
  where id = gid and status = 'published';
$$;

grant execute on function public.increment_play_count(uuid) to anon, authenticated;
