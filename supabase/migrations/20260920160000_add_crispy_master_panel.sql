create or replace function public.master_list_companies()
returns table (id uuid,name text,trade_name text,email text,phone text,active boolean,created_at timestamptz,owner_email text,customer_count bigint,appointment_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
 if not public.is_platform_admin() then raise exception 'Acesso negado.'; end if;
 return query select c.id,c.name,c.trade_name,c.email,c.phone,c.active,c.created_at,u.email::text,
 (select count(*) from public.customers cu where cu.company_id=c.id)::bigint,
 (select count(*) from public.appointments a where a.company_id=c.id)::bigint
 from public.companies c left join auth.users u on u.id=c.owner_id order by c.created_at desc;
end;$$;
revoke all on function public.master_list_companies() from public;
grant execute on function public.master_list_companies() to authenticated;

create or replace function public.master_update_company(p_company_id uuid,p_name text default null,p_trade_name text default null,p_email text default null,p_phone text default null,p_active boolean default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.is_platform_admin() then raise exception 'Acesso negado.'; end if;
 update public.companies set name=coalesce(nullif(trim(p_name),''),name),trade_name=case when p_trade_name is null then trade_name else nullif(trim(p_trade_name),'') end,email=case when p_email is null then email else nullif(trim(p_email),'') end,phone=case when p_phone is null then phone else nullif(trim(p_phone),'') end,active=coalesce(p_active,active),updated_at=now() where id=p_company_id;
 return found;
end;$$;
revoke all on function public.master_update_company(uuid,text,text,text,text,boolean) from public;
grant execute on function public.master_update_company(uuid,text,text,text,text,boolean) to authenticated;

create or replace function public.master_create_company_for_user(p_owner_email text,p_owner_name text,p_name text,p_trade_name text default null,p_document text default null,p_email text default null,p_phone text default null,p_city text default null,p_state text default null)
returns public.companies language plpgsql security definer set search_path=public as $$
declare v_owner_id uuid; v_company public.companies; v_slug text; v_base text; v_i integer:=1;
begin
 if not public.is_platform_admin() then raise exception 'Acesso negado.'; end if;
 select id into v_owner_id from auth.users where lower(email)=lower(trim(p_owner_email)) limit 1;
 if v_owner_id is null then raise exception 'Não existe uma conta cadastrada com este e-mail. O responsável deve criar a conta primeiro.'; end if;
 if exists(select 1 from public.profiles where user_id=v_owner_id and active=true) then raise exception 'Este usuário já está vinculado a uma empresa.'; end if;
 v_base:=lower(regexp_replace(trim(p_name),'[^a-zA-Z0-9]+','-','g')); v_base:=trim(both '-' from v_base); if v_base='' then v_base:='empresa'; end if; v_slug:=v_base;
 while exists(select 1 from public.companies where public_booking_slug=v_slug) loop v_i:=v_i+1; v_slug:=v_base||'-'||v_i; end loop;
 insert into public.companies(owner_id,name,trade_name,document,email,phone,city,state,active,public_booking_slug,public_booking_enabled) values(v_owner_id,trim(p_name),nullif(trim(p_trade_name),''),nullif(trim(p_document),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_city),''),nullif(trim(p_state),''),true,v_slug,true) returning * into v_company;
 insert into public.profiles(user_id,company_id,full_name,email,role,active) values(v_owner_id,v_company.id,nullif(trim(p_owner_name),''),lower(trim(p_owner_email)),'owner',true);
 insert into public.services(company_id,name,description,price,estimated_duration,active,vehicle_category) values
 (v_company.id,'Lavagem Simples','Lavagem externa e secagem',35,45,true,'all'),
 (v_company.id,'Lavagem Completa','Lavagem completa com acabamento',60,60,true,'all'),
 (v_company.id,'Higienização','Higienização interna',120,120,true,'all'),
 (v_company.id,'Enceramento','Enceramento e proteção da pintura',90,90,true,'all');
 return v_company;
end;$$;
revoke all on function public.master_create_company_for_user(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.master_create_company_for_user(text,text,text,text,text,text,text,text,text) to authenticated;