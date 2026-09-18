import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Car, Check, Clock3, Copy, ExternalLink, MessageCircle, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

type Service = { id: string; name: string; price: number; estimated_duration: number | null };
type Customer = { id: string; name: string; phone: string | null };
type Vehicle = { id: string; plate: string | null; brand: string | null; model: string | null };
type Appointment = {
  id: string; customer_id: string | null; customer_name: string; customer_phone: string;
  appointment_date: string; appointment_time: string; status: string; notes: string | null;
  vehicle_plate: string | null;
  service: Service | null;
  vehicle: Vehicle | null;
};

const today = () => new Date().toLocaleDateString("en-CA");
const digits = (value: string) => value.replace(/\D/g, "");
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AgendaPage() {
  const [companyId, setCompanyId] = useState("");
  const [servicesError, setServicesError] = useState("");
  const [date, setDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [vehicleId, setVehicleId] = useState("none");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerFound, setCustomerFound] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");

  const selectedService = useMemo(() => services.find(s => s.id === serviceId), [services, serviceId]);

  const load = async () => {
    try {
      setLoading(true); setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const [a, s, c] = await Promise.all([
        (supabase as any).from("appointments").select("id,customer_id,customer_name,customer_phone,appointment_date,appointment_time,status,notes,vehicle_id,vehicle_plate,service_id").eq("company_id", id).eq("appointment_date", date).order("appointment_time"),
        (supabase as any).from("services").select("id,name,price,estimated_duration").eq("company_id", id).eq("active", true).order("name"),
        (supabase as any).from("customers").select("id,name,phone").eq("company_id", id).order("name").limit(2000),
      ]);
      if (a.error) throw a.error;
      if (s.error) { setServicesError(s.error.message); throw s.error; }
      setServicesError("");
      if (c.error) throw c.error;

      const appointmentRows = a.data ?? [];
      const serviceRows = (s.data ?? []) as Service[];
      const vehicleIds = appointmentRows.map((row: any) => row.vehicle_id).filter(Boolean);
      let vehicleRows: Vehicle[] = [];
      if (vehicleIds.length) {
        const v = await (supabase as any).from("vehicles").select("id,plate,brand,model").in("id", vehicleIds);
        if (v.error) throw v.error;
        vehicleRows = (v.data ?? []) as Vehicle[];
      }
      const serviceMap = new Map(serviceRows.map(svc => [svc.id, svc]));
      const vehicleMap = new Map(vehicleRows.map(v => [v.id, v]));
      setAppointments(appointmentRows.map((row: any) => ({
        ...row,
        service: serviceMap.get(row.service_id) ?? null,
        vehicle: vehicleMap.get(row.vehicle_id) ?? null,
      })) as Appointment[]);

      const company = await (supabase as any).from("companies").select("public_booking_slug").eq("id", id).single();
      if (!company.error) setPublicSlug(company.data?.public_booking_slug ?? "");
      setServices(serviceRows);
      setCustomers((c.data ?? []) as Customer[]);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a agenda."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [date]);

  const loadSlots = async (service = serviceId, selectedDate = date) => {
    setSlots([]); setTime("");
    if (!companyId || !service || !selectedDate) { return; }
    const company = await supabase.from("companies").select("public_booking_slug").eq("id", companyId).single();
    if (company.error || !company.data?.public_booking_slug) { setError(company.error?.message || "Link público da empresa não configurado."); return; }
    const result = await (supabase as any).rpc("get_public_available_slots", { _slug: company.data.public_booking_slug, _date: selectedDate, _service_id: service });
    if (result.error) { setError(result.error.message); setSlots([]); return; }
    setSlots((result.data ?? []).map((row: { slot: string }) => row.slot.slice(0, 5)));
  };

  useEffect(() => { if (showForm) void loadSlots(); }, [serviceId, date, showForm]);

  const openNew = () => {
    setShowForm(true); setPhone(""); setName(""); setVehicles([]); setVehicleId("none"); setPlate(""); setBrand(""); setModel("");
    setServiceId(services[0]?.id ?? ""); setTime(""); setNotes(""); setCustomerFound(false); setError("");
  };

  const findCustomer = async () => {
    const phoneDigits = digits(phone);
    if (phoneDigits.length < 8) { setCustomerFound(false); return; }
    const customer = customers.find(c => digits(c.phone ?? "") === phoneDigits);
    if (!customer) { setCustomerFound(false); setVehicles([]); setVehicleId("none"); return; }
    setCustomerFound(true); setName(customer.name);
    const v = await supabase.from("vehicles").select("id,plate,brand,model").eq("company_id", companyId).eq("customer_id", customer.id).order("created_at", { ascending: false });
    if (!v.error) {
      setVehicles((v.data ?? []) as Vehicle[]);
      if (v.data?.[0]) {
        setVehicleId(v.data[0].id);
        setPlate(v.data[0].plate ?? ""); setBrand(v.data[0].brand ?? ""); setModel(v.data[0].model ?? "");
      }
    }
    const last = await supabase.from("appointments").select("service_id").eq("company_id", companyId).eq("customer_id", customer.id).order("appointment_date", { ascending: false }).order("appointment_time", { ascending: false }).limit(1).maybeSingle();
    if (!last.error && last.data?.service_id) setServiceId(last.data.service_id);
  };

  const chooseVehicle = (value: string) => {
    setVehicleId(value);
    const v = vehicles.find(item => item.id === value);
    if (!v || value === "none") { setPlate(""); setBrand(""); setModel(""); return; }
    setPlate(v.plate ?? ""); setBrand(v.brand ?? ""); setModel(v.model ?? "");
  };

  const save = async () => {
    if (!name.trim() || digits(phone).length < 8 || !serviceId || !date || !time) return setError("Preencha nome, WhatsApp, serviço, data e horário.");
    try {
      setSaving(true); setError("");
      let customerId = customers.find(c => digits(c.phone ?? "") === digits(phone))?.id ?? null;
      if (customerId) {
        const r = await supabase.from("customers").update({ name: name.trim(), phone: phone.trim(), updated_at: new Date().toISOString() }).eq("id", customerId).eq("company_id", companyId);
        if (r.error) throw r.error;
      } else {
        const r = await supabase.from("customers").insert({ company_id: companyId, name: name.trim(), phone: phone.trim() }).select("id").single();
        if (r.error) throw r.error;
        customerId = r.data.id;
      }

      let savedVehicleId: string | null = vehicleId !== "none" ? vehicleId : null;
      if (!savedVehicleId && plate.trim()) {
        const r = await supabase.from("vehicles").insert({ company_id: companyId, customer_id: customerId, plate: plate.trim().toUpperCase(), brand: brand.trim() || null, model: model.trim() || null }).select("id").single();
        if (r.error) throw r.error;
        savedVehicleId = r.data.id;
      }

      const r = await supabase.from("appointments").insert({
        company_id: companyId, customer_id: customerId, vehicle_id: savedVehicleId, service_id: serviceId,
        customer_name: name.trim(), customer_phone: phone.trim(), vehicle_plate: plate.trim().toUpperCase() || null,
        appointment_date: date, appointment_time: time, notes: notes.trim() || null, status: "pending",
      });
      if (r.error) {
        if (r.error.code === "23505") throw new Error("Esse horário acabou de ser ocupado. Escolha outro.");
        throw r.error;
      }
      setShowForm(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar o agendamento."); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error: mutationError } = await supabase.from("appointments").update({ status }).eq("id", id).eq("company_id", companyId);
    if (mutationError) setError(mutationError.message); else await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir este agendamento?")) return;
    const { error: mutationError } = await supabase.from("appointments").delete().eq("id", id).eq("company_id", companyId);
    if (mutationError) setError(mutationError.message); else await load();
  };

  const publicLink = publicSlug ? window.location.origin + "/agendar/" + publicSlug : "";
  const copyPublicLink = async () => { if (publicLink) await navigator.clipboard.writeText(publicLink); };

  const whatsapp = (a: Appointment) => {
    const msg = encodeURIComponent(`Olá, ${a.customer_name}! Seu agendamento está marcado para ${new Date(a.appointment_date + "T12:00:00").toLocaleDateString("pt-BR")} às ${a.appointment_time.slice(0,5)} para ${a.service?.name ?? "seu serviço"}.`);
    const number = digits(a.customer_phone);
    window.open(number ? "https://wa.me/55" + number + "?text=" + msg : "https://wa.me/?text=" + msg, "_blank", "noopener,noreferrer");
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-primary">Agenda</p><h2 className="text-2xl font-bold">Agendamentos</h2><p className="text-sm text-muted-foreground">A agenda sempre fica em ordem e respeita a duração de cada serviço.</p></div>
      <div className="flex gap-2"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" /><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo</Button></div>
    </div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

    {showForm && <Card>
      <CardHeader><div className="flex items-center justify-between"><div><h3 className="font-semibold">Novo agendamento</h3><p className="text-sm text-muted-foreground">Digite o WhatsApp. Se já existir, nome e veículo serão puxados automaticamente.</p></div><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>WhatsApp *</Label><div className="flex gap-2"><Input value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => void findCustomer()} placeholder="(48) 99999-9999" /><Button type="button" variant="outline" onClick={() => void findCustomer()}><Search className="h-4 w-4" /></Button></div>{customerFound && <p className="text-xs text-green-600">Cliente encontrado.</p>}</div>
          <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1"><Label>Veículo</Label><Select value={vehicleId} onValueChange={chooseVehicle}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Novo / não informado</SelectItem>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{[v.plate,v.brand,v.model].filter(Boolean).join(" · ")}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Placa</Label><Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" /></div>
          <div className="space-y-2"><Label>Modelo</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="Civic" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Serviço *</Label><Select value={serviceId} onValueChange={value => { setServiceId(value); setTime(""); }}><SelectTrigger><SelectValue placeholder={services.length ? "Escolha o serviço" : "Nenhum serviço disponível"} /></SelectTrigger><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.estimated_duration ?? 60} min · {money(Number(s.price))}</SelectItem>)}</SelectContent></Select>{servicesError && <p className="text-xs text-destructive">Erro ao carregar serviços: {servicesError}</p>}{!servicesError && services.length === 0 && <p className="text-xs text-muted-foreground">Cadastre um serviço em Serviços e ele aparecerá aqui.</p>}</div>
          <div className="space-y-2"><Label>Data *</Label><Input type="date" min={today()} value={date} onChange={e => { setDate(e.target.value); setTime(""); }} /></div>
          <div className="space-y-2"><Label>Horário disponível *</Label><Select value={time} onValueChange={setTime}><SelectTrigger><SelectValue placeholder={slots.length ? "Escolha um horário" : "Selecione serviço"} /></SelectTrigger><SelectContent>{slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {selectedService && <div className="rounded-lg bg-muted/50 p-3 text-sm"><strong>{selectedService.name}</strong> · {selectedService.estimated_duration ?? 60} minutos · {money(Number(selectedService.price))}. Os horários acima já consideram os agendamentos existentes.</div>}
        <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" /></div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving || !time}>{saving ? "Salvando..." : "Salvar agendamento"}</Button></div>
      </CardContent>
    </Card>}

    {publicLink && <Card><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">Link de agendamento para seus clientes</p><p className="truncate text-sm text-muted-foreground">{publicLink}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void copyPublicLink()}><Copy className="mr-2 h-4 w-4" />Copiar</Button><Button variant="outline" asChild><a href={publicLink} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir</a></Button></div></div></CardContent></Card>}

    <div className="grid gap-4 sm:grid-cols-4">
      <Metric label="Agendamentos" value={String(appointments.length)} />
      <Metric label="Confirmados" value={String(appointments.filter(a => a.status === "confirmed").length)} />
      <Metric label="Concluídos" value={String(appointments.filter(a => a.status === "completed").length)} />
      <Metric label="Valor agendado" value={money(appointments.filter(a => a.status !== "cancelled").reduce((s,a) => s + Number(a.service?.price ?? 0), 0))} />
    </div>

    <Card><CardHeader><h3 className="font-semibold">Agenda de {new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}</h3></CardHeader><CardContent className="p-0">
      {loading ? <div className="p-6 text-sm text-muted-foreground">Carregando...</div> : appointments.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento neste dia.</div> :
      <div className="divide-y">{appointments.map(a => <div key={a.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-3"><div className="min-w-16 rounded-lg bg-primary/10 px-2 py-2 text-center font-bold text-primary">{a.appointment_time.slice(0,5)}</div><div className="min-w-0"><p className="font-semibold">{a.customer_name}</p><p className="text-sm text-muted-foreground"><UserRound className="mr-1 inline h-3.5 w-3.5" />{a.customer_phone}</p><p className="text-sm text-muted-foreground"><Car className="mr-1 inline h-3.5 w-3.5" />{a.vehicle ? [a.vehicle.plate,a.vehicle.brand,a.vehicle.model].filter(Boolean).join(" · ") : a.vehicle_plate || "Veículo não informado"}</p><p className="mt-1 text-xs text-muted-foreground"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{a.service?.name ?? "Serviço"} · {a.service?.estimated_duration ?? 60} min · {money(Number(a.service?.price ?? 0))}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs">{a.status === "pending" ? "Pendente" : a.status === "confirmed" ? "Confirmado" : a.status === "completed" ? "Concluído" : "Cancelado"}</span>{a.status !== "cancelled" && a.status !== "completed" && <Button variant="outline" size="sm" onClick={() => void updateStatus(a.id, a.status === "pending" ? "confirmed" : "completed")}>{a.status === "pending" ? <><Check className="mr-2 h-4 w-4" />Confirmar</> : <><Check className="mr-2 h-4 w-4" />Concluir</>}</Button>}{a.status !== "cancelled" && <Button variant="outline" size="sm" onClick={() => whatsapp(a)}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>}{a.status !== "cancelled" && a.status !== "completed" && <Button variant="ghost" size="icon" onClick={() => void updateStatus(a.id, "cancelled")}><X className="h-4 w-4" /></Button>}<Button variant="ghost" size="icon" onClick={() => void remove(a.id)}><Trash2 className="h-4 w-4" /></Button></div>
      </div>)}</div>}
    </CardContent></Card>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>;
}
