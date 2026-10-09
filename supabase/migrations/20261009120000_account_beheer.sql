-- Account- en profielbeheer
-- Idempotent: veilig om opnieuw te draaien in de Supabase SQL Editor.
--
-- Bevat:
--   1. profielen            : weergavenaam per gebruiker
--   2. deelt_gezin_met()    : helper voor RLS (security definer, voorkomt recursie op gezin_leden)
--   3. handle_new_user()    : maakt automatisch een profiel aan bij registratie
--   4. backfill             : profiel voor bestaande gebruikers
--   5. verwijder_mijn_account() : RPC waarmee een ingelogde gebruiker zichzelf verwijdert

-- ---------------------------------------------------------------------------
-- 1. Profielen
-- ---------------------------------------------------------------------------
create table if not exists public.profielen (
  user_id uuid primary key references auth.users (id) on delete cascade,
  weergavenaam text not null default '' check (char_length(weergavenaam) <= 40),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

alter table public.profielen enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Helper: deelt de ingelogde gebruiker een gezin met target_user?
-- ---------------------------------------------------------------------------
create or replace function public.deelt_gezin_met(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gezin_leden mijn
    join public.gezin_leden zijn on zijn.gezin_id = mijn.gezin_id
    where mijn.user_id = (select auth.uid())
      and zijn.user_id = target_user
  );
$$;

revoke all on function public.deelt_gezin_met(uuid) from public;
revoke all on function public.deelt_gezin_met(uuid) from anon;
grant execute on function public.deelt_gezin_met(uuid) to authenticated;

drop policy if exists "profielen_select_gezin" on public.profielen;
create policy "profielen_select_gezin" on public.profielen
  for select to authenticated
  using (user_id = (select auth.uid()) or public.deelt_gezin_met(user_id));

drop policy if exists "profielen_insert_eigen" on public.profielen;
create policy "profielen_insert_eigen" on public.profielen
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "profielen_update_eigen" on public.profielen;
create policy "profielen_update_eigen" on public.profielen
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Profiel automatisch aanmaken bij registratie
--    De naam komt uit de registratie (user_metadata.weergavenaam),
--    anders het stuk van het e-mailadres voor de @.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profielen (user_id, weergavenaam)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'weergavenaam'), ''),
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      40
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profiel on auth.users;
create trigger on_auth_user_created_profiel
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Backfill: profiel voor bestaande gebruikers
-- ---------------------------------------------------------------------------
insert into public.profielen (user_id, weergavenaam)
select
  u.id,
  left(
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'weergavenaam'), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ),
    40
  )
from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Account verwijderen
--    - Laatste lid van een gezin: het hele gezin met alle gegevens wordt verwijderd.
--    - Er zijn nog andere leden: de gegevens blijven bewaard, de registraties
--      worden toegewezen aan het langst aangesloten lid (eigenaar heeft voorrang)
--      en de eigenaarsrol gaat over als de vertrekkende gebruiker eigenaar was.
--    Alles gebeurt in één transactie: lukt iets niet, dan wordt er niets verwijderd.
-- ---------------------------------------------------------------------------
create or replace function public.verwijder_mijn_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  lidmaatschap record;
  opvolger uuid;
  tabel text;
begin
  if actor is null then raise exception 'not_authenticated'; end if;

  for lidmaatschap in
    select gl.gezin_id, gl.rol from public.gezin_leden gl where gl.user_id = actor
  loop
    opvolger := null;

    select gl.user_id into opvolger
    from public.gezin_leden gl
    where gl.gezin_id = lidmaatschap.gezin_id and gl.user_id <> actor
    order by (gl.rol = 'eigenaar') desc, gl.aangemaakt_op asc
    limit 1;

    if opvolger is null then
      -- Laatste lid: gezin en alle bijbehorende gegevens opruimen.
      for tabel in
        select c.table_name
        from information_schema.columns c
        join information_schema.tables t
          on t.table_schema = c.table_schema and t.table_name = c.table_name
        where c.table_schema = 'public'
          and c.column_name = 'gezin_id'
          and t.table_type = 'BASE TABLE'
          and c.table_name not in ('gezin_leden', 'gezin_uitnodigingen')
      loop
        execute format('delete from public.%I where gezin_id::text = $1', tabel)
          using lidmaatschap.gezin_id;
      end loop;

      delete from public.gezin_uitnodigingen where gezin_id = lidmaatschap.gezin_id;
      delete from public.gezin_leden where gezin_id = lidmaatschap.gezin_id;
      delete from public.gezinnen where id = lidmaatschap.gezin_id;
    else
      -- Er blijven leden over: gegevens behouden en overdragen.
      if lidmaatschap.rol = 'eigenaar' then
        update public.gezin_leden
          set rol = 'eigenaar'
          where gezin_id = lidmaatschap.gezin_id and user_id = opvolger;
      end if;

      for tabel in
        select c.table_name
        from information_schema.columns c
        join information_schema.columns g
          on g.table_schema = c.table_schema
         and g.table_name = c.table_name
         and g.column_name = 'gezin_id'
        join information_schema.tables t
          on t.table_schema = c.table_schema and t.table_name = c.table_name
        where c.table_schema = 'public'
          and c.column_name = 'user_id'
          and t.table_type = 'BASE TABLE'
          and c.table_name not in ('gezin_leden', 'profielen')
      loop
        execute format(
          'update public.%I set user_id = $1 where gezin_id::text = $2 and user_id = $3',
          tabel
        ) using opvolger, lidmaatschap.gezin_id, actor;
      end loop;

      update public.gezin_uitnodigingen
        set aangemaakt_door = opvolger
        where gezin_id = lidmaatschap.gezin_id and aangemaakt_door = actor;
      update public.gezin_uitnodigingen
        set gebruikt_door = null
        where gezin_id = lidmaatschap.gezin_id and gebruikt_door = actor;

      delete from public.gezin_leden
        where gezin_id = lidmaatschap.gezin_id and user_id = actor;
    end if;
  end loop;

  -- Losse persoonlijke rijen die nergens aan een gezin hangen (bijv. oude rijen
  -- zonder gezin_id) of in tabellen zonder gezin_id: ook weg.
  for tabel in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'user_id'
      and t.table_type = 'BASE TABLE'
      and c.table_name not in ('gezin_leden', 'profielen')
  loop
    if exists (
      select 1 from information_schema.columns g
      where g.table_schema = 'public' and g.table_name = tabel and g.column_name = 'gezin_id'
    ) then
      execute format('delete from public.%I where user_id = $1 and gezin_id is null', tabel)
        using actor;
    else
      execute format('delete from public.%I where user_id = $1', tabel) using actor;
    end if;
  end loop;

  -- Het account zelf. Profiel, sessies en identiteiten verdwijnen mee (on delete cascade).
  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.verwijder_mijn_account() from public;
revoke all on function public.verwijder_mijn_account() from anon;
grant execute on function public.verwijder_mijn_account() to authenticated;

notify pgrst, 'reload schema';
