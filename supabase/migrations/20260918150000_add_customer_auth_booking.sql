alter table public.appointments
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists appointments_customer_user_id_idx
  on public.appointments(customer_user_id, appointment_date, appointment_time);

drop policy if exists "customer_appointments_select" on public.appointments;
create policy "customer_appointments_select"
on public.appointments for select to authenticated
using ((select auth.uid()) = customer_user_id);

drop policy if exists "customer appointment services select" on public.appointment_services;
create policy "customer appointment services select"
on public.appointment_services for select to authenticated
using (exists (select 1 from public.appointments a where a.id = appointment_services.appointment_id and a.customer_user_id = (select auth.uid())));

create or replace function public.create_public_booking_multi(
  _slug text, _name text, _phone text, _service_ids uuid[], _date date, _time time,
  _vehicle_plate text default null, _vehicle_brand text default null, _vehicle_model text default null, _notes text default null
) returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
 v_company_id uuid; v_customer_id uuid; v_vehicle_id uuid; v_appointment_id uuid; v_duration integer; v_end time; v_open time; v_close time; v_interval integer; v_min_advance integer; v_day jsonb; v_key text; v_now timestamp; v_user_id uuid;
begin
 v_user_id := (select auth.uid());
 select id,business_hours,booking_interval_minutes,booking_min_advance_minutes into v_company_id,v_day,v_interval,v_min_advance from public.companies where public_booking_slug=_slug and public_booking_enabled and active limit 1;
 if v_company_id is null then raise exception 'Página de agendamento não encontrada.'; end if;
 if coalesce(array_length(_service_ids,1),0)=0 then raise exception 'Selecione pelo menos um serviço.'; end if;
 if _date < (now() at time zone 'America/Sao_Paulo')::date then raise exception 'Escolha uma data futura.'; end if;
 v_key:=case extract(dow from _date)::int when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed' when 4 then 'thu' when 5 then 'fri' else 'sat' end;
 v_day:=coalesce(v_day->v_key,'{}'::jsonb);
 if coalesce((v_day->>'enabled')::boolean,false)=false then raise exception 'A empresa não funciona neste dia.'; end if;
 v_open:=coalesce((v_day->>'open')::time,time '08:00'); v_close:=coalesce((v_day->>'close')::time,time '18:00'); v_interval:=greatest(coalesce(v_interval,15),5); v_min_advance:=greatest(coalesce(v_min_advance,0),0);
 select sum(coalesce(estimated_duration,60))::integer into v_duration from public.services where company_id=v_company_id and active and id=any(_service_ids);
 if v_duration is null or (select count(*) from public.services where company_id=v_company_id and active and id=any(_service_ids))<>array_length(_service_ids,1) then raise exception 'Serviço inválido.'; end if;
 v_end:=_time+make_interval(mins=>v_duration); v_now:=now() at time zone 'America/Sao_Paulo';
 if _time<v_open or v_end>v_close then raise exception 'Horário fora do funcionamento.'; end if;
 if _date=v_now::date and _time<(v_now+make_interval(mins=>v_min_advance))::time then raise exception 'Escolha um horário com mais antecedência.'; end if;
 if mod((extract(epoch from (_time-v_open))/60)::integer,v_interval)<>0 then raise exception 'Horário inválido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_company_id::text||_date::text,0));
 if exists(select 1 from public.booking_blocks b where b.company_id=v_company_id and b.block_date=_date and (b.start_time,b.end_time) overlaps (_time,v_end)) then raise exception 'Esse horário está bloqueado.'; end if;
 if exists(select 1 from public.appointments a where a.company_id=v_company_id and a.appointment_date=_date and a.status<>'cancelled' and (a.appointment_time,a.appointment_time+make_interval(mins=>coalesce((select sum(duration_minutes)::integer from public.appointment_services where appointment_id=a.id),60))) overlaps (_time,v_end)) then raise exception 'Esse horário acabou de ser ocupado.'; end if;
 select id into v_customer_id from public.customers where company_id=v_company_id and regexp_replace(coalesce(phone,''),'\\D','','g')=regexp_replace(coalesce(_phone,''),'\\D','','g') limit 1;
 if v_customer_id is null then insert into public.customers(company_id,name,phone) values(v_company_id,trim(_name),trim(_phone)) returning id into v_customer_id; else update public.customers set name=trim(_name),phone=trim(_phone),updated_at=now() where id=v_customer_id; end if;
 if nullif(trim(coalesce(_vehicle_plate,'')),'') is not null then
   select id into v_vehicle_id from public.vehicles where company_id=v_company_id and customer_id=v_customer_id and upper(coalesce(plate,''))=upper(trim(_vehicle_plate)) limit 1;
   if v_vehicle_id is null then insert into public.vehicles(company_id,customer_id,plate,brand,model) values(v_company_id,v_customer_id,upper(trim(_vehicle_plate)),nullif(trim(_vehicle_brand),''),nullif(trim(_vehicle_model),'')) returning id into v_vehicle_id;
   else update public.vehicles set brand=coalesce(nullif(trim(_vehicle_brand),''),brand),model=coalesce(nullif(trim(_vehicle_model),''),model) where id=v_vehicle_id; end if;
 end if;
 insert into public.appointments(company_id,customer_id,vehicle_id,service_id,customer_user_id,customer_name,customer_phone,vehicle_plate,appointment_date,appointment_time,notes,status)
 values(v_company_id,v_customer_id,v_vehicle_id,_service_ids[1],v_user_id,trim(_name),trim(_phone),upper(nullif(trim(_vehicle_plate),'')),_date,_time,nullif(trim(_notes),''),'pending') returning id into v_appointment_id;
 insert into public.appointment_services(appointment_id,service_id,price,duration_minutes) select v_appointment_id,s.id,s.price,coalesce(s.estimated_duration,60) from public.services s where s.company_id=v_company_id and s.id=any(_service_ids);
 return v_appointment_id;
end;
$function$;

revoke execute on function public.create_public_booking_multi(text,text,text,uuid[],date,time,text,text,text,text) from public, authenticated;
grant execute on function public.create_public_booking_multi(text,text,text,uuid[],date,time,text,text,text,text) to anon, authenticated;
