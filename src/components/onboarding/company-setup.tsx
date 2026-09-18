import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function CompanySetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const args: { _name: string } & Record<string, string> = { _name: name };
    if (tradeName) args["_trade_name"] = tradeName;
    if (document) args["_document"] = document;
    if (phone) args["_phone"] = phone;
    if (user?.email) args["_email"] = user.email;
    if (city) args["_city"] = city;
    if (state) args["_state"] = state;

    const { error: rpcError } = await supabase.rpc("create_company_for_current_user", args);

    setLoading(false);

    if (rpcError) {
      setError("Não foi possível cadastrar a empresa. Revise os dados e tente novamente.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["session-context"] });
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-xl font-semibold text-foreground">Cadastre sua empresa</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sua conta ainda não está vinculada a nenhuma empresa. Preencha os dados abaixo para começar
        a usar o sistema como proprietário.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="company-name">Razão social *</Label>
          <Input
            id="company-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-trade">Nome fantasia</Label>
            <Input
              id="company-trade"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-document">CNPJ / CPF</Label>
            <Input
              id="company-document"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Telefone</Label>
            <Input id="company-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-city">Cidade</Label>
            <Input id="company-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-state">Estado</Label>
            <Input
              id="company-state"
              maxLength={2}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Salvando..." : "Cadastrar empresa"}
        </Button>
      </form>
    </div>
  );
}
