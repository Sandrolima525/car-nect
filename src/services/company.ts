import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase.rpc("get_current_company_id");
  if (error) throw new Error("Não foi possível identificar a empresa do usuário.");
  if (!data) throw new Error("Empresa não encontrada para este usuário.");

  return data as string;
}

export async function enterCompanyAsMaster(companyId: string) {
  const { data, error } = await supabase.rpc("set_platform_admin_company_context", {
    _company_id: companyId,
  });
  if (error) throw error;
  return data as string;
}

export async function exitCompanyAsMaster() {
  const { error } = await supabase.rpc("clear_platform_admin_company_context");
  if (error) throw error;
}