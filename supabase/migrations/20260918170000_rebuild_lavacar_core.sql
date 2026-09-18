alter table public.companies
  add column if not exists simultaneous_capacity integer not null default 2;

alter table public.services
  add column if not exists vehicle_category text not null default 'all';

alter table public.vehicles
  add column if not exists category text not null default 'Hatch';

alter table public.appointments
  add column if not exists source text not null default 'online',
  add column if not exists check_in_at timestamptz,
  add column if not exists washing_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists total_price numeric(12,2) not null default 0,
  add column if not exists total_duration integer not null default 0;

create index if not exists appointments_company_date_status_idx on public.appointments(company_id, appointment_date, status);
create index if not exists appointments_company_date_time_idx on public.appointments(company_id, appointment_date, appointment_time);
create index if not exists services_company_active_idx on public.services(company_id, active);

update public.companies set simultaneous_capacity = 2 where simultaneous_capacity < 1;
update public.services set vehicle_category = 'all' where vehicle_category is null or vehicle_category = '';
update public.vehicles set category = 'Hatch' where category is null or category = '';