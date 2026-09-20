import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Edit3, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/servicos")({ component: ServicesPage });

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_duration: number | null;
  category: string | null;
  vehicle_category: string;
  active: boolean;
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ServicesPage() {
  const [companyId, setCompanyId] = useState("");
  const [items, setItems] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [category, setCategory] = useState("Lavagem");
  const [vehicleCategory, setVehicleCategory] = useState("all");
  const [active, setActive] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const result = await supabase.from("services").select("id,name,description,price,estimated_duration,category,vehicle_category,active").eq("company_id", id).order("active", { ascending: false }).order("name");
      if (result.error) throw result.error;
      setItems((result.data ?? []) as Service[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || item.name.toLowerCase().includes(term) || (item.category ?? "").toLowerCase().includes(term))
      && (!onlyActive || item.active);
  }), [items, query, onlyActive]);

  const reset = () => {
    setEditing(null); setName(""); setDescription(""); setPrice(""); setDuration("60");
    setCategory("Lavagem"); setVehicleCategory("all"); setActive(true);
  };

  const edit = (item: Service) => {
    setEditing(item); setName(item.name); setDescription(item.description ?? ""); setPrice(String(item.price));
    setDuration(String(item.estimated_duration ?? 60)); setCategory(item.category ?? "Lavagem");
    setVehicleCategory(item.vehicle_category || "all"); setActive(item.active); setOpen(true);
  };

  const save = async () => {
    const numericPrice = Number(price.replace(",", "."));
    const numericDuration = Number(duration);
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isFinite(numericDuration) || numericDuration <= 0) {
      setError("Informe nome, valor e uma duração válida.");
      return;
    }
    try {
      setSaving(true); setError("");
      const payload = {
        company_id: companyId,
        name: name.trim(),
        description: description.trim() || null,
        price: numericPrice,
        estimated_duration: Math.round(numericDuration),
        category: category.trim() || null,
        vehicle_category: vehicleCategory,
        active,
        updated_at: new Date().toISOString(),
      };
      const result = editing
        ? await supabase.from("services").update(payload).eq("id", editing.id).eq("company_id", companyId)
        : await supabase.from("services").insert(payload);
      if (result.error) throw result.error;
      setOpen(false); reset(); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Service) => {
    if (!window.confirm("Excluir este serviço? Serviços já usados em agendamentos serão preservados como histórico.")) return;
    const result = await supabase.from("services").update({ active: false, updated_at: new Date().toISOString() }).eq("id", item.id).eq("company_id", companyId);
    if (result.error) setError(result.error.message); else void load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-4 w-4" />Catálogo</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Serviços</h1><p className="text-sm text-muted-foreground">Defina o que você oferece, quanto custa e quanto tempo ocupa na agenda.</p></div>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Novo serviço</Button>
      </header>

      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar serviço..." /></div>
            <label className="flex items-center gap-2 rounded-xl border px-3 text-sm"><Switch checked={onlyActive} onCheckedChange={setOnlyActive} />Somente ativos</label>
          </div>
        </CardContent>
      </Card>

      {loading ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Carregando serviços...</CardContent></Card> : filtered.length === 0 ? <Card><CardContent className="p-10 text-center"><Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhum serviço encontrado.</p><p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro serviço para liberar a agenda.</p></CardContent></Card> :
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.category || "Sem categoria"} · {vehicleLabel(item.vehicle_category)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{item.active ? "Ativo" : "Inativo"}</span></div>
                {item.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">Valor</p><p className="mt-1 font-bold">{money(Number(item.price))}</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">Duração</p><p className="mt-1 flex items-center gap-1 font-bold"><Clock3 className="h-3.5 w-3.5" />{item.estimated_duration ?? 60} min</p></div></div>
                <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => edit(item)}><Edit3 className="mr-2 h-4 w-4" />Editar</Button>{item.active && <Button variant="ghost" size="icon" onClick={() => void remove(item)} aria-label="Desativar"><Trash2 className="h-4 w-4" /></Button>}</div>
              </CardContent>
            </Card>
          ))}
        </div>}

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div><Label>Nome *</Label><Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lavagem completa" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label>Valor (R$) *</Label><Input className="mt-2" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80,00" /></div><div><Label>Duração (minutos) *</Label><Input className="mt-2" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label>Categoria</Label><Input className="mt-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Lavagem" /></div><div><Label>Tipo de veículo</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)}><option value="all">Todos</option><option value="Hatch">Hatch</option><option value="Sedan">Sedan</option><option value="SUV/Picape">SUV / Picape</option></select></div></div>
            <div><Label>Descrição</Label><Textarea className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que está incluído no serviço?" /></div>
            <label className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-semibold">Disponível para agendamento</p><p className="text-xs text-muted-foreground">Serviços inativos não aparecem na agenda.</p></div><Switch checked={active} onCheckedChange={setActive} /></label>
            <Button className="w-full" onClick={() => void save()} disabled={saving}>{saving ? "Salvando..." : "Salvar serviço"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function vehicleLabel(value: string) {
  return value === "all" ? "Todos os veículos" : value;
}
