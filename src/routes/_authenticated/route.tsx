import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: companyId } = await supabase.rpc("get_current_company_id");
    if (companyId) {
      const { data: company } = await supabase.from("companies").select("id,active,access_expires_at").eq("id", companyId).maybeSingle();
      if (company && (!company.active || (company.access_expires_at && new Date(company.access_expires_at).getTime() <= Date.now()))) {
        throw redirect({ to: "/acesso-expirado" });
      }
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthProvider>
  );
}
