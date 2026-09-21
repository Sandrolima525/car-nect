import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Car-Nect" },
      {
        name: "description",
        content: "Acesse o painel de gestão do seu lava-jato ou centro de estética automotiva.",
      },
      { property: "og:title", content: "Entrar — Car-Nect" },
      {
        property: "og:description",
        content: "Acesse o painel de gestão do seu lava-jato ou centro de estética automotiva.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "recover">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: isAdmin } = await supabase.rpc("is_platform_admin");
      navigate({ to: isAdmin === true ? "/admin" : "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "recover") {
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (recoverError) setError(recoverError.message);
      else setMessage("Enviamos um link de redefinição para o seu e-mail.");
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "Já existe uma conta com este e-mail."
            : signUpError.message,
        );
        return;
      }
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setMode("login");
      setMessage("Conta criada. Confirme o e-mail enviado e depois faça login.");
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    // Some browser/storage configurations can report an auth error even after
    // Supabase has established the session. Trust the session when it exists.
    const { data: sessionData } = await supabase.auth.getSession();
    const user = signInData.user ?? sessionData.session?.user ?? null;

    if (!user) {
      setLoading(false);
      setError(signInError?.message || "Não foi possível entrar. Verifique o e-mail e a senha.");
      return;
    }

    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    setLoading(false);
    navigate({ to: isAdmin === true ? "/admin" : "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Car-Nect</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Gestão para lava-jatos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre com sua conta da empresa"
              : mode === "signup"
                ? "Crie sua conta para começar"
                : "Recupere o acesso à sua conta"}
          </p>
        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Seu nome</Label>
              <Input
                id="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== "recover" && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar link"}
          </Button>

          <div className="space-y-1">
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setMessage(null);
              }}
            >
              {mode === "login" ? "Criar uma conta nova" : "Já tenho conta, entrar"}
            </button>
            {mode !== "recover" && (
              <button
                type="button"
                className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("recover");
                  setError(null);
                  setMessage(null);
                }}
              >
                Esqueci minha senha
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao criar a conta você poderá cadastrar sua empresa no primeiro acesso.
        </p>
      </div>
    </div>
  );
}
