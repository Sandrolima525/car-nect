-- Keep legacy workshop membership from bypassing the SaaS company boundary.
DROP POLICY IF EXISTS "vehicles_member_access" ON public.vehicles;

-- Validate company ownership of every cross-table relationship, even when a client
-- accidentally or maliciously submits an ID belonging to another company.
CREATE OR REPLACE FUNCTION public.enforce_same_company_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  related_company uuid;
BEGIN
  IF TG_TABLE_NAME = 'vehicles' THEN
    IF NEW.customer_id IS NOT NULL THEN
      SELECT c.company_id INTO related_company FROM public.customers c WHERE c.id = NEW.customer_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O cliente pertence a outra empresa.'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    IF NEW.customer_id IS NOT NULL THEN
      SELECT c.company_id INTO related_company FROM public.customers c WHERE c.id = NEW.customer_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O cliente do agendamento pertence a outra empresa.'; END IF;
    END IF;
    IF NEW.vehicle_id IS NOT NULL THEN
      SELECT v.company_id INTO related_company FROM public.vehicles v WHERE v.id = NEW.vehicle_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O veículo do agendamento pertence a outra empresa.'; END IF;
    END IF;
    IF NEW.service_id IS NOT NULL THEN
      SELECT s.company_id INTO related_company FROM public.services s WHERE s.id = NEW.service_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O serviço do agendamento pertence a outra empresa.'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'appointment_services' THEN
    SELECT a.company_id INTO related_company FROM public.appointments a WHERE a.id = NEW.appointment_id;
    IF related_company IS NULL THEN RAISE EXCEPTION 'Agendamento não encontrado.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.services s WHERE s.id = NEW.service_id AND s.company_id = related_company) THEN
      RAISE EXCEPTION 'O serviço pertence a outra empresa.';
    END IF;
  ELSIF TG_TABLE_NAME = 'service_orders' THEN
    IF NEW.customer_id IS NOT NULL THEN
      SELECT c.company_id INTO related_company FROM public.customers c WHERE c.id = NEW.customer_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O cliente da ordem de serviço pertence a outra empresa.'; END IF;
    END IF;
    IF NEW.vehicle_id IS NOT NULL THEN
      SELECT v.company_id INTO related_company FROM public.vehicles v WHERE v.id = NEW.vehicle_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O veículo da ordem de serviço pertence a outra empresa.'; END IF;
    END IF;
    IF NEW.employee_id IS NOT NULL THEN
      SELECT e.company_id INTO related_company FROM public.employees e WHERE e.id = NEW.employee_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O funcionário pertence a outra empresa.'; END IF;
    END IF;
    IF NEW.appointment_id IS NOT NULL THEN
      SELECT a.company_id INTO related_company FROM public.appointments a WHERE a.id = NEW.appointment_id;
      IF related_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'O agendamento pertence a outra empresa.'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'service_order_items' THEN
    SELECT so.company_id INTO related_company FROM public.service_orders so WHERE so.id = NEW.service_order_id;
    IF related_company IS NULL THEN RAISE EXCEPTION 'Ordem de serviço não encontrada.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.services s WHERE s.id = NEW.service_id AND s.company_id = related_company) THEN
      RAISE EXCEPTION 'O serviço pertence a outra empresa.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vehicle_company_relationships ON public.vehicles;
CREATE TRIGGER enforce_vehicle_company_relationships
BEFORE INSERT OR UPDATE OF company_id, customer_id ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.enforce_same_company_relationships();

DROP TRIGGER IF EXISTS enforce_appointment_company_relationships ON public.appointments;
CREATE TRIGGER enforce_appointment_company_relationships
BEFORE INSERT OR UPDATE OF company_id, customer_id, vehicle_id, service_id ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.enforce_same_company_relationships();

DROP TRIGGER IF EXISTS enforce_appointment_services_company_relationships ON public.appointment_services;
CREATE TRIGGER enforce_appointment_services_company_relationships
BEFORE INSERT OR UPDATE OF appointment_id, service_id ON public.appointment_services
FOR EACH ROW EXECUTE FUNCTION public.enforce_same_company_relationships();

DROP TRIGGER IF EXISTS enforce_service_order_company_relationships ON public.service_orders;
CREATE TRIGGER enforce_service_order_company_relationships
BEFORE INSERT OR UPDATE OF company_id, customer_id, vehicle_id, employee_id, appointment_id ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_same_company_relationships();

DROP TRIGGER IF EXISTS enforce_service_order_items_company_relationships ON public.service_order_items;
CREATE TRIGGER enforce_service_order_items_company_relationships
BEFORE INSERT OR UPDATE OF service_order_id, service_id ON public.service_order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_same_company_relationships();
