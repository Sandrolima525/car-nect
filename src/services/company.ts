import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase.rpc("get_current_company_id");

  if (error) {
    throw new Error("Não foi possível identificar a empresa do usuário.");
  }

  if (!data) {
    throw new Error("Empresa não encontrada para este usuário.");
  }

  return data as string;
}
