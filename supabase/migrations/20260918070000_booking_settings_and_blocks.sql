-- Booking configuration, blocked periods, performance indexes and public availability rules.
alter table public.companies
  add column if not exists business_hours jsonb not null default '{"mon":{"enabled":true,"open":"08:00","close":"18:00"},"tue":{"enabled":true,"open":"08:00","close":"18:00"},"wed":{"enabled":true,"open":"08:00","close":"18:00"},"thu":{"enabled":true,"open":"08:00","close":"18:00"},"fri":{"enabled":true,"open":"08:00","close":"18:00"},"sat":{"enabled":true,"open":"08:00","close":"18:00"},"sun":{"enabled":false,"open":"08:00","close":"18:00"}}'::jsonb,
  add column if not exists booking_interval_minutes integer not null default 15,
  add column if not exists booking_min_advance_minutes integer not null default 0;

create table if not exists public.booking_blocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint booking_blocks_valid_time check (end_time > start_time)
);
create index if not exists booking_blocks_company_date_idx on public.booking_blocks(company_id,block_date,start_time,end_time);
alter table public.booking_blocks enable row level security;
drop policy if exists "booking blocks company access" on public.booking_blocks;
create policy "booking blocks company access" on public.booking_blocks for all to authenticated
using (company_id=(select company_id from public.profiles where user_id=(select auth.uid()) and active=true limit 1))
with check (company_id=(select company_id from public.profiles where user_id=(select auth.uid()) and active=true limit 1));

