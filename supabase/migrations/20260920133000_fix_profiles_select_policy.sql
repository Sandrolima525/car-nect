-- Allow each authenticated user to read their own profile without
-- evaluating a company-membership function against the profiles table.
-- This prevents the company lookup used by the Clients page from being
-- blocked by the profiles RLS policy.
drop policy if exists profiles_company_select on public.profiles;

create policy profiles_self_select
on public.profiles
for select
to authenticated
using (user_id = (select auth.uid()));
