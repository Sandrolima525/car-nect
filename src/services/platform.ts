import { supabase } from "@/integrations/supabase/client";

export type AdminCompany = {
  id: string;
  name: string;
  trade_name: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  public_booking_slug: string | null;
  public_booking_enabled: boolean;
  created_at: string;
  users_count: number;
  customers_count: number;
  appointments_count: number;
  owner_email: string | null;
};

export type AdminCompanyUser = {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  active: boolean;
  created_at: string;
};

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

function unwrap<T>(result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.from("platform_admins").select("id").limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

export async function listCompanies(): Promise<AdminCompany[]> {
  return unwrap<AdminCompany[]>(await rpc("admin_list_companies")) ?? [];
}

export async function listCompanyUsers(companyId: string): Promise<AdminCompanyUser[]> {
  return unwrap<AdminCompanyUser[]>(await rpc("admin_list_company_users", { _company_id: companyId })) ?? [];
}

export type CompanyInput = {
  name: string;
  trade_name?: string;
  document?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
};

export async function createCompany(input: CompanyInput & { owner_email?: string }): Promise<string> {
  return unwrap<string>(
    await rpc("admin_create_company", {
      _name: input.name,
      _trade_name: input.trade_name ?? null,
      _document: input.document ?? null,
      _phone: input.phone ?? null,
      _email: input.email ?? null,
      _city: input.city ?? null,
      _state: input.state ?? null,
      _owner_email: input.owner_email ?? null,
    }),
  );
}

export async function updateCompany(companyId: string, input: CompanyInput & { public_booking_enabled?: boolean }) {
  unwrap(
    await rpc("admin_update_company", {
      _company_id: companyId,
      _name: input.name,
      _trade_name: input.trade_name ?? null,
      _document: input.document ?? null,
      _phone: input.phone ?? null,
      _email: input.email ?? null,
      _city: input.city ?? null,
      _state: input.state ?? null,
      _public_booking_enabled: input.public_booking_enabled ?? null,
    }),
  );
}

export async function setCompanyActive(companyId: string, active: boolean) {
  unwrap(await rpc("admin_set_company_active", { _company_id: companyId, _active: active }));
}

export async function linkUserToCompany(email: string, companyId: string, role: string) {
  unwrap(await rpc("admin_link_user_to_company", { _email: email, _company_id: companyId, _role: role }));
}

export async function unlinkUser(profileId: string) {
  unwrap(await rpc("admin_unlink_user", { _profile_id: profileId }));
}
