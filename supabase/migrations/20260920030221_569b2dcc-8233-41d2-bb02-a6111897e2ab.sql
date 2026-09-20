alter table public.companies
  add column if not exists whatsapp_number text,
  add column if not exists business_hours jsonb,
  add column if not exists booking_interval_minutes integer not null default 15,
  add column if not exists booking_min_advance_minutes integer not null default 0,
  add column if not exists simultaneous_capacity integer not null default 2,
  add column if not exists brand_colors jsonb,
  add column if not exists public_booking_slug text unique,
  add column if not exists public_booking_enabled boolean not null default true;

alter table public.services add column if not exists vehicle_category text not null default 'all';
alter table public.vehicles add column if not exists category text;
alter table public.vehicles rename column current_mileage to mileage;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  vehicle_plate text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_category text,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','delivered','cancelled')),
  source text not null default 'manual',
  total_price numeric(12,2) not null default 0,
  total_duration integer not null default 60,
  notes text,
  washing_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_company_date_idx on public.appointments(company_id, appointment_date);
create index if not exists appointments_customer_user_idx on public.appointments(customer_user_id);

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  price numeric(12,2) not null default 0,
  duration_minutes integer not null default 60,
  created_at timestamptz not null default now()
);
create index if not exists appointment_services_appointment_idx on public.appointment_services(appointment_id);

create table if not exists public.booking_blocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists booking_blocks_company_date_idx on public.booking_blocks(company_id, block_date);

grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
grant select, insert, update, delete on public.appointment_services to authenticated;
grant all on public.appointment_services to service_role;
grant select, insert, update, delete on public.booking_blocks to authenticated;
grant all on public.booking_blocks to service_role;
grant select on public.services to anon;
grant select (id, name, trade_name, phone, whatsapp_number, logo_url, brand_colors, public_booking_slug) on public.companies to anon;

alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.booking_blocks enable row level security;

create policy "Company manages appointments" on public.appointments for all to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "Customers read own appointments" on public.appointments for select to authenticated
  using (customer_user_id = auth.uid());
create policy "Company manages appointment services" on public.appointment_services for all to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "Customers read own appointment services" on public.appointment_services for select to authenticated
  using (exists (select 1 from public.appointments a where a.id = appointment_id and a.customer_user_id = auth.uid()));
create policy "Company manages booking blocks" on public.booking_blocks for all to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "Public booking companies read" on public.companies for select to anon
  using (public_booking_enabled and active);
create policy "Public active services read" on public.services for select to anon
  using (active);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create or replace function public.ensure_company_slug() returns trigger
