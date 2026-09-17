REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_plate() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_company_id() FROM public, anon;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_company_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated;