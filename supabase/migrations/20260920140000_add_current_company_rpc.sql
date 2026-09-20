create or replace function public.get_current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.company_id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and p.active = true
  limit 1;
$$;

revoke all on function public.get_current_company_id() from public;
grant execute on function public.get_current_company_id() to authenticated;