language plpgsql set search_path = public as $$
declare _base text; _candidate text; _n int;
begin
  if new.public_booking_slug is null or btrim(new.public_booking_slug) = '' then
    _base := lower(coalesce(nullif(btrim(new.trade_name), ''), new.name));
    _base := translate(_base, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
    _base := regexp_replace(_base, '[^a-z0-9]+', '-', 'g');
    _base := trim(both '-' from _base);
    if _base = '' then _base := 'empresa'; end if;
    _candidate := _base; _n := 1;
    while exists (select 1 from public.companies where public_booking_slug = _candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
      _n := _n + 1; _candidate := _base || '-' || _n;
    end loop;
    new.public_booking_slug := _candidate;
  end if;
  return new;
end $$;

drop trigger if exists ensure_company_slug_trigger on public.companies;
create trigger ensure_company_slug_trigger before insert or update on public.companies for each row execute function public.ensure_company_slug();
update public.companies set name = name where public_booking_slug is null;

create or replace function public.get_public_available_slots_multi(_slug text, _date date, _service_ids uuid[])
returns table(slot time) language plpgsql stable security definer set search_path = public as $$
declare
  _company public.companies%rowtype; _duration int; _interval int; _capacity int; _advance int;
  _day text; _hours jsonb; _open time; _close time; _t time; _overlap int;
  _now timestamp := now() at time zone 'America/Sao_Paulo';
begin
  select * into _company from public.companies where public_booking_slug = _slug and public_booking_enabled and active;
  if not found then return; end if;
  select coalesce(sum(coalesce(s.estimated_duration, 60)), 0) into _duration from public.services s where s.id = any(_service_ids) and s.company_id = _company.id and s.active;
  if _duration <= 0 then return; end if;
  _interval := greatest(5, coalesce(_company.booking_interval_minutes, 15));
  _capacity := greatest(1, coalesce(_company.simultaneous_capacity, 2));
  _advance := greatest(0, coalesce(_company.booking_min_advance_minutes, 0));
  _day := (array['mon','tue','wed','thu','fri','sat','sun'])[extract(isodow from _date)];
  _hours := coalesce(_company.business_hours -> _day, '{"enabled":true,"open":"08:00","close":"18:00"}'::jsonb);
  if not coalesce((_hours ->> 'enabled')::boolean, true) then return; end if;
  _open := coalesce(_hours ->> 'open', '08:00')::time;
  _close := coalesce(_hours ->> 'close', '18:00')::time;
  _t := _open;
  while _t + make_interval(mins => _duration) <= _close loop
    if _date > _now::date or (_date = _now::date and _t >= (_now + make_interval(mins => _advance))::time) then
      select count(*) into _overlap from public.appointments a
        where a.company_id = _company.id and a.appointment_date = _date and a.status <> 'cancelled'
          and a.appointment_time < _t + make_interval(mins => _duration)
          and _t < a.appointment_time + make_interval(mins => coalesce(a.total_duration, 60));
      if _overlap < _capacity and not exists (
        select 1 from public.booking_blocks b where b.company_id = _company.id and b.block_date = _date
          and b.start_time < _t + make_interval(mins => _duration) and _t < b.end_time
      ) then
        slot := _t; return next;
      end if;
    end if;
    _t := _t + make_interval(mins => _interval);
  end loop;
end $$;

create or replace function public.create_public_booking_multi(_slug text, _name text, _phone text, _service_ids uuid[], _date date, _time time, _vehicle_plate text default null, _vehicle_brand text default null, _vehicle_model text default null, _notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _company public.companies%rowtype; _customer_id uuid; _appointment_id uuid;
  _duration int; _price numeric; _capacity int; _overlap int;
begin
  select * into _company from public.companies where public_booking_slug = _slug and public_booking_enabled and active;
  if not found then raise exception 'Booking page not available'; end if;
  if _name is null or btrim(_name) = '' then raise exception 'Name is required'; end if;
  select coalesce(sum(coalesce(estimated_duration, 60)), 0), coalesce(sum(price), 0) into _duration, _price
    from public.services where id = any(_service_ids) and company_id = _company.id and active;
  if _duration <= 0 then raise exception 'Services not found'; end if;
  _capacity := greatest(1, coalesce(_company.simultaneous_capacity, 2));
  select count(*) into _overlap from public.appointments a
    where a.company_id = _company.id and a.appointment_date = _date and a.status <> 'cancelled'
      and a.appointment_time < _time + make_interval(mins => _duration)
      and _time < a.appointment_time + make_interval(mins => coalesce(a.total_duration, 60));
  if _overlap >= _capacity or exists (
    select 1 from public.booking_blocks b where b.company_id = _company.id and b.block_date = _date
      and b.start_time < _time + make_interval(mins => _duration) and _time < b.end_time
  ) then raise exception 'Time slot no longer available'; end if;
  select id into _customer_id from public.customers where company_id = _company.id and phone = btrim(_phone) limit 1;
  if _customer_id is null then
    insert into public.customers (company_id, name, phone) values (_company.id, btrim(_name), btrim(_phone)) returning id into _customer_id;
  end if;
  insert into public.appointments (company_id, customer_id, customer_name, customer_phone, vehicle_plate, vehicle_brand, vehicle_model, appointment_date, appointment_time, status, source, total_price, total_duration, notes)
    values (_company.id, _customer_id, btrim(_name), btrim(_phone), nullif(btrim(_vehicle_plate), ''), nullif(btrim(_vehicle_brand), ''), nullif(btrim(_vehicle_model), ''), _date, _time, 'pending', 'online', _price, _duration, nullif(btrim(_notes), ''))
    returning id into _appointment_id;
  insert into public.appointment_services (company_id, appointment_id, service_id, price, duration_minutes)
    select _company.id, _appointment_id, s.id, s.price, coalesce(s.estimated_duration, 60) from public.services s where s.id = any(_service_ids) and s.company_id = _company.id;
  return _appointment_id;
end $$;

create or replace function public.create_walk_in_appointment(_company_id uuid, _name text, _phone text, _service_ids uuid[], _date date, _time time, _vehicle_category text default null, _vehicle_plate text default null, _vehicle_brand text default null, _vehicle_model text default null, _notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _customer_id uuid; _appointment_id uuid; _duration int; _price numeric;
begin
  if public.current_company_id() is distinct from _company_id then raise exception 'Not allowed for this company'; end if;
  if _name is null or btrim(_name) = '' then raise exception 'Name is required'; end if;
  select coalesce(sum(coalesce(estimated_duration, 60)), 0), coalesce(sum(price), 0) into _duration, _price
    from public.services where id = any(_service_ids) and company_id = _company_id and active;
  if _duration <= 0 then raise exception 'Services not found'; end if;
  select id into _customer_id from public.customers where company_id = _company_id and phone = btrim(_phone) limit 1;
  if _customer_id is null then
    insert into public.customers (company_id, name, phone) values (_company_id, btrim(_name), btrim(_phone)) returning id into _customer_id;
  end if;
  insert into public.appointments (company_id, customer_id, customer_name, customer_phone, vehicle_category, vehicle_plate, vehicle_brand, vehicle_model, appointment_date, appointment_time, status, source, total_price, total_duration, notes)
    values (_company_id, _customer_id, btrim(_name), btrim(_phone), nullif(btrim(_vehicle_category), ''), nullif(btrim(_vehicle_plate), ''), nullif(btrim(_vehicle_brand), ''), nullif(btrim(_vehicle_model), ''), _date, _time, 'pending', 'manual', _price, _duration, nullif(btrim(_notes), ''))
    returning id into _appointment_id;
  insert into public.appointment_services (company_id, appointment_id, service_id, price, duration_minutes)
    select _company_id, _appointment_id, s.id, s.price, coalesce(s.estimated_duration, 60) from public.services s where s.id = any(_service_ids) and s.company_id = _company_id;
  return _appointment_id;
end $$;

create or replace function public.manage_company_profile(_profile_id uuid, _role public.app_role, _active boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _target_company uuid; _own_profile uuid;
begin
  if not public.is_company_admin() then raise exception 'Only company admins can manage team members'; end if;
  select company_id into _target_company from public.profiles where id = _profile_id;
  if _target_company is null or _target_company is distinct from public.current_company_id() then raise exception 'Profile not found in your company'; end if;
  select id into _own_profile from public.profiles where user_id = auth.uid();
  if _own_profile = _profile_id then raise exception 'You cannot change your own access'; end if;
  update public.profiles set role = _role, active = _active, updated_at = now() where id = _profile_id;
end $$;

revoke all on function public.ensure_company_slug() from public, anon, authenticated;
revoke all on function public.get_public_available_slots_multi(text, date, uuid[]) from public;
grant execute on function public.get_public_available_slots_multi(text, date, uuid[]) to anon, authenticated;
revoke all on function public.create_public_booking_multi(text, text, text, uuid[], date, time, text, text, text, text) from public;
grant execute on function public.create_public_booking_multi(text, text, text, uuid[], date, time, text, text, text, text) to anon, authenticated;
revoke all on function public.create_walk_in_appointment(uuid, text, text, uuid[], date, time, text, text, text, text, text) from public, anon;
grant execute on function public.create_walk_in_appointment(uuid, text, text, uuid[], date, time, text, text, text, text, text) to authenticated;
revoke all on function public.manage_company_profile(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.manage_company_profile(uuid, public.app_role, boolean) to authenticated;