alter table public.companies
  add column if not exists brand_colors jsonb not null default '{"primary":"#0ea5e9","secondary":"#0f172a","accent":"#e0f2fe"}'::jsonb;

comment on column public.companies.brand_colors is 'Tenant brand palette: primary, secondary and accent hex colors used by the app and public booking page.';