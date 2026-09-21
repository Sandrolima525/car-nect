import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, Car, MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/clientes")({ component: ClientsPage });

type Customer = { id: string; name: string; phone: string | null; email: string | null; notes: string | null; created_at: string };
type Vehicle = { id: string; plate: string | null; brand: string | null; model: string | null; category: string };
type Visit = { id: string; appointment_date: string; appointment_time: string; status: string; total_price: number; vehicle_plate: string | null; services: string[]; source: string };

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ClientsPage() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const result = await supabase.from("customers").select("id,name,phone,email,notes,created_at").eq("company_id", id).order("name");
      if (result.error) throw result.error;
      setCustomers((result.data ?? []) as Customer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const normalized = term.replace(/\D/g, "");
    return customers.filter((customer) => !term || customer.name.toLowerCase().includes(term) || (customer.phone ?? "").toLowerCase().includes(term) || (normalized && (customer.phone ?? "").replace(/\D/g, "").includes(normalized)));
  }, [customers, query]);

  const openCustomer = async (customer: Customer) => {
    try {
      setSelected(customer); setDetailLoading(true);
      const [vehiclesResult, appointmentsResult] = await Promise.all([
        supabase.from("vehicles").select("id,plate,brand,model,category").eq("company_id", companyId).eq("customer_id", customer.id).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id,appointment_date,appointment_time,status,total_price,vehicle_plate,source").eq("company_id", companyId).eq("customer_id", customer.id).order("appointment_date", { ascending: false }).order("appointment_time", { ascending: false }).limit(50),
      ]);
      if (vehiclesResult.error) throw vehiclesResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;
      const ids = (appointmentsResult.data ?? []).map((item) => item.id);
      const links = ids.length ? await (supabase as any).from("appointment_services").select("appointment_id,service:services(name)").in("appointment_id", ids) : { data: [], error: null };
      if (links.error) throw links.error;
      const serviceNames = new Map<string, string[]>();
      for (const link of links.data ?? []) serviceNames.set(link.appointment_id, [...(serviceNames.get(link.appointment_id) ?? []), link.service?.name].filter(Boolean));
      setVehicles((vehiclesResult.data ?? []) as Vehicle[]);
      setVisits((appointmentsResult.data ?? []).map((item: any) => ({ ...item, total_price: Number(item.total_price ?? 0), services: serviceNames.get(item.id) ?? [] })) as Visit[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
    } finally {
      setDetailLoading(false);
    }
  };

  const startEdit = (customer: Customer) => { setName(customer.name); setPhone(customer.phone ?? ""); setEmail(customer.email ?? ""); setNotes(customer.notes ?? ""); setEditing(true); setOpen(true); };

  const saveCustomer = async () => {
    if (!name.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Informe nome e WhatsApp válido.");
      return;
    }
    try {
      setSaving(true); setError("");
      const result = editing && selected
        ? await supabase.from("customers").update({ name: name.trim(), phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null }).eq("id", selected.id).eq("company_id", companyId)
        : await supabase.from("customers").insert({ company_id: companyId, name: name.trim(), phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null });
      if (result.error) throw result.error;
      setOpen(false); setEditing(false); setName(""); setPhone(""); setEmail(""); setNotes(""); await load();
      if (selected) setSelected((current) => current ? { ...current, name: name.trim(), phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  const schedule = (customer: Customer) => {
    localStorage.setItem("car-nect:agenda-customer", JSON.stringify({ name: customer.name, phone: customer.phone ?? "" }));
    void navigate({ to: "/agenda" });
  };

  const whatsapp = (phone: string | null, message?: string) => {
    const number = (phone ?? "").replace(/\D/g, "");
    if (number.length < 8) return;
    window.open("https://wa.me/" + (number.startsWith("55") ? number : "55" + number) + (message ? "?text=" + encodeURIComponent(message) : ""), "_blank", "noopener,noreferrer");
  };

  const spent = visits.filter((visit) => visit.status !== "cancelled").reduce((sum, visit) => sum + visit.total_price, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><UserRound className="h-4 w-4" />Relacionamento</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Clientes</h1><p className="text-sm text-muted-foreground">Quem agendar pela internet ou pela sua agenda aparece aqui automaticamente.</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo cliente</Button>
      </header>

      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="rounded-2xl border-border/60"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou WhatsApp..." /></div></CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-0">
            <div className="border-b px-5 py-4 text-sm font-semibold">{filtered.length} cliente(s)</div>
            {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p> :
              <div className="max-h-[620px] overflow-y-auto divide-y">{filtered.map((customer) => <button key={customer.id} type="button" onClick={() => void openCustomer(customer)} className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted/50 ${selected?.id === customer.id ? "bg-primary/5" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{customer.name}</p><p className="truncate text-xs text-muted-foreground">{customer.phone || "WhatsApp não informado"}</p></div>
              </button>)}</div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-5">
            {!selected ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-muted-foreground"><UserRound className="mb-3 h-10 w-10" /><p className="font-medium">Selecione um cliente</p><p className="mt-1 max-w-sm text-xs">O histórico mostra atendimentos vindos da agenda interna e da agenda pública.</p></div> :
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-sm text-muted-foreground">{selected.phone || "WhatsApp não informado"}{selected.email ? " · " + selected.email : ""}</p></div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => startEdit(selected)} variant="outline">Editar cliente</Button><Button size="sm" onClick={() => schedule(selected)}><CalendarPlus className="mr-2 h-4 w-4" />Agendar para este cliente</Button>{selected.phone && <Button size="sm" variant="outline" onClick={() => whatsapp(selected.phone)}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>}</div>
                </div>
                {detailLoading ? <p className="text-sm text-muted-foreground">Carregando histórico...</p> : <>
                  <div className="grid grid-cols-3 gap-2"><Stat label="Atendimentos" value={String(visits.filter((visit) => visit.status !== "cancelled").length)} /><Stat label="Total gasto" value={money(spent)} /><Stat label="Veículos" value={String(vehicles.length)} /></div>
                  <section><h3 className="mb-2 flex items-center gap-2 font-semibold"><Car className="h-4 w-4" />Veículos</h3>{vehicles.length ? <div className="grid gap-2 sm:grid-cols-2">{vehicles.map((vehicle) => <div key={vehicle.id} className="rounded-xl border p-3"><p className="font-semibold">{vehicle.plate || "Sem placa"}</p><p className="text-xs text-muted-foreground">{[vehicle.brand, vehicle.model, vehicle.category].filter(Boolean).join(" · ")}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>}</section>
                  <section><h3 className="mb-2 font-semibold">Histórico</h3>{visits.length ? <div className="divide-y rounded-xl border">{visits.map((visit) => <div key={visit.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{visit.services.join(" + ") || "Serviço"}</p><p className="text-xs text-muted-foreground">{new Date(visit.appointment_date + "T12:00:00").toLocaleDateString("pt-BR")} · {visit.appointment_time.slice(0, 5)} · {visit.vehicle_plate || "Sem placa"} · {visit.source === "online" ? "Online" : "Manual"}</p></div><span className="font-semibold">{money(visit.total_price)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>}</section>
                </>}
              </div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader><div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Nome *</Label><Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label>WhatsApp *</Label><Input className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(48) 99999-9999" /></div></div>
          <div><Label>E-mail</Label><Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Observações</Label><Textarea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button className="w-full" onClick={() => void saveCustomer()} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}</Button>
        </div></DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}
