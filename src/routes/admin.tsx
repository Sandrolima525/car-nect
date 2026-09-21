import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Company = {
  id: string;
  name: string;
  trade_name: string | null;
  document: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  public_booking_slug: string | null;
  public_booking_enabled: boolean;
  owner_email: string | null;
  customers_count: number;
  appointments_count: number;
};

type CompanyUser = {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  active: boolean;
  created_at: string;
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
  const [selected, setSelected] = useState<Company | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [form, setForm] = useState({
    name: "", trade_name: "", document: "", phone: "", email: "", city: "", state: "",
    public_booking_enabled: true,
  });

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("admin_list_companies");
    if (rpcError) setError(rpcError.message);
    else setCompanies((data ?? []) as Company[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function openCompany(company: Company) {
    setError("");
    setSelected(company);
    setForm({
      name: company.name ?? "",
      trade_name: company.trade_name ?? "",
      document: company.document ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      city: company.city ?? "",
      state: company.state ?? "",
      public_booking_enabled: company.public_booking_enabled ?? true,
    });
    setUsers([]);
    setLoadingUsers(true);
    const { data, error: rpcError } = await supabase.rpc("admin_list_company_users", {
      _company_id: company.id,
    });
    if (rpcError) setError(rpcError.message);
    else setUsers((data ?? []) as CompanyUser[]);
    setLoadingUsers(false);
  }

  async function saveCompany() {
    if (!selected || !form.name.trim()) return;
    setSaving(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_update_company", {
      _company_id: selected.id,
      _name: form.name.trim(),
      _trade_name: form.trade_name.trim() || null,
      _document: form.document.trim() || null,
      _phone: form.phone.trim() || null,
      _email: form.email.trim() || null,
      _city: form.city.trim() || null,
      _state: form.state.trim().toUpperCase() || null,
      _public_booking_enabled: form.public_booking_enabled,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      const updated: Company = {
        ...selected,
        name: form.name.trim(),
        trade_name: form.trade_name.trim() || null,
        document: form.document.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        public_booking_enabled: form.public_booking_enabled,
      };
      setSelected(updated);
      setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    }
    setSaving(false);
  }

  async function toggle(company: Company) {
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_set_company_active", {
      _company_id: company.id,
      _active: !company.active,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const active = !company.active;
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, active } : c));
    if (selected?.id === company.id) setSelected(prev => prev ? { ...prev, active } : prev);
  }

  async function unlinkUser(user: CompanyUser) {
    if (!confirm("Remover o acesso deste usuário à empresa?")) return;
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_unlink_user", {
      _profile_id: user.profile_id,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (selected) {
      const { data } = await supabase.rpc("admin_list_company_users", {
        _company_id: selected.id,
      });
      setUsers((data ?? []) as CompanyUser[]);
    }
    await load();
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
          <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Agendamentos</p><p className="mt-1 text-3xl font-bold">{companies.reduce((n, c) => n + Number(c.appointments_count || 0), 0)}</p></div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <Input placeholder="Buscar empresa, responsável ou cidade..." value={search} onChange={e => setSearch(e.target.value)} />
          {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {loading ? <p className="py-10 text-center text-muted-foreground">Carregando empresas...</p> :
            filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">Nenhuma empresa encontrada.</p> :
            <div className="mt-5 space-y-3">
              {filtered.map(c => (
                <button key={c.id} type="button" onClick={() => { void openCompany(c); }}
                  className="w-full rounded-lg border p-4 text-left transition hover:bg-muted/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{c.trade_name || c.name}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${c.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativa" : "Bloqueada"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.owner_email || "Sem responsável"}{c.city ? ` · ${c.city}/${c.state || ""}` : ""}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.customers_count || 0} clientes · {c.appointments_count || 0} agendamentos</p>
                    </div>
                    <span className="text-sm font-medium text-primary">Gerenciar →</span>
                  </div>
                </button>
              ))}
            </div>
          }
        </section>

        {selected && (
          <section className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 backdrop-blur-sm md:p-8">
            <div className="mx-auto max-w-3xl rounded-xl border bg-card p-5 shadow-xl md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Empresa</p>
                  <h2 className="text-2xl font-bold">{selected.trade_name || selected.name}</h2>
                  <p className="text-sm text-muted-foreground">Gerenciamento da empresa</p>
                </div>
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nome da empresa" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                <Input placeholder="Nome fantasia" value={form.trade_name} onChange={e => setForm({...form, trade_name:e.target.value})} />
                <Input placeholder="CNPJ" value={form.document} onChange={e => setForm({...form, document:e.target.value})} />
                <Input placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
                <Input placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
                <Input placeholder="Cidade" value={form.city} onChange={e => setForm({...form, city:e.target.value})} />
                <Input placeholder="UF" maxLength={2} value={form.state} onChange={e => setForm({...form, state:e.target.value})} />
              </div>

              <div className="mt-6 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Página pública de agendamento</p>
                    <p className="text-xs text-muted-foreground">Permite agendamentos pela página pública.</p>
                  </div>
                  <Button type="button" variant={form.public_booking_enabled ? "default" : "outline"}
                    onClick={() => setForm({...form, public_booking_enabled: !form.public_booking_enabled})}>
                    {form.public_booking_enabled ? "Ativada" : "Desativada"}
                  </Button>
                </div>
                {selected.public_booking_slug && (
                  <p className="mt-3 break-all text-xs text-muted-foreground">Slug: /agendar/{selected.public_booking_slug}</p>
                )}
              </div>

              <div className="mt-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Status da empresa</p>
                    <p className="text-xs text-muted-foreground">{selected.active ? "Empresa ativa." : "Empresa bloqueada."}</p>
                  </div>
                  <Button variant={selected.active ? "outline" : "default"} onClick={() => { void toggle(selected); }}>
                    {selected.active ? "Bloquear empresa" : "Ativar empresa"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-4">
                <p className="font-medium">Usuários com acesso</p>
                {loadingUsers ? <p className="mt-3 text-sm text-muted-foreground">Carregando usuários...</p> :
                  users.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum usuário vinculado.</p> :
                  <div className="mt-3 space-y-2">
                    {users.map(u => (
                      <div key={u.profile_id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{u.full_name || u.email || "Usuário"}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email || "Sem e-mail"} · {u.role || "sem função"}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { void unlinkUser(u); }}>Remover</Button>
                      </div>
                    ))}
                  </div>
                }
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Clientes</p><p className="text-xl font-bold">{selected.customers_count || 0}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Agendamentos</p><p className="text-xl font-bold">{selected.appointments_count || 0}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Responsável</p><p className="truncate text-sm font-medium">{selected.owner_email || "—"}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-medium">{selected.active ? "Ativa" : "Bloqueada"}</p></div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t pt-5">
                <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                <Button disabled={saving || !form.name.trim()} onClick={() => { void saveCompany(); }}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
