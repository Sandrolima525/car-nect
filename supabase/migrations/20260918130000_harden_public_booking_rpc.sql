-- Tighten public booking RPC execution: anonymous customers use the public endpoint;
-- signed-in dashboard users do not need to create public bookings through this RPC.
revoke execute on function public.create_public_booking_multi(text,text,text,uuid[],date,time,text,text,text,text) from authenticated;
grant execute on function public.create_public_booking_multi(text,text,text,uuid[],date,time,text,text,text,text) to anon;
