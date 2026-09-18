create or replace function public.create_company_for_current_user(
  _name text,
  _trade_name text default null,
  _document text default null,
  _phone text default null,
  _email text default null,
  _city text default null,
  _state text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile public.profiles;
  _company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into _profile from public.profiles where user_id = auth.uid();
  if _profile is null then
    raise exception 'profile not found';
  end if;
  if _profile.company_id is not null then
    raise exception 'user already linked to a company';
  end if;
  if coalesce(btrim(_name), '') = '' then
    raise exception 'company name is required';
  end if;

  insert into public.companies (name, trade_name, document, phone, email, city, state)
  values (btrim(_name), nullif(btrim(coalesce(_trade_name,'')),''), nullif(btrim(coalesce(_document,'')),''),
          nullif(btrim(coalesce(_phone,'')),''), nullif(btrim(coalesce(_email,'')),''),
          nullif(btrim(coalesce(_city,'')),''), nullif(btrim(coalesce(_state,'')),''))
  returning id into _company_id;

  update public.profiles
     set company_id = _company_id,
         role = 'owner',
         active = true
   where user_id = auth.uid();

  return _company_id;
end;
$$;

revoke all on function public.create_company_for_current_user(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_company_for_current_user(text,text,text,text,text,text,text) to authenticated;