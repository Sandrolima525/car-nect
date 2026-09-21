-- Harden platform administration RPCs: they are privileged and must never be callable anonymously.
revoke execute on function public.admin_create_company(text,text,text,text,text,text,text,text) from public;
revoke execute on function public.admin_link_user_to_company(text,uuid,text) from public;
revoke execute on function public.admin_list_companies() from public;
revoke execute on function public.admin_list_company_users(uuid) from public;
revoke execute on function public.admin_set_company_active(uuid,boolean) from public;
revoke execute on function public.admin_unlink_user(uuid) from public;
revoke execute on function public.admin_update_company(uuid,text,text,text,text,text,text,text,boolean) from public;

grant execute on function public.admin_create_company(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.admin_link_user_to_company(text,uuid,text) to authenticated;
grant execute on function public.admin_list_companies() to authenticated;
grant execute on function public.admin_list_company_users(uuid) to authenticated;
grant execute on function public.admin_set_company_active(uuid,boolean) to authenticated;
grant execute on function public.admin_unlink_user(uuid) to authenticated;
grant execute on function public.admin_update_company(uuid,text,text,text,text,text,text,text,boolean) to authenticated;

revoke execute on function public.get_current_company_id() from public;
grant execute on function public.get_current_company_id() to authenticated;

revoke execute on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;
