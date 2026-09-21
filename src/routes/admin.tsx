import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Company = {
  id: string; name: string; trade_name: string | null; city: string | null;
  state: string | null; active: boolean; owner_email: string | null;
  customers_count: number; appointments_count: number;
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    if (isAdmin !== true) throw redirect({ to: "/dashboard" });
  },
  component: MasterPage,
});

function MasterPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const { data, error } = await supabase.rpc("admin_list_companies");
    if (error) setError(error.message);
    else setCompanies((data ?? []) as Company[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function toggle(company: Company) {
    const { error } = await supabase.rpc("admin_set_company_active", {
      _company_id: company.id, _active: !company.active,
    });
    if (error) setError(error.message); else void load();
  }

  const filtered = companies.filter(c =>
    [c.name, c.trade_name, c.owner_email, c.city].filter(Boolean)
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Car-Nect</p>
            <h1 className="mt-1 text-3xl font-bold">Painel Master</h1>
            <p className="text-sm text-muted-foreground">Gerencie todas as empresas da plataforma.</p>
          </div>
          <Button variant="outline" onClick={() => { void supabase.auth.signOut(); location.href = "/auth"; }}>
            Sair
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Empresas</p><p className="mt-1 text-3xl font-bold">{companies.length}</p></div>
          <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Ativas</p><p className="mt-1 text-3xl font-bold">{companies.filter(c => c.active).length}</p></div>
          <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Agendamentos</p><p className="mt-1 text-3xl font-bold">{companies.reduce((n,c) => n + Number(c.appointments_count || 0), 0)}</p></div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <Input placeholder="Buscar empresa, responsável ou cidade..." value={search} onChange={e => setSearch(e.target.value)} />
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {loading ? <p className="py-10 text-center text-muted-foreground">Carregando empresas...</p> :
            filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">Nenhuma empresa encontrada.</p> :
            <div className="mt-5 space-y-3">
              {filtered.map(c => (
                <div key={c.id} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{c.trade_name || c.name}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${c.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativa" : "Bloqueada"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.owner_email || "Sem responsável"}{c.city ? ` · ${c.city}/${c.state || ""}` : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.customers_count || 0} clientes · {c.appointments_count || 0} agendamentos</p>
                  </div>
                  <Button variant="outline" onClick={() => { void toggle(c); }}>{c.active ? "Bloquear" : "Ativar"}</Button>
                </div>
              ))}
            </div>
          }
        </section>
      </div>
    </main>
  );
}
