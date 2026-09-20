import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId() {
  let { data: sessionData } = await supabase.auth.getSession();
  let userId = sessionData.session?.user.id;

  if (!userId) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    ({ data: sessionData } = await supabase.auth.getSession());
    userId = sessionData.session?.user.id;
  }

  if (!userId) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData.user?.id;
  }

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
