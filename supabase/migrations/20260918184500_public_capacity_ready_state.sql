-- Keep ready vehicles in box-capacity calculations until they are delivered.
do $$
declare v text;
begin
 select pg_get_functiondef(p.oid) into v from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='get_public_available_slots_multi' order by p.oid desc limit 1;
 if v is not null then
   v:=replace(v, 'a.status not in (''cancelled'',''completed'',''delivered'')', 'a.status not in (''cancelled'',''delivered'')');
   execute v;
 end if;
 select pg_get_functiondef(p.oid) into v from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='create_public_booking_multi' order by p.oid desc limit 1;
 if v is not null then
   v:=replace(v, 'a.status not in (''cancelled'',''completed'',''delivered'')', 'a.status not in (''cancelled'',''delivered'')');
   execute v;
 end if;
end $$;
