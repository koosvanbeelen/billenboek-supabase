create or replace function public.is_gezin_lid(target_gezin_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gezin_leden gl
    where gl.gezin_id = target_gezin_id
      and gl.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_gezin_lid(text) from public;
grant execute on function public.is_gezin_lid(text) to authenticated;
