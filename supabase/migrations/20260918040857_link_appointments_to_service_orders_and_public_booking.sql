ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS appointment_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_orders_appointment_id_fkey'
  ) THEN
    ALTER TABLE public.service_orders
      ADD CONSTRAINT service_orders_appointment_id_fkey
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS service_orders_appointment_id_key
  ON public.service_orders (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS appointments_company_date_idx
  ON public.appointments (company_id, appointment_date, appointment_time);

CREATE OR REPLACE FUNCTION public.create_public_booking(
  _slug text, _name text, _phone text, _service_id uuid, _date date, _time time,
  _vehicle_plate text DEFAULT NULL, _vehicle_brand text DEFAULT NULL, _vehicle_model text DEFAULT NULL, _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _company_id uuid; _customer_id uuid; _vehicle_id uuid; _appointment_id uuid; _phone_digits text; _plate text;
BEGIN
  IF coalesce(btrim(_slug), '') = '' OR coalesce(btrim(_name), '') = '' OR coalesce(btrim(_phone), '') = ''
     OR _service_id IS NULL OR _date IS NULL OR _time IS NULL THEN
    RAISE EXCEPTION 'missing required booking data';
  END IF;

  SELECT c.id INTO _company_id FROM public.companies c
  WHERE c.public_booking_slug = btrim(_slug) AND c.public_booking_enabled = true AND c.active = true LIMIT 1;
  IF _company_id IS NULL THEN RAISE EXCEPTION 'booking page not found'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services s WHERE s.id = _service_id AND s.company_id = _company_id AND s.active = true) THEN
    RAISE EXCEPTION 'service not available';
  END IF;

  _phone_digits := regexp_replace(_phone, '[^0-9]', '', 'g');
  SELECT c.id INTO _customer_id FROM public.customers c
  WHERE c.company_id = _company_id
    AND regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = _phone_digits
  ORDER BY c.created_at LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (company_id, name, phone) VALUES (_company_id, btrim(_name), btrim(_phone)) RETURNING id INTO _customer_id;
  ELSE
    UPDATE public.customers SET name = btrim(_name), phone = btrim(_phone), updated_at = now() WHERE id = _customer_id;
  END IF;

  _plate := nullif(upper(regexp_replace(coalesce(_vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')), '');
  IF _plate IS NOT NULL THEN
    SELECT v.id INTO _vehicle_id FROM public.vehicles v
    WHERE v.company_id = _company_id AND v.customer_id = _customer_id
      AND upper(regexp_replace(coalesce(v.plate, ''), '[^A-Za-z0-9]', '', 'g')) = _plate LIMIT 1;

    IF _vehicle_id IS NULL THEN
      INSERT INTO public.vehicles (company_id, customer_id, plate, brand, model)
      VALUES (_company_id, _customer_id, _plate, nullif(btrim(coalesce(_vehicle_brand, '')), ''), nullif(btrim(coalesce(_vehicle_model, '')), ''))
      RETURNING id INTO _vehicle_id;
    ELSE
      UPDATE public.vehicles SET brand = coalesce(nullif(btrim(coalesce(_vehicle_brand, '')), ''), brand),
        model = coalesce(nullif(btrim(coalesce(_vehicle_model, '')), ''), model), updated_at = now() WHERE id = _vehicle_id;
    END IF;
  END IF;

  INSERT INTO public.appointments (company_id, customer_id, vehicle_id, service_id, customer_name, customer_phone, vehicle_plate, appointment_date, appointment_time, notes, status)
  VALUES (_company_id, _customer_id, _vehicle_id, _service_id, btrim(_name), btrim(_phone), _plate, _date, _time, nullif(btrim(coalesce(_notes, '')), ''), 'pending')
  RETURNING id INTO _appointment_id;

  RETURN _appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text,text,text,uuid,date,time,text,text,text,text) TO anon;
GRANT SELECT ON public.appointments TO authenticated;