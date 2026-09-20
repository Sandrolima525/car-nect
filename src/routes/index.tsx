import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const role = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    throw redirect({ to: role.data?.role === "admin" ? "/admin" : "/dashboard" });
  },
  component: () => null,
});
