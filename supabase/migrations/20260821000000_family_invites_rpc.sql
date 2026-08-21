create or replace function public.create_family_with_invite(family_name text, invite_code text, expires_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_family text;
  actor uuid := (select auth.uid());
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  insert into public.gezinnen (naam) values (trim(family_name)) returning id into new_family;
  insert into public.gezin_leden (gezin_id, user_id, rol) values (new_family, actor, 'eigenaar');
  insert into public.gezin_uitnodigingen (gezin_id, code, aangemaakt_door, vervalt_op)
    values (new_family, upper(trim(invite_code)), actor, expires_at);
  return jsonb_build_object('gezin_id', new_family, 'code', upper(trim(invite_code)));
end;
$$;

revoke execute on function public.create_family_with_invite(text, text, timestamptz) from public;
grant execute on function public.create_family_with_invite(text, text, timestamptz) to authenticated;
revoke execute on function public.create_family_with_invite(text, text, timestamptz) from anon;

create or replace function public.join_family_with_code(invite_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.gezin_uitnodigingen%rowtype;
  actor uuid := (select auth.uid());
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into invite from public.gezin_uitnodigingen
    where code = upper(trim(invite_code)) and vervalt_op > now() and gebruikt_op is null
    for update;
  if not found then raise exception 'invalid_or_expired_code'; end if;
  insert into public.gezin_leden(gezin_id, user_id, rol)
    values (invite.gezin_id, actor, 'lid') on conflict do nothing;
  update public.gezin_uitnodigingen set gebruikt_op = now(), gebruikt_door = actor where id = invite.id;
  return invite.gezin_id;
end;
$$;

revoke execute on function public.join_family_with_code(text) from public;
grant execute on function public.join_family_with_code(text) to authenticated;
revoke execute on function public.join_family_with_code(text) from anon;
