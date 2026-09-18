-- Rebuilt LavaPro operational flow: status lifecycle and secure walk-in creation.
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status = any (array['pending','confirmed','completed','delivered','cancelled']));

create or replace function public.create_walk_in_appointment(
  _company_id uuid,_name text,_phone text,_service_ids uuid[],_date date,_time time,_vehicle_category text,
  _vehicle_plate text default null,_vehicle_brand text default null,_vehicle_model text default null,_notes text default null
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_profile_company uuid; v_customer_id uuid; v_vehicle_id uuid; v_appointment_id uuid;
v_capacity integer; v_total_price numeric(12,2); v_total_duration integer; v_business jsonb; v_day_key text; v_open text; v_close text;
v_start timestamp; v_end timestamp; v_conflicts integer;
begin
 if v_uid is null then raise exception 'Usuário não autenticado'; end if;
 select p.company_id into v_profile_company from public.profiles p where p.user_id=v_uid and p.company_id=_company_id and p.active=true limit 1;
 if v_profile_company is null then raise exception 'Acesso negado'; end if;
 if nullif(trim(_name),'') is null or length(regexp_replace(coalesce(_phone,''),'[^0-9]','','g'))<8 then raise exception 'Nome e WhatsApp são obrigatórios'; end if;
 if coalesce(array_length(_service_ids,1),0)=0 then raise exception 'Selecione ao menos um serviço'; end if;
 if _vehicle_category not in ('Hatch','Sedan','SUV/Picape') then raise exception 'Categoria de veículo inválida'; end if;
 select c.business_hours,greatest(1,coalesce(c.simultaneous_capacity,1)) into v_business,v_capacity from public.companies c where c.id=_company_id and c.active=true;
 if v_business is null then raise exception 'Empresa não encontrada'; end if;
 v_day_key:=case extract(dow from _date)::int when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed' when 4 then 'thu' when 5 then 'fri' else 'sat' end;
 v_open:=v_business->v_day_key->>'open'; v_close:=v_business->v_day_key->>'close';
 if coalesce((v_business->v_day_key->>'enabled')::boolean,false)=false or v_open is null or v_close is null then raise exception 'Empresa fechada neste dia'; end if;
 if _time<v_open::time or _time>=v_close::time then raise exception 'Horário fora do funcionamento'; end if;
 if _date<current_date or (_date=current_date and _time<localtime) then raise exception 'Horário já passou'; end if;
 select coalesce(sum(s.price),0),coalesce(sum(s.estimated_duration),0) into v_total_price,v_total_duration
 from public.services s where s.company_id=_company_id and s.active=true and s.id=any(_service_ids) and (s.vehicle_category='all' or s.vehicle_category=_vehicle_category);
 if (select count(*) from public.services s where s.company_id=_company_id and s.active=true and s.id=any(_service_ids) and (s.vehicle_category='all' or s.vehicle_category=_vehicle_category))<>array_length(_service_ids,1) then raise exception 'Serviço incompatível ou indisponível'; end if;
 if v_total_duration<=0 then raise exception 'Serviço sem duração configurada'; end if;
 v_start:=_date+_time; v_end:=v_start+make_interval(mins=>v_total_duration);
 perform pg_advisory_xact_lock(hashtextextended(_company_id::text||_date::text,0));
 if exists(select 1 from public.booking_blocks b where b.company_id=_company_id and b.block_date=_date and b.start_time<(_time+make_interval(mins=>v_total_duration)) and b.end_time>_time) then raise exception 'Esse horário está bloqueado'; end if;
 select count(*) into v_conflicts from public.appointments a where a.company_id=_company_id and a.appointment_date=_date and a.status not in ('cancelled','delivered')
 and (a.appointment_date+a.appointment_time)<v_end and (a.appointment_date+a.appointment_time+make_interval(mins=>greatest(1,a.total_duration)))>v_start;
 if v_conflicts>=v_capacity then raise exception 'Não há vaga disponível nesse horário'; end if;
 select c.id into v_customer_id from public.customers c where c.company_id=_company_id and regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')=regexp_replace(_phone,'[^0-9]','','g') order by c.created_at desc limit 1;
 if v_customer_id is null then insert into public.customers(company_id,name,phone,notes) values(_company_id,trim(_name),trim(_phone),nullif(trim(_notes),'')) returning id into v_customer_id;
 else update public.customers set name=trim(_name),phone=trim(_phone),updated_at=now(),notes=coalesce(nullif(trim(_notes),''),notes) where id=v_customer_id; end if;
 if nullif(trim(_vehicle_plate),'') is not null then select v.id into v_vehicle_id from public.vehicles v where v.company_id=_company_id and upper(v.plate)=upper(trim(_vehicle_plate)) order by v.created_at desc limit 1; end if;
 if v_vehicle_id is null then insert into public.vehicles(company_id,customer_id,plate,brand,model,category) values(_company_id,v_customer_id,nullif(upper(trim(_vehicle_plate)),''),nullif(trim(_vehicle_brand),''),nullif(trim(_vehicle_model),''),_vehicle_category) returning id into v_vehicle_id;
 else update public.vehicles set customer_id=v_customer_id,brand=coalesce(nullif(trim(_vehicle_brand),''),brand),model=coalesce(nullif(trim(_vehicle_model),''),model),category=_vehicle_category,updated_at=now() where id=v_vehicle_id; end if;
 insert into public.appointments(company_id,customer_id,vehicle_id,service_id,customer_name,customer_phone,vehicle_plate,appointment_date,appointment_time,notes,status,source,total_price,total_duration,check_in_at,created_at,updated_at)
 values(_company_id,v_customer_id,v_vehicle_id,_service_ids[1],trim(_name),trim(_phone),nullif(upper(trim(_vehicle_plate)),''),_date,_time,nullif(trim(_notes),''),'pending','presencial',v_total_price,v_total_duration,now(),now(),now()) returning id into v_appointment_id;
 insert into public.appointment_services(appointment_id,service_id,price,duration_minutes) select v_appointment_id,s.id,s.price,s.estimated_duration from public.services s where s.id=any(_service_ids);
 return v_appointment_id;
end;
$$;
grant execute on function public.create_walk_in_appointment(uuid,text,text,uuid[],date,time,text,text,text,text,text) to authenticated;
