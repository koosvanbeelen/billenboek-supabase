create or replace function public.create_family_with_invite(family_name text, invite_code text, expires_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_family text;
  actor uuid := (select auth.uid());
  normalized_name text := btrim(family_name);
  normalized_code text := upper(btrim(invite_code));
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if normalized_name is null or char_length(normalized_name) < 2 then raise exception 'family_name_too_short'; end if;
  if exists (select 1 from public.gezin_leden where user_id = actor) then raise exception 'already_in_family'; end if;
  insert into public.gezinnen (naam) values (normalized_name) returning id into new_family;
  insert into public.gezin_leden (gezin_id, user_id, rol) values (new_family, actor, 'eigenaar');
  insert into public.gezin_uitnodigingen (gezin_id, code, aangemaakt_door, vervalt_op) values (new_family, normalized_code, actor, expires_at);
  return jsonb_build_object('gezin_id', new_family, 'code', normalized_code);
end;
$$;

create or replace function public.join_family_with_code(invite_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.gezin_uitnodigingen%rowtype;
  actor uuid := (select auth.uid());
  normalized_code text := upper(btrim(invite_code));
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.gezin_leden where user_id = actor) then raise exception 'already_in_family'; end if;
  select * into invite from public.gezin_uitnodigingen where code = normalized_code and vervalt_op > now() for update;
  if not found then raise exception 'invalid_or_expired_code'; end if;
  insert into public.gezin_leden (gezin_id, user_id, rol) values (invite.gezin_id, actor, 'lid') on conflict do nothing;
  return invite.gezin_id;
end;
$$;

revoke all on function public.create_family_with_invite(text, text, timestamptz) from public;
grant execute on function public.create_family_with_invite(text, text, timestamptz) to authenticated;
revoke all on function public.join_family_with_code(text) from public;
grant execute on function public.join_family_with_code(text) to authenticated;

notify pgrst, 'reload schema';
