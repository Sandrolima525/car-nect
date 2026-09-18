import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Car, ClipboardList, Clock3, ExternalLink, Phone, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrudPage } from "@/components/common/crud-page";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/clientes")({ component: ClientesPage });

type Customer = { id: string; name: string; phone: string | null; email: string | null; document: string | null; notes: string | null };
type Vehicle = { id: string; plate: string; brand: string | null; model: string | null };
type HistoryOrder = { id: string; total: number; status: string; created_at: string; vehicle: { plate: string; brand: string | null; model: string | null } | null; items: { service: { name: string } | null }[] };

function CustomerHistory({ customer }: { customer: Customer }) {
  const [history, setHistory] = useState<HistoryOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [ordersRes, vehiclesRes] = await Promise.all([
        (supabase as any).from("service_orders").select("id,total,status,created_at,vehicle:vehicles(plate,brand,model),items:service_order_items(service:services(name))").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("vehicles").select("id,plate,brand,model").eq("customer_id", customer.id).order("created_at", { ascending: false }),
      ]);
      if (!ordersRes.error) setHistory((ordersRes.data ?? []) as HistoryOrder[]);
      if (!vehiclesRes.error) setVehicles((vehiclesRes.data ?? []) as Vehicle[]);
      setLoading(false);
    })();
  }, [customer.id]);

  const totalSpent = history.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return <div className="space-y-5 border-t bg-muted/20 p-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Atendimentos</p><p className="mt-1 text-2xl font-semibold">{history.length}</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Total em serviços</p><p className="mt-1 text-2xl font-semibold">R$ {totalSpent.toFixed(2).replace(".", ",")}</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Veículos</p><p className="mt-1 text-2xl font-semibold">{vehicles.length}</p></div>
    </div>
    {vehicles.length > 0 && <div><div className="mb-2 flex items-center gap-2 font-semibold"><Car className="h-4 w-4" /> Veículos</div><div className="flex flex-wrap gap-2">{vehicles.map(v => <span key={v.id} className="rounded-full border bg-card px-3 py-1.5 text-xs">{[v.plate, v.brand, v.model].filter(Boolean).join(" · ")}</span>)}</div></div>}
    <div>
      <div className="mb-2 flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4" /> Histórico de ordens</div>
      {loading ? <p className="text-sm text-muted-foreground">Carregando histórico...</p> : history.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ordem de serviço registrada para este cliente.</p> :
      <div className="divide-y rounded-xl border bg-card">{history.map(order => <div key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium">{order.items?.map(i => i.service?.name).filter(Boolean).join(", ") || "Serviço"}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")} · {order.vehicle ? [order.vehicle.plate, order.vehicle.brand, order.vehicle.model].filter(Boolean).join(" · ") : "Sem veículo"}</p></div>
        <div className="flex items-center gap-3"><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{order.status}</span><strong>R$ {Number(order.total).toFixed(2).replace(".", ",")}</strong></div>
      </div>)}</div>}
    </div>
  </div>;
}

function ClientesPage() {
  return <CrudPage table="customers" title="Clientes" singular="Cliente" description="Cadastre e gerencie os clientes da sua empresa."
    fields={[{ key: "name", label: "Nome", required: true }, { key: "phone", label: "Telefone" }, { key: "email", label: "E-mail", type: "email" }, { key: "document", label: "Documento" }, { key: "notes", label: "Observações" }]}
    columns={[{ key: "name", label: "Nome" }, { key: "phone", label: "Telefone" }, { key: "email", label: "E-mail" }, { key: "document", label: "Documento" }]}
    renderExpandedRow={(row: any) => <CustomerHistory customer={row as Customer} />}
  />;
}