import { supabase } from "@/integrations/supabase/client";
import type { Company, Profile } from "@/types/database";

export type SessionContext = {
  profile: Profile | null;
  company: Company | null;
};

/**
 * Loads the authenticated user's profile and linked company.
 * RLS guarantees only the user's own profile / company is returned.
 */
export async function fetchSessionContext(userId: string): Promise<SessionContext> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return { profile: null, company: null };

  if (!profile.company_id) return { profile, company: null };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (companyError) throw companyError;

  return { profile, company: company ?? null };
}
