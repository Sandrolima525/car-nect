import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId() {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.company_id) throw new Error("Empresa não encontrada para este usuário.");

  return data.company_id as string;
}
