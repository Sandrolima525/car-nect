-- Master support mode: lets a platform administrator select one company
-- and use the normal application with that company's RLS context.
create table if not exists public.platform_admin_company_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.platform_admin_company_context enable row level security;
revoke all on public.platform_admin_company_context from anon, authenticated;

create or replace function public.set_platform_admin_company_context(_company_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception 'Acesso negado'; end if;
  if not exists (select 1 from public.companies where id = _company_id) then raise exception 'Empresa não encontrada'; end if;
  insert into public.platform_admin_company_context(user_id, company_id, updated_at)
  values (auth.uid(), _company_id, now())
  on conflict (user_id) do update set company_id = excluded.company_id, updated_at = now();
  return _company_id;
end;
$$;

create or replace function public.clear_platform_admin_company_context()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception 'Acesso negado'; end if;
  delete from public.platform_admin_company_context where user_id = auth.uid();
end;
$$;

create or replace function public.get_current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select c.company_id
       from public.platform_admin_company_context c
      where c.user_id = auth.uid()
        and public.is_platform_admin()),
    (select p.company_id
       from public.profiles p
      where p.user_id = auth.uid()
        and p.active = true
      limit 1)
  );
$$;

revoke all on function public.set_platform_admin_company_context(uuid) from public;
grant execute on function public.set_platform_admin_company_context(uuid) to authenticated;
revoke all on function public.clear_platform_admin_company_context() from public;
grant execute on function public.clear_platform_admin_company_context() to authenticated;
revoke all on function public.get_current_company_id() from public;
grant execute on function public.get_current_company_id() to authenticated;
