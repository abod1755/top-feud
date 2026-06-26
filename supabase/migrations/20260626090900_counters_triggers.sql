-- ============================================================================
-- 20260626090900_counters_triggers
-- Denormalized counters kept consistent by triggers. All functions are
-- SECURITY DEFINER so they can update aggregate columns on parent tables that
-- the acting user cannot write directly under RLS.
-- ============================================================================

-- Followers -> profiles.followers_count / following_count --------------------
create or replace function public.tg_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  end if;
  return null;
end; $$;
create trigger followers_counts after insert or delete on public.followers
  for each row execute function public.tg_follow_counts();

-- Favorites -> games.favorites_count ----------------------------------------
create or replace function public.tg_favorites_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.games set favorites_count = favorites_count + 1 where id = new.game_id;
  elsif (tg_op = 'DELETE') then
    update public.games set favorites_count = greatest(favorites_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end; $$;
create trigger favorites_count after insert or delete on public.game_favorites
  for each row execute function public.tg_favorites_count();

-- Ratings -> games.rating_avg / rating_count --------------------------------
create or replace function public.tg_recompute_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  gid := coalesce(new.game_id, old.game_id);
  update public.games g set
    rating_count = sub.cnt,
    rating_avg   = coalesce(sub.avg, 0)
  from (
    select count(*)::int as cnt, round(avg(rating)::numeric, 2) as avg
    from public.game_ratings where game_id = gid
  ) sub
  where g.id = gid;
  return null;
end; $$;
create trigger ratings_recompute after insert or update or delete on public.game_ratings
  for each row execute function public.tg_recompute_rating();

-- Comments -> games.comments_count ------------------------------------------
create or replace function public.tg_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.games set comments_count = comments_count + 1 where id = new.game_id;
  elsif (tg_op = 'DELETE') then
    update public.games set comments_count = greatest(comments_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end; $$;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.tg_comments_count();

-- Game tags -> tags.usage_count ---------------------------------------------
create or replace function public.tg_tag_usage()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.tags set usage_count = usage_count + 1 where id = new.tag_id;
  elsif (tg_op = 'DELETE') then
    update public.tags set usage_count = greatest(usage_count - 1, 0) where id = old.tag_id;
  end if;
  return null;
end; $$;
create trigger tag_usage after insert or delete on public.game_tags
  for each row execute function public.tg_tag_usage();

-- Rounds -> games.rounds_count ----------------------------------------------
create or replace function public.tg_rounds_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.games set rounds_count = rounds_count + 1 where id = new.game_id;
  elsif (tg_op = 'DELETE') then
    update public.games set rounds_count = greatest(rounds_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end; $$;
create trigger rounds_count after insert or delete on public.rounds
  for each row execute function public.tg_rounds_count();

-- Questions -> games.questions_count (via round) ----------------------------
create or replace function public.tg_questions_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if (tg_op = 'INSERT') then
    select game_id into gid from public.rounds where id = new.round_id;
    update public.games set questions_count = questions_count + 1 where id = gid;
  elsif (tg_op = 'DELETE') then
    select game_id into gid from public.rounds where id = old.round_id;
    update public.games set questions_count = greatest(questions_count - 1, 0) where id = gid;
  end if;
  return null;
end; $$;
create trigger questions_count after insert or delete on public.questions
  for each row execute function public.tg_questions_count();

-- Games -> profiles.games_count (published games per creator) ---------------
create or replace function public.tg_games_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    if new.status = 'published' then
      update public.profiles set games_count = games_count + 1 where id = new.creator_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.status = 'published' then
      update public.profiles set games_count = greatest(games_count - 1, 0) where id = old.creator_id;
    end if;
  elsif (tg_op = 'UPDATE') then
    if new.status = 'published' and old.status <> 'published' then
      update public.profiles set games_count = games_count + 1 where id = new.creator_id;
    elsif old.status = 'published' and new.status <> 'published' then
      update public.profiles set games_count = greatest(games_count - 1, 0) where id = old.creator_id;
    end if;
  end if;
  return null;
end; $$;
create trigger games_count after insert or update or delete on public.games
  for each row execute function public.tg_games_count();

-- Stamp published_at the first time a game becomes published ----------------
create or replace function public.tg_set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end; $$;
create trigger games_published_at before insert or update on public.games
  for each row execute function public.tg_set_published_at();
