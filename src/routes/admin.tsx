import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Plus, Search, ShieldCheck, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    if (isAdmin !== true) throw redirect({ to: "/dashboard" });
  },
  component: MasterPage,
});

type Company = {
  id: string; name: string; trade_name: string | null; email: string | null; phone: string | null;
  active: boolean; created_at: string; owner_email: string | null; customer_count: number; appointment_count: number;
};

function MasterPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    const { data, error: rpcError } = await (supabase as any).rpc("master_list_companies");
    if (rpcError) setError(rpcError.message);
    else setCompanies((data ?? []) as Company[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createCompany = async () => {
    if (!name.trim() || !ownerEmail.trim()) { setError("Informe o nome da empresa e o e-mail do responsável."); return; }
    try {
      setSaving(true); setError(""); setMessage("");
      const { error: rpcError } = await (supabase as any).rpc("master_create_company_for_user", {
        p_owner_email: ownerEmail.trim(),
        p_owner_name: ownerName.trim() || name.trim(),
        p_name: name.trim(),
        p_trade_name: tradeName.trim() || null,
        p_email: email.trim() || null,
        p_phone: phone.trim() || null,
        p_city: city.trim() || null,
        p_state: state.trim() || null,
      });
      if (rpcError) throw rpcError;
      setMessage("Empresa criada e vinculada ao responsável.");
      setOpen(false);
      setOwnerEmail(""); setOwnerName(""); setName(""); setTradeName(""); setPhone(""); setEmail(""); setCity(""); setState("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar a empresa."); }
    finally { setSaving(false); }
  };

  const toggle = async (company: Company) => {
    const { error: rpcError } = await (supabase as any).rpc("master_update_company", { p_company_id: company.id, p_active: !company.active });
    if (rpcError) setError(rpcError.message); else await load();
  };

  const filtered = companies.filter(c => {
    const t = query.trim().toLowerCase();
    return !t || c.name.toLowerCase().includes(t) || (c.trade_name ?? "").toLowerCase().includes(t) || (c.owner_email ?? "").toLowerCase().includes(t);
  });
  const active = companies.filter(c => c.active).length;
  const customers = companies.reduce((n, c) => n + Number(c.customer_count ?? 0), 0);
  const appointments = companies.reduce((n, c) => n + Number(c.appointment_count ?? 0), 0);

  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><ShieldCheck className="h-4 w-4" />Crispy · Master</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Painel Master</h1>
        <p className="text-sm text-muted-foreground">Gerencie todas as empresas que usam o Car-Nect.</p>
      </div>
      <Button onClick={() => { setError(""); setMessage(""); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova empresa</Button>
    </header>

    {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-xl bg-green-500/10 p-3 text-sm text-green-700">{message}</div>}

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label="Empresas" value={companies.length} icon={Building2} />
      <Kpi label="Ativas" value={active} icon={CheckCircle2} />
      <Kpi label="Clientes" value={customers} icon={Users} />
      <Kpi label="Agendamentos" value={appointments} icon={ShieldCheck} />
    </div>

    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar empresa ou responsável..." /></div></CardContent>
    </Card>

    <Card className="rounded-2xl border-border/60">
      <CardHeader><h2 className="font-semibold">Empresas cadastradas</h2><p className="text-sm text-muted-foreground">{filtered.length} empresa(s) encontrada(s).</p></CardHeader>
      <CardContent className="p-0">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Carregando empresas...</p> :
        filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada.</p> :
        <div className="divide-y">{filtered.map(c => <div key={c.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="truncate font-bold">{c.trade_name || c.name}</p><p className="truncate text-xs text-muted-foreground">{c.name}{c.owner_email ? " · " + c.owner_email : ""}</p><p className="mt-1 text-xs text-muted-foreground">{c.customer_count} clientes · {c.appointment_count} agendamentos</p></div>
          </div>
          <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.active ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativa" : "Bloqueada"}</span>
            <Button size="sm" variant="outline" onClick={() => void toggle(c)}>{c.active ? <><XCircle className="mr-2 h-4 w-4" />Bloquear</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Ativar</>}</Button>
          </div>
        </div>)}</div>}
      </CardContent>
    </Card>

    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl">
        <CardHeader><div className="flex items-center justify-between"><div><h2 className="font-semibold">Cadastrar nova empresa</h2><p className="text-sm text-muted-foreground">O responsável precisa ter uma conta Car-Nect criada.</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)}>×</Button></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">Primeiro, o responsável cria a conta em <strong>Entrar → Criar uma conta</strong>. Depois informe o mesmo e-mail abaixo para vinculá-lo à empresa.</div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="E-mail do responsável *" value={ownerEmail} set={setOwnerEmail} type="email" /><Field label="Nome do responsável" value={ownerName} set={setOwnerName} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome da empresa *" value={name} set={setName} /><Field label="Nome fantasia" value={tradeName} set={setTradeName} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="E-mail da empresa" value={email} set={setEmail} type="email" /><Field label="WhatsApp/telefone" value={phone} set={setPhone} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Cidade" value={city} set={setCity} /><Field label="Estado" value={state} set={setState} /></div>
          <Button className="w-full" onClick={() => void createCompany()} disabled={saving}>{saving ? "Criando..." : "Criar empresa e liberar acesso"}</Button>
        </CardContent>
      </Card>
    </div>}
  </div>;
}

function Field({ label, value, set, type = "text" }: { label: string; value: string; set: (v: string) => void; type?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={e => set(e.target.value)} /></div>;
}
function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Building2 }) {
  return <Card className="rounded-2xl border-border/60"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-black">{value}</p></CardContent></Card>;
}
