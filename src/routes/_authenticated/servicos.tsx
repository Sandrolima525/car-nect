import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/servicos")({ component: ServicesPage });

type Service = { id: string; name: string; price: number; estimated_duration: number | null; active: boolean };

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ServicesPage() {
  const [companyId, setCompanyId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const { data, error: queryError } = await supabase.from("services").select("id,name,price,estimated_duration,active").eq("company_id", id).eq("active", true).order("name");
      if (queryError) throw queryError;
      setServices((data ?? []) as Service[]);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar os serviços."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => { setEditing(null); setName(""); setDuration("60"); setPrice(""); };

  const save = async () => {
    if (!name.trim()) return setError("Informe o nome do serviço.");
    if (!Number(price) || Number(price) < 0) return setError("Informe um valor válido.");
    if (!Number(duration) || Number(duration) < 5) return setError("Informe uma duração de pelo menos 5 minutos.");
    try {
      setSaving(true); setError("");
      const payload = { name: name.trim(), price: Number(price), estimated_duration: Number(duration), active: true };
      const result = editing
        ? await supabase.from("services").update(payload).eq("id", editing).eq("company_id", companyId)
        : await supabase.from("services").insert({ ...payload, company_id: companyId });
      if (result.error) throw result.error;
      reset(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  };

  const edit = (service: Service) => { setEditing(service.id); setName(service.name); setDuration(String(service.estimated_duration ?? 60)); setPrice(String(service.price)); };

  const remove = async (id: string) => {
    if (!window.confirm("Remover este serviço?")) return;
    const { error: mutationError } = await supabase.from("services").update({ active: false }).eq("id", id).eq("company_id", companyId);
    if (mutationError) setError(mutationError.message); else await load();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold">Serviços</h2><p className="text-sm text-muted-foreground">Cadastre somente o que o sistema precisa para montar a agenda.</p></div><Button onClick={reset}><Plus className="mr-2 h-4 w-4" />Novo serviço</Button></div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {(editing || name || price) && <Card><CardHeader><h3 className="font-semibold">{editing ? "Editar serviço" : "Novo serviço"}</h3></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Serviço *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Lavagem completa" /></div><div className="space-y-2"><Label>Duração (minutos) *</Label><Input type="number" min="5" step="5" value={duration} onChange={e => setDuration(e.target.value)} /></div><div className="space-y-2"><Label>Valor *</Label><Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" /></div><div className="flex gap-2 sm:col-span-3"><Button onClick={() => void save()} disabled={saving}>{saving ? "Salvando..." : "Salvar serviço"}</Button><Button variant="outline" onClick={reset}>Cancelar</Button></div></CardContent></Card>}
    <Card><CardContent className="p-0">{loading ? <div className="p-6 text-sm text-muted-foreground">Carregando...</div> : services.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum serviço cadastrado.</div> : <div className="divide-y">{services.map(s => <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{s.estimated_duration ?? 60} minutos</p></div><div className="flex items-center gap-3"><span className="font-bold">{money(Number(s.price))}</span><Button variant="ghost" size="icon" onClick={() => edit(s)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void remove(s.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}</CardContent></Card>
  </div>;
}
