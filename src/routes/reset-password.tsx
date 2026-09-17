import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — LavaPro Gestão" },
      { name: "description", content: "Defina uma nova senha de acesso ao painel LavaPro." },
      { property: "og:title", content: "Nova senha — LavaPro Gestão" },
      { property: "og:description", content: "Defina uma nova senha de acesso ao painel LavaPro." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-foreground">Definir nova senha</h1>
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {done && <p className="text-sm text-primary">Senha atualizada! Redirecionando...</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
