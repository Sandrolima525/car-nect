-- Simplified booking engine: service duration-aware availability and atomic public booking.
-- Applied directly to the Supabase project; this file keeps the schema reproducible.

create or replace function public.get_public_available_slots(
  _slug text, _date date, _service_id uuid
)
returns table(slot time)
language plpgsql
security definer
set search_path = ''
as $$
declare
  _company_id uuid; _duration integer; _slot time; _end time; _conflict boolean;
begin
  select c.id into _company_id from public.companies c
  where c.public_booking_slug = btrim(_slug) and c.public_booking_enabled = true and c.active = true limit 1;
  if _company_id is null then raise exception 'booking page not found'; end if;

  select coalesce(s.estimated_duration, 60) into _duration from public.services s
  where s.id = _service_id and s.company_id = _company_id and s.active = true;
  if _duration is null then raise exception 'service not available'; end if;

  for _slot in select gs::time from generate_series(_date + time '08:00', _date + time '17:30', interval '15 minutes') gs loop
    _end := _slot + make_interval(mins => _duration);
    if _end > time '18:00' then continue; end if;
    select exists(
      select 1 from public.appointments a left join public.services s on s.id = a.service_id
      where a.company_id = _company_id and a.appointment_date = _date and a.status <> 'cancelled'
        and _slot < a.appointment_time + make_interval(mins => coalesce(s.estimated_duration, 60))
        and _end > a.appointment_time
    ) into _conflict;
    if not _conflict then slot := _slot; return next; end if;
  end loop;
end;
$$;

revoke all on function public.get_public_available_slots(text,date,uuid) from public;
grant execute on function public.get_public_available_slots(text,date,uuid) to anon, authenticated;

-- create_public_booking is security-definer because anonymous customers must be able to
-- create their customer/vehicle/appointment records. It validates the public slug,
-- active service, business hours and overlapping appointments, and serializes bookings per company/day.
create or replace function public.create_public_booking(
  _slug text, _name text, _phone text, _service_id uuid, _date date, _time time,
  _vehicle_plate text default null, _vehicle_brand text default null, _vehicle_model text default null, _notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _company_id uuid; _customer_id uuid; _vehicle_id uuid; _appointment_id uuid;
  _phone_digits text; _plate text; _duration integer; _conflict boolean;
begin
  select c.id into _company_id from public.companies c
  where c.public_booking_slug = btrim(_slug) and c.public_booking_enabled = true and c.active = true limit 1;
  if _company_id is null then raise exception 'booking page not found'; end if;
  if coalesce(btrim(_name), '') = '' or coalesce(btrim(_phone), '') = '' or _service_id is null or _date is null or _time is null then raise exception 'missing required booking data'; end if;
  if _date < current_date then raise exception 'invalid booking date'; end if;

  perform pg_advisory_xact_lock(hashtext(_company_id::text || ':' || _date::text));

  select coalesce(s.estimated_duration, 60) into _duration from public.services s
  where s.id = _service_id and s.company_id = _company_id and s.active = true;
  if _duration is null then raise exception 'service not available'; end if;
  if _time < time '08:00' or _time >= time '18:00' or _time + make_interval(mins => _duration) > time '18:00' then raise exception 'time outside business hours'; end if;

  select exists(
    select 1 from public.appointments a left join public.services s on s.id = a.service_id
    where a.company_id = _company_id and a.appointment_date = _date and a.status <> 'cancelled'
      and _time < a.appointment_time + make_interval(mins => coalesce(s.estimated_duration, 60))
      and _time + make_interval(mins => _duration) > a.appointment_time
  ) into _conflict;
  if _conflict then raise exception 'selected time is no longer available'; end if;

  _phone_digits := regexp_replace(_phone, '[^0-9]', '', 'g');
  select c.id into _customer_id from public.customers c
  where c.company_id = _company_id and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = _phone_digits
  order by c.created_at limit 1;

  if _customer_id is null then
    insert into public.customers (company_id, name, phone) values (_company_id, btrim(_name), btrim(_phone)) returning id into _customer_id;
  else
    update public.customers set name = btrim(_name), phone = btrim(_phone), updated_at = now() where id = _customer_id;
  end if;

  _plate := nullif(upper(regexp_replace(coalesce(_vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')), '');
  if _plate is not null then
    select v.id into _vehicle_id from public.vehicles v
    where v.company_id = _company_id and v.customer_id = _customer_id
      and upper(regexp_replace(coalesce(v.plate, ''), '[^A-Za-z0-9]', '', 'g')) = _plate limit 1;
    if _vehicle_id is null then
      insert into public.vehicles (company_id, customer_id, plate, brand, model)
      values (_company_id, _customer_id, _plate, nullif(btrim(coalesce(_vehicle_brand,'')), ''), nullif(btrim(coalesce(_vehicle_model,'')), ''))
      returning id into _vehicle_id;
    end if;
  end if;

  insert into public.appointments (company_id, customer_id, vehicle_id, service_id, customer_name, customer_phone, vehicle_plate, appointment_date, appointment_time, notes, status)
  values (_company_id, _customer_id, _vehicle_id, _service_id, btrim(_name), btrim(_phone), _plate, _date, _time, nullif(btrim(coalesce(_notes,'')), ''), 'pending')
  returning id into _appointment_id;
  return _appointment_id;
end;
$$;

revoke all on function public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) from public;
revoke all on function public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) from authenticated;
grant execute on function public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) to anon;
