
-- Platform admins (master panel)
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

CREATE POLICY "Platform admins read own row" ON public.platform_admins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.platform_admins (user_id, email)
SELECT id, email FROM auth.users WHERE lower(email) = 'sandrolima525@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Raw company of the signed in user (ignores suspension) used for UI messaging
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.user_company_id() FROM public;
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;

-- Suspended companies lose all data access
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.company_id
  FROM public.profiles p
  JOIN public.companies c ON c.id = p.company_id
  WHERE p.user_id = auth.uid() AND p.active AND c.active
  LIMIT 1;
$$;

-- Company row stays readable to its members so the app can show the suspended notice
DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.user_company_id() OR public.is_platform_admin());

CREATE POLICY companies_platform_admin_all ON public.companies
  FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- ---------- Master panel RPCs ----------
CREATE OR REPLACE FUNCTION public.admin_list_companies()
RETURNS TABLE (
  id uuid, name text, trade_name text, document text, phone text, email text,
  city text, state text, active boolean, public_booking_slug text,
  public_booking_enabled boolean, created_at timestamptz,
  users_count bigint, customers_count bigint, appointments_count bigint, owner_email text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY
  SELECT c.id, c.name, c.trade_name, c.document, c.phone, c.email, c.city, c.state,
         c.active, c.public_booking_slug, c.public_booking_enabled, c.created_at,
         (SELECT count(*) FROM public.profiles p WHERE p.company_id = c.id),
         (SELECT count(*) FROM public.customers cu WHERE cu.company_id = c.id),
         (SELECT count(*) FROM public.appointments a WHERE a.company_id = c.id),
         (SELECT p2.email FROM public.profiles p2 WHERE p2.company_id = c.id AND p2.role = 'owner' ORDER BY p2.created_at LIMIT 1)
  FROM public.companies c
  ORDER BY c.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_companies() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_companies() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_company(
  _name text, _trade_name text DEFAULT NULL, _document text DEFAULT NULL,
  _phone text DEFAULT NULL, _email text DEFAULT NULL, _city text DEFAULT NULL,
  _state text DEFAULT NULL, _owner_email text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _company_id uuid; _user_id uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _name IS NULL OR btrim(_name) = '' THEN RAISE EXCEPTION 'Informe o nome da empresa'; END IF;

  INSERT INTO public.companies (name, trade_name, document, phone, email, city, state, active)
  VALUES (btrim(_name), nullif(btrim(coalesce(_trade_name,'')),''), nullif(btrim(coalesce(_document,'')),''),
          nullif(btrim(coalesce(_phone,'')),''), nullif(btrim(coalesce(_email,'')),''),
          nullif(btrim(coalesce(_city,'')),''), nullif(btrim(coalesce(_state,'')),''), true)
  RETURNING id INTO _company_id;

  IF _owner_email IS NOT NULL AND btrim(_owner_email) <> '' THEN
    SELECT u.id INTO _user_id FROM auth.users u WHERE lower(u.email) = lower(btrim(_owner_email)) LIMIT 1;
    IF _user_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma conta encontrada com o e-mail %. Peça para a pessoa criar a conta primeiro.', _owner_email;
    END IF;
    UPDATE public.profiles SET company_id = _company_id, role = 'owner', active = true, updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN _company_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_company(text,text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_company(text,text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_company(
  _company_id uuid, _name text, _trade_name text DEFAULT NULL, _document text DEFAULT NULL,
  _phone text DEFAULT NULL, _email text DEFAULT NULL, _city text DEFAULT NULL,
  _state text DEFAULT NULL, _public_booking_enabled boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _name IS NULL OR btrim(_name) = '' THEN RAISE EXCEPTION 'Informe o nome da empresa'; END IF;
  UPDATE public.companies SET
    name = btrim(_name),
    trade_name = nullif(btrim(coalesce(_trade_name,'')),''),
    document = nullif(btrim(coalesce(_document,'')),''),
    phone = nullif(btrim(coalesce(_phone,'')),''),
    email = nullif(btrim(coalesce(_email,'')),''),
    city = nullif(btrim(coalesce(_city,'')),''),
    state = nullif(btrim(coalesce(_state,'')),''),
    public_booking_enabled = coalesce(_public_booking_enabled, public_booking_enabled),
    updated_at = now()
  WHERE id = _company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_company(uuid,text,text,text,text,text,text,text,boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_company(uuid,text,text,text,text,text,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_company_active(_company_id uuid, _active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  UPDATE public.companies SET active = _active, updated_at = now() WHERE id = _company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_company_active(uuid,boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_company_active(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_company_users(_company_id uuid)
RETURNS TABLE (profile_id uuid, user_id uuid, full_name text, email text, role app_role, active boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY
  SELECT p.id, p.user_id, p.full_name, p.email, p.role, p.active, p.created_at
  FROM public.profiles p WHERE p.company_id = _company_id ORDER BY p.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_company_users(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_company_users(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_link_user_to_company(_email text, _company_id uuid, _role app_role DEFAULT 'owner')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT u.id INTO _user_id FROM auth.users u WHERE lower(u.email) = lower(btrim(_email)) LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma conta encontrada com o e-mail %. Peça para a pessoa criar a conta primeiro.', _email;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id) THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;
  UPDATE public.profiles SET company_id = _company_id, role = _role, active = true, updated_at = now()
  WHERE user_id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_link_user_to_company(text,uuid,app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_link_user_to_company(text,uuid,app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unlink_user(_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  UPDATE public.profiles SET company_id = NULL, role = 'employee', updated_at = now() WHERE id = _profile_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_unlink_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_unlink_user(uuid) TO authenticated;
