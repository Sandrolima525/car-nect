import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { fetchSessionContext } from "@/services/profile";
import type { Company, Profile } from "@/types/database";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ["session-context", userId],
    queryFn: () => fetchSessionContext(userId!),
    enabled: Boolean(userId),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile: data?.profile ?? null,
        company: data?.company ?? null,
        loading: !ready || (Boolean(userId) && isLoading),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
