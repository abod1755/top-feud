-- ============================================================================
-- 20260626093000_profile_gender_avatar
-- Adds gender to profiles and teaches the signup trigger to persist the
-- gender and chosen avatar passed in the user's auth metadata.
-- ============================================================================

do $$ begin
  create type public.gender as enum ('male', 'female');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists gender public.gender;

-- Recreate the new-user trigger function so it also captures gender + avatar.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_handle text;
  candidate   text;
  suffix      text;
  meta_gender text;
begin
  base_handle := nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), '');
  base_handle := coalesce(base_handle, 'user');
  base_handle := left(base_handle, 24);
  if char_length(base_handle) < 3 then
    base_handle := base_handle || 'usr';
  end if;

  candidate := base_handle;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := substr(md5(random()::text), 1, 4);
    candidate := left(base_handle, 20) || '_' || suffix;
  end loop;

  meta_gender := new.raw_user_meta_data->>'gender';

  insert into public.profiles (id, handle, display_name, avatar_url, gender)
  values (
    new.id,
    candidate,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    case when meta_gender in ('male', 'female') then meta_gender::public.gender else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
