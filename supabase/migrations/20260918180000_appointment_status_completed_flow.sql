-- Keep the four operational stages used by the rebuilt admin:
-- pending = Aguardando, confirmed = Em lavagem, completed = Pronto,
-- delivered = Concluído. Cancelled remains available for cancellations.
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status = any (array['pending','confirmed','completed','delivered','cancelled']));
