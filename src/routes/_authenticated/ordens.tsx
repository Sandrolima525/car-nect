import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/ordens")({ component: OrdensPage });

type Appointment = {
  id: string; customer_id: string | null; customer_name: string; customer_phone: string;
  vehicle_id: string | null; vehicle_plate: string | null; appointment_date: string; appointment_time: string;
  status: string; notes: string | null;
  service: { id: string; name: string; price: number } | null;
  vehicle: { id: string; plate: string; brand: string | null; model: string | null } | null;
};
type Service = { id: string; name: string; price: number };
type Order = { id: string; customer_id: string | null; appointment_id: string | null; status: string; total: number; created_at: string };

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toLocaleDateString("en-CA");

function OrdensPage() {
  const [companyId, setCompanyId] = useState("");
  const [date, setDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const id = companyId || (await getCurrentCompanyId());
      setCompanyId(id);
      const [appointmentRes, serviceRes, orderRes] = await Promise.all([
        supabase.from("appointments").select("id,customer_id,customer_name,customer_phone,vehicle_id,vehicle_plate,appointment_date,appointment_time,status,notes,service:services(id,name,price),vehicle:vehicles(id,plate,brand,model)").eq("company_id", id).eq("appointment_date", date).order("appointment_time"),
        supabase.from("services").select("id,name,price").eq("company_id", id).eq("active", true).order("name"),
        supabase.from("service_orders").select("id,customer_id,appointment_id,status,total,created_at").eq("company_id", id).order("created_at", { ascending: false }).limit(30),
      ]);
      for (const result of [appointmentRes, serviceRes, orderRes]) if (result.error) throw result.error;
      setAppointments((appointmentRes.data ?? []) as unknown as Appointment[]);
      setServices((serviceRes.data ?? []) as Service[]);
      setOrders((orderRes.data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as ordens.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [date]);

  const selectedService = useMemo(() => services.find((service) => service.id === serviceId), [services, serviceId]);
  const total = Math.max(0, (Number(price) || 0) - Math.max(0, Number(discount) || 0));

  const chooseAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const initialServiceId = appointment.service?.id ?? "";
    setServiceId(initialServiceId);
    setPrice(initialServiceId ? String(Number(appointment.service?.price ?? 0)) : "");
    setDiscount(""); setNotes(appointment.notes ?? ""); setStatus("in_progress"); setError("");
  };

  const changeService = (value: string) => {
    setServiceId(value);
    const service = services.find((item) => item.id === value);
    setPrice(service ? String(Number(service.price)) : "");
  };

  const reset = () => {
    setSelectedAppointment(null); setServiceId(""); setPrice(""); setDiscount(""); setNotes(""); setStatus("in_progress");
  };

  const save = async () => {
    if (!selectedAppointment) return setError("Selecione um agendamento.");
    if (!serviceId) return setError("Selecione o serviço realizado.");
    if (!price || Number(price) < 0) return setError("Informe o valor cobrado.");
    try {
      setSaving(true); setError("");
      const subtotal = Number(price);
      const discountValue = Math.max(0, Number(discount) || 0);
      const finalTotal = Math.max(0, subtotal - discountValue);
      const { data: order, error: orderError } = await supabase.from("service_orders").insert({
        company_id: companyId, appointment_id: selectedAppointment.id, customer_id: selectedAppointment.customer_id,
        vehicle_id: selectedAppointment.vehicle_id, status, subtotal, discount: discountValue, total: finalTotal,
        notes: notes.trim() || null, started_at: new Date().toISOString(),
      }).select("id").single();
      if (orderError) throw orderError;
      const { error: itemError } = await supabase.from("service_order_items").insert({
        company_id: companyId, service_order_id: order.id, service_id: serviceId, quantity: 1, unit_price: subtotal, total: subtotal,
      });
      if (itemError) {
        await supabase.from("service_orders").delete().eq("id", order.id);
        throw itemError;
      }
      const { error: appointmentError } = await supabase.from("appointments").update({ status: "converted" }).eq("id", selectedAppointment.id).eq("company_id", companyId);
      if (appointmentError) throw appointmentError;
      reset(); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a ordem.");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h2>
        <p className="text-muted-foreground">Transforme os agendamentos do dia em ordens sem redigitar os dados do cliente.</p>
      </div>
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-semibold">Agendamentos do dia</h3><p className="text-sm text-muted-foreground">Selecione um cliente para abrir a OS.</p></div>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-auto" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Carregando...</div> :
          appointments.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento para {new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}.</div> :
          <div className="divide-y">{appointments.map((appointment) => (
            <button key={appointment.id} type="button" onClick={() => chooseAppointment(appointment)} disabled={appointment.status === "converted"} className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="min-w-16 rounded-lg bg-muted px-2 py-1 text-center text-sm font-semibold">{appointment.appointment_time.slice(0, 5)}</div>
                <div>
                  <p className="font-semibold">{appointment.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{appointment.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">{appointment.vehicle ? [appointment.vehicle.plate, appointment.vehicle.brand, appointment.vehicle.model].filter(Boolean).join(" · ") : appointment.vehicle_plate || "Veículo não informado"} · {appointment.service?.name ?? "Serviço não informado"}</p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{appointment.status === "converted" ? "OS criada" : "Abrir OS"}</span>
            </button>
          ))}</div>}
        </CardContent>
      </Card>

      {selectedAppointment && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Nova Ordem de Serviço</h3>
            <p className="text-sm text-muted-foreground">{selectedAppointment.customer_name} · {selectedAppointment.appointment_time.slice(0, 5)}{selectedAppointment.vehicle ? " · " + selectedAppointment.vehicle.plate : ""}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="font-medium">{selectedAppointment.customer_name}</p>
              <p className="text-sm text-muted-foreground">{selectedAppointment.customer_phone}</p>
              {selectedAppointment.vehicle && <p className="mt-1 text-sm text-muted-foreground">{[selectedAppointment.vehicle.plate, selectedAppointment.vehicle.brand, selectedAppointment.vehicle.model].filter(Boolean).join(" · ")}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Serviço realizado *</Label><Select value={serviceId} onValueChange={changeService}><SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger><SelectContent>{services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Valor cobrado *</Label><Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0,00" />{selectedService && <p className="text-xs text-muted-foreground">Preço cadastrado: {money(Number(selectedService.price))}</p>}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Desconto</Label><Input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0,00" /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="completed">Concluída</SelectItem><SelectItem value="delivered">Entregue</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" /></div>
            <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm text-muted-foreground">Total da OS</p><p className="text-2xl font-bold">{money(total)}</p></div>
              <div className="flex gap-2"><Button variant="outline" onClick={reset}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Criar OS"}</Button></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><h3 className="font-semibold">Últimas ordens</h3></CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhuma ordem cadastrada.</div> :
          <div className="divide-y">{orders.map((order) => <div key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{order.appointment_id ? "Agendamento convertido em OS" : "OS manual"}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p></div><div className="flex items-center gap-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{order.status}</span><span className="font-semibold">{money(Number(order.total))}</span></div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