create index if not exists appointments_company_date_time_idx on public.appointments(company_id,appointment_date,appointment_time);
create index if not exists appointments_customer_idx on public.appointments(customer_id) where customer_id is not null;
create index if not exists appointments_service_idx on public.appointments(service_id) where service_id is not null;
create index if not exists appointments_vehicle_idx on public.appointments(vehicle_id) where vehicle_id is not null;
create index if not exists companies_owner_idx on public.companies(owner_id);
create index if not exists profiles_company_idx on public.profiles(company_id);
create index if not exists customers_workshop_idx on public.customers(workshop_id) where workshop_id is not null;
create index if not exists vehicles_customer_idx on public.vehicles(customer_id) where customer_id is not null;
create index if not exists appointment_services_appointment_idx on public.appointment_services(appointment_id);
create index if not exists appointment_services_service_idx on public.appointment_services(service_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;

create or replace function public.get_public_available_slots_multi(_slug text,_date date,_service_ids uuid[]) returns table(slot time)
language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_duration integer; v_slot time; v_end time; v_open time; v_close time; v_interval integer; v_min_advance integer; v_day jsonb; v_key text; v_now timestamp;
begin
 select id,business_hours,booking_interval_minutes,booking_min_advance_minutes into v_company_id,v_day,v_interval,v_min_advance from companies where public_booking_slug=_slug and public_booking_enabled and active limit 1;
 if v_company_id is null then raise exception 'Página de agendamento não encontrada.'; end if;
 if coalesce(array_length(_service_ids,1),0)=0 then raise exception 'Selecione pelo menos um serviço.'; end if;
 if _date < (now() at time zone 'America/Sao_Paulo')::date then return; end if;
 v_key:=case extract(dow from _date)::int when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed' when 4 then 'thu' when 5 then 'fri' else 'sat' end;
 v_day:=coalesce(v_day->v_key,'{}'::jsonb); if coalesce((v_day->>'enabled')::boolean,false)=false then return; end if;
 v_open:=coalesce((v_day->>'open')::time,time '08:00'); v_close:=coalesce((v_day->>'close')::time,time '18:00'); v_interval:=greatest(coalesce(v_interval,15),5); v_min_advance:=greatest(coalesce(v_min_advance,0),0);
 select sum(coalesce(estimated_duration,60))::integer into v_duration from services where company_id=v_company_id and active and id=any(_service_ids);
 if v_duration is null or (select count(*) from services where company_id=v_company_id and active and id=any(_service_ids))<>array_length(_service_ids,1) then raise exception 'Serviço inválido.'; end if;
 v_now:=now() at time zone 'America/Sao_Paulo'; v_slot:=v_open;
 while v_slot<v_close loop
  v_end:=v_slot+make_interval(mins=>v_duration);
  if v_end<=v_close and (_date>(v_now+make_interval(mins=>v_min_advance))::date or (_date=(v_now+make_interval(mins=>v_min_advance))::date and v_slot>=(v_now+make_interval(mins=>v_min_advance))::time)) then
   if not exists(select 1 from booking_blocks b where b.company_id=v_company_id and b.block_date=_date and (b.start_time,b.end_time) overlaps(v_slot,v_end))
   and not exists(select 1 from appointments a where a.company_id=v_company_id and a.appointment_date=_date and a.status<>'cancelled' and (a.appointment_time,a.appointment_time+make_interval(mins=>coalesce((select sum(aps.duration_minutes)::integer from appointment_services aps where aps.appointment_id=a.id),60))) overlaps(v_slot,v_end)) then slot:=v_slot; return next; end if;
  end if;
  v_slot:=v_slot+make_interval(mins=>v_interval);
 end loop;
end; $$;

create or replace function public.create_public_booking_multi(_slug text,_name text,_phone text,_service_ids uuid[],_date date,_time time,_vehicle_plate text default null,_vehicle_brand text default null,_vehicle_model text default null,_notes text default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_customer_id uuid; v_vehicle_id uuid; v_appointment_id uuid; v_duration integer; v_end time; v_open time; v_close time; v_interval integer; v_min_advance integer; v_day jsonb; v_key text; v_now timestamp;
begin
 select id,business_hours,booking_interval_minutes,booking_min_advance_minutes into v_company_id,v_day,v_interval,v_min_advance from companies where public_booking_slug=_slug and public_booking_enabled and active limit 1;
 if v_company_id is null then raise exception 'Página de agendamento não encontrada.'; end if;
 if coalesce(array_length(_service_ids,1),0)=0 then raise exception 'Selecione pelo menos um serviço.'; end if;
 if _date<(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Escolha uma data futura.'; end if;
 v_key:=case extract(dow from _date)::int when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed' when 4 then 'thu' when 5 then 'fri' else 'sat' end;
 v_day:=coalesce(v_day->v_key,'{}'::jsonb); if coalesce((v_day->>'enabled')::boolean,false)=false then raise exception 'A empresa não funciona neste dia.'; end if;
 v_open:=coalesce((v_day->>'open')::time,time '08:00'); v_close:=coalesce((v_day->>'close')::time,time '18:00'); v_interval:=greatest(coalesce(v_interval,15),5); v_min_advance:=greatest(coalesce(v_min_advance,0),0);
 select sum(coalesce(estimated_duration,60))::integer into v_duration from services where company_id=v_company_id and active and id=any(_service_ids);
 if v_duration is null or (select count(*) from services where company_id=v_company_id and active and id=any(_service_ids))<>array_length(_service_ids,1) then raise exception 'Serviço inválido.'; end if;
 v_end:=_time+make_interval(mins=>v_duration); v_now:=now() at time zone 'America/Sao_Paulo';
 if _time<v_open or v_end>v_close then raise exception 'Horário fora do funcionamento.'; end if;
 if _date=v_now::date and _time<(v_now+make_interval(mins=>v_min_advance))::time then raise exception 'Escolha um horário com mais antecedência.'; end if;
 if mod(extract(epoch from (_time-v_open))::integer/60,v_interval)<>0 then raise exception 'Horário inválido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_company_id::text||_date::text,0));
 if exists(select 1 from booking_blocks b where b.company_id=v_company_id and b.block_date=_date and (b.start_time,b.end_time) overlaps(_time,v_end)) then raise exception 'Esse horário está bloqueado.'; end if;
 if exists(select 1 from appointments a where a.company_id=v_company_id and a.appointment_date=_date and a.status<>'cancelled' and (a.appointment_time,a.appointment_time+make_interval(mins=>coalesce((select sum(duration_minutes)::integer from appointment_services where appointment_id=a.id),60))) overlaps(_time,v_end)) then raise exception 'Esse horário acabou de ser ocupado.'; end if;
 select id into v_customer_id from customers where company_id=v_company_id and regexp_replace(coalesce(phone,''),'\D','','g')=regexp_replace(coalesce(_phone,''),'\D','','g') limit 1;
 if v_customer_id is null then insert into customers(company_id,name,phone) values(v_company_id,trim(_name),trim(_phone)) returning id into v_customer_id; else update customers set name=trim(_name),phone=trim(_phone),updated_at=now() where id=v_customer_id; end if;
 if nullif(trim(coalesce(_vehicle_plate,'')),'') is not null then
  select id into v_vehicle_id from vehicles where company_id=v_company_id and customer_id=v_customer_id and upper(coalesce(plate,''))=upper(trim(_vehicle_plate)) limit 1;
  if v_vehicle_id is null then insert into vehicles(company_id,customer_id,plate,brand,model) values(v_company_id,v_customer_id,upper(trim(_vehicle_plate)),nullif(trim(_vehicle_brand),''),nullif(trim(_vehicle_model),'')) returning id into v_vehicle_id;
  else update vehicles set brand=coalesce(nullif(trim(_vehicle_brand),''),brand),model=coalesce(nullif(trim(_vehicle_model),''),model) where id=v_vehicle_id; end if;
 end if;
 insert into appointments(company_id,customer_id,vehicle_id,service_id,customer_name,customer_phone,vehicle_plate,appointment_date,appointment_time,notes,status) values(v_company_id,v_customer_id,v_vehicle_id,_service_ids[1],trim(_name),trim(_phone),upper(nullif(trim(_vehicle_plate),'')),_date,_time,nullif(trim(_notes),''),'pending') returning id into v_appointment_id;
 insert into appointment_services(appointment_id,service_id,price,duration_minutes) select v_appointment_id,s.id,s.price,coalesce(s.estimated_duration,60) from services s where s.company_id=v_company_id and s.id=any(_service_ids);
 return v_appointment_id;
end; $$;

grant execute on function public.get_public_available_slots_multi(text,date,uuid[]) to anon,authenticated;
grant execute on function public.create_public_booking_multi(text,text,text,uuid[],date,time,text,text,text,text) to anon,authenticated;
