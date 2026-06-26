-- ============================================================================
-- 20260626096000_save_game_content
-- Atomically replaces a game's rounds/questions/answers from a JSON payload
-- produced by the editor. SECURITY DEFINER + an explicit can_edit_game() check
-- so only the owner / editor collaborators / admins may save. Empty prompts and
-- answers are skipped so partial drafts save without violating CHECK rules.
-- ============================================================================

create or replace function public.save_game_content(gid uuid, content jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
  q jsonb;
  a jsonb;
  rid uuid;
  qid uuid;
  rpos int := 0;
  qpos int;
  apos int;
  prompt_txt text;
  ans_txt text;
begin
  if not public.can_edit_game(gid) then
    raise exception 'not authorized to edit game %', gid;
  end if;

  delete from public.rounds where game_id = gid; -- cascades questions + answers

  for r in select value from jsonb_array_elements(coalesce(content, '[]'::jsonb)) as t(value) loop
    rpos := rpos + 1;
    insert into public.rounds (game_id, position, title, time_limit_seconds, points_multiplier)
    values (
      gid,
      rpos,
      left(coalesce(nullif(trim(r->>'title'), ''), 'الجولة ' || rpos), 120),
      nullif(r->>'time_limit_seconds', '')::int,
      coalesce(nullif(r->>'points_multiplier', '')::int, 1)
    )
    returning id into rid;

    qpos := 0;
    for q in select value from jsonb_array_elements(coalesce(r->'questions', '[]'::jsonb)) as t(value) loop
      prompt_txt := trim(coalesce(q->>'prompt', ''));
      if prompt_txt = '' then continue; end if;
      qpos := qpos + 1;
      insert into public.questions (round_id, position, prompt, time_limit_seconds)
      values (rid, qpos, left(prompt_txt, 300), nullif(q->>'time_limit_seconds', '')::int)
      returning id into qid;

      apos := 0;
      for a in select value from jsonb_array_elements(coalesce(q->'answers', '[]'::jsonb)) as t(value) loop
        ans_txt := trim(coalesce(a->>'text', ''));
        if ans_txt = '' then continue; end if;
        apos := apos + 1;
        insert into public.answers (question_id, position, text, points)
        values (qid, apos, left(ans_txt, 120), least(greatest(coalesce(nullif(a->>'points', '')::int, 0), 0), 100));
      end loop;
    end loop;
  end loop;
end;
$$;

grant execute on function public.save_game_content(uuid, jsonb) to authenticated;
