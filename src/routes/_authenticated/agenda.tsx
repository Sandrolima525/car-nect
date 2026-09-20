import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, LockKeyhole, MessageCircle, Plus, RefreshCw, Search, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

type Service = {
  id: string;
  name: string;
  price: number;
  estimated_duration: number | null;
  vehicle_category: string;
};

type BusinessHour = { open: string; close: string; enabled: boolean };

type BookingBlock = {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string | null;
};

type CustomerVehicle = {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
};

type Appointment = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  vehicle_plate: string | null;
  appointment_time: string;
  appointment_date: string;
  status: string;
  total_price: number;
  total_duration: number;
  source: string;
  services: { id: string; name: string }[];
};

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const statuses = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "confirmed", label: "Em atendimento" },
  { value: "completed", label: "Pronto" },
  { value: "delivered", label: "Finalizado" },
];

function AgendaPage() {
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("Sua empresa");
  const [businessHours, setBusinessHours] = useState<Record<string, BusinessHour>>({});
  const [bookingSlug, setBookingSlug] = useState("");
  const [blocks, setBlocks] = useState<BookingBlock[]>([]);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockMode, setBlockMode] = useState<"time" | "day">("time");
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [blockReason, setBlockReason] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("Hatch");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);

      const companyRes = await supabase.from("companies").select("name,public_booking_slug,business_hours,booking_interval_minutes,simultaneous_capacity").eq("id", id).maybeSingle();
      const servicesRes = await supabase.from("services").select("id,name,price,estimated_duration,vehicle_category,active").eq("company_id", id).eq("active", true).order("name");
      if (companyRes.error) throw companyRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setCompanyName(companyRes.data?.name ?? "Sua empresa");
      setBusinessHours((companyRes.data?.business_hours ?? {}) as Record<string, BusinessHour>);
      setBookingSlug(companyRes.data?.public_booking_slug ?? "");
      setServices((servicesRes.data ?? []) as Service[]);

      const [appointmentsRes, blocksRes, customersRes] = await Promise.all([
        supabase.from("appointments")
          .select("id,customer_id,customer_name,customer_phone,vehicle_plate,appointment_date,appointment_time,status,total_price,total_duration,source")
          .eq("company_id", id).eq("appointment_date", date).neq("status", "cancelled").order("appointment_time"),
        supabase.from("booking_blocks")
          .select("id,block_date,start_time,end_time,reason")
          .eq("company_id", id).gte("block_date", today()).order("block_date").order("start_time"),
        supabase.from("customers")
          .select("id,name,phone")
          .eq("company_id", id).order("name"),
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (blocksRes.error) throw blocksRes.error;
      if (customersRes.error) throw customersRes.error;

      setCustomers((customersRes.data ?? []) as CustomerSuggestion[]);
      setBlocks((blocksRes.data ?? []) as BookingBlock[]);

      const rows = appointmentsRes.data ?? [];
      const ids = rows.map((row) => row.id);
      const links = ids.length
        ? await (supabase as any).from("appointment_services").select("appointment_id,service_id,price,duration_minutes,service:services(id,name)").in("appointment_id", ids)
        : { data: [], error: null };
      if (links.error) throw links.error;

      const grouped = new Map<string, any[]>();
      for (const link of links.data ?? []) grouped.set(link.appointment_id, [...(grouped.get(link.appointment_id) ?? []), link]);

      setItems(rows.map((row: any) => {
        const linked = grouped.get(row.id) ?? [];
        return {
          ...row,
          total_price: linked.length ? linked.reduce((sum: number, item: any) => sum + Number(item.price), 0) : Number(row.total_price ?? 0),
          total_duration: linked.length ? linked.reduce((sum: number, item: any) => sum + Number(item.duration_minutes ?? 60), 0) : Number(row.total_duration ?? 60),
          services: linked.map((item: any) => item.service).filter(Boolean),
        };
      }) as Appointment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("car-nect:agenda-customer");
      if (raw) {
        const customer = JSON.parse(raw) as { name?: string; phone?: string };
        if (customer.name) setName(customer.name);
        if (customer.phone) setPhone(customer.phone);
        localStorage.removeItem("car-nect:agenda-customer");
      }
    } catch { /* ignore invalid local draft */ }
    void load();
  }, [date]);

  const dayKey = (value: Date) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][value.getDay()];
  const toLocalDateKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  };
  const isFullDayBlocked = (value: Date) => blocks.some((block) => block.block_date === toLocalDateKey(value) && block.start_time === "00:00:00" && block.end_time.startsWith("23:59"));
  const isClosedDay = (value: Date) => businessHours[dayKey(value)]?.enabled === false;
  const isUnavailableDate = (value: Date) => value < new Date(new Date().setHours(0, 0, 0, 0)) || isClosedDay(value) || isFullDayBlocked(value);

  const compatible = useMemo(
    () => services.filter((service) => service.vehicle_category === "all" || service.vehicle_category === vehicleCategory),
    [services, vehicleCategory],
  );

  useEffect(() => {
    setServiceIds((current) => current.filter((id) => compatible.some((service) => service.id === id)));
  }, [vehicleCategory, compatible]);

  const customerSuggestions = useMemo(() => {
    if (!open || selectedCustomerId || name.trim().length < 2) return [];
    const term = name.trim().toLowerCase();
    return customers
      .filter((customer) => customer.name.toLowerCase().includes(term) || (customer.phone ?? "").includes(term))
      .slice(0, 8);
  }, [open, selectedCustomerId, name, customers]);

  const selectCustomer = async (customer: CustomerSuggestion) => {
    setSelectedCustomerId(customer.id);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setCustomerVehicles([]);
    setSelectedVehicleId("");

    const result = await supabase
      .from("vehicles")
      .select("id,plate,brand,model,category")
      .eq("company_id", companyId)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    const vehicles = (result.data ?? []) as CustomerVehicle[];
    setCustomerVehicles(vehicles);

    if (vehicles.length === 1) {
      const vehicle = vehicles[0];
      setSelectedVehicleId(vehicle.id);
      setVehicleCategory(vehicle.category || "Hatch");
      setPlate(vehicle.plate ?? "");
      setBrand(vehicle.brand ?? "");
      setModel(vehicle.model ?? "");
    }
  };

  const selectVehicle = (vehicleId: string) => {
    const vehicle = customerVehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;
    setSelectedVehicleId(vehicle.id);
    setVehicleCategory(vehicle.category || "Hatch");
    setPlate(vehicle.plate ?? "");
    setBrand(vehicle.brand ?? "");
    setModel(vehicle.model ?? "");
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomerId("");
    setCustomerVehicles([]);
    setSelectedVehicleId("");
  };

  useEffect(() => {
    if (!open || !serviceIds.length) {
      setSlots([]);
      setTime("");
      return;
    }

    const hours = businessHours[dayKey(new Date(date + "T12:00:00"))];
    if (!hours?.enabled) {
      setSlots([]);
      setTime("");
      return;
    }

    const duration = serviceIds.reduce((sum, id) => sum + Number(services.find((service) => service.id === id)?.estimated_duration ?? 60), 0);
    const interval = 15;
    const capacity = 2;
    const toMinutes = (value: string) => {
      const [h, m] = value.slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };
    const formatTime = (minutes: number) => String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
    const start = toMinutes(hours.open);
    const end = toMinutes(hours.close);
    const dateBlocks = blocks.filter((block) => block.block_date === date);
    const available: string[] = [];

    for (let startMinute = start; startMinute + duration <= end; startMinute += interval) {
      const finish = startMinute + duration;
      const overlapsBlock = dateBlocks.some((block) => startMinute < toMinutes(block.end_time) && finish > toMinutes(block.start_time));
      if (overlapsBlock) continue;

      const overlappingAppointments = items.filter((item) => {
        const appointmentStart = toMinutes(item.appointment_time);
        const appointmentFinish = appointmentStart + Number(item.total_duration || 0);
        return startMinute < appointmentFinish && finish > appointmentStart;
      }).length;

      if (overlappingAppointments < capacity) available.push(formatTime(startMinute));
    }

    setSlots(available);
    if (time && !available.includes(time)) setTime("");
  }, [open, serviceIds, date, businessHours, services, blocks, items, time]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = filter === "all" || item.status === filter;
      const matchesQuery = !term || item.customer_name.toLowerCase().includes(term) || (item.customer_phone ?? "").includes(term) || (item.vehicle_plate ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [items, filter, query]);

  const resetForm = () => {
    setName(""); setPhone(""); setVehicleCategory("Hatch"); setPlate(""); setBrand(""); setModel("");
    setSelectedCustomerId(""); setCustomerVehicles([]); setSelectedVehicleId("");
    setServiceIds([]); setTime(""); setSlots([]); setNotes("");
  };

  const save = async () => {
    if (!name.trim() || phone.replace(/\D/g, "").length < 8 || !serviceIds.length || !time) {
      setError("Informe nome, WhatsApp, serviço e horário.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const result = await (supabase as any).rpc("create_walk_in_appointment", {
        _company_id: companyId,
        _name: name.trim(),
        _phone: phone.trim(),
        _service_ids: serviceIds,
        _date: date,
        _time: time,
        _vehicle_category: vehicleCategory,
        _vehicle_plate: plate.trim() || null,
        _vehicle_brand: brand.trim() || null,
        _vehicle_model: model.trim() || null,
        _notes: notes.trim() || null,
      });
      if (result.error) throw result.error;
      setOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o agendamento.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item: Appointment) => {
    const next = item.status === "pending" ? "confirmed" : item.status === "confirmed" ? "completed" : item.status === "completed" ? "delivered" : null;
    if (!next) return;
    const now = new Date().toISOString();
    const patch: {
      status: string;
      updated_at: string;
      washing_at?: string;
      ready_at?: string;
      completed_at?: string;
    } = { status: next, updated_at: now };
    if (next === "confirmed") patch.washing_at = now;
    if (next === "completed") patch.ready_at = now;
    if (next === "delivered") patch.completed_at = now;
    const result = await supabase.from("appointments").update(patch).eq("id", item.id);
    if (result.error) setError(result.error.message); else void load();
  };

  const openBlockDialog = () => {
    setError("");
    setBlockMode("time");
    setBlockStart("12:00");
    setBlockEnd("13:00");
    setBlockReason("");
    setBlockOpen(true);
  };

  const saveBlock = async () => {
    const start = blockMode === "day" ? "00:00" : blockStart;
    const end = blockMode === "day" ? "23:59:59" : blockEnd;
    if (blockMode === "time" && start >= end) {
      setError("O horário final precisa ser maior que o inicial.");
      return;
    }
    try {
      setSavingBlock(true);
      setError("");
      const result = await supabase.from("booking_blocks").insert({
        company_id: companyId,
        block_date: date,
        start_time: start,
        end_time: end,
        reason: blockReason.trim() || (blockMode === "day" ? "Dia bloqueado" : "Horário bloqueado"),
      });
      if (result.error) throw result.error;
      setBlockOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível bloquear o horário.");
    } finally {
      setSavingBlock(false);
    }
  };

  const removeBlock = async (block: BookingBlock) => {
    if (!window.confirm("Remover este bloqueio?")) return;
    const result = await supabase.from("booking_blocks").delete().eq("id", block.id);
    if (result.error) setError(result.error.message);
    else void load();
  };

  const cancel = async (item: Appointment) => {
    if (!window.confirm("Cancelar este agendamento?")) return;
    const result = await supabase.from("appointments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", item.id);
    if (result.error) setError(result.error.message); else void load();
  };

  const whatsapp = (item: Appointment) => {
    const number = (item.customer_phone ?? "").replace(/\D/g, "");
    if (number.length < 8) return;
    const message = encodeURIComponent(`Olá, ${item.customer_name}! Aqui é da ${companyName}. Seu atendimento está confirmado para ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR")} às ${item.appointment_time.slice(0, 5)}. 🚗✨`);
    window.open(`https://wa.me/${number.startsWith("55") ? number : "55" + number}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const moveDate = (days: number) => {
    const value = new Date(date + "T12:00:00");
    value.setDate(value.getDate() + days);
    setDate(value.toLocaleDateString("en-CA"));
  };

  const hours = Array.from({ length: 25 }, (_, index) => 8 * 60 + index * 30);
  const total = items.length;
  const revenue = items.reduce((sum, item) => sum + Number(item.total_price), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><CalendarDays className="h-4 w-4" />Agenda inteligente</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm capitalize text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 w-full justify-center rounded-xl px-4 shadow-sm sm:w-auto sm:min-w-40" title="Selecionar data">
                <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm font-semibold capitalize">
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={new Date(date + "T12:00:00")}
                onSelect={(selected) => {
                  if (!selected) return;
                  const currentToday = today();
                  const selectedDate = toLocalDateKey(selected);
                  if (selectedDate < currentToday) return;
                  setDate(selectedDate);
                  setCalendarOpen(false);
                }}
                locale={ptBR}
                disabled={isUnavailableDate}
                hidden={{ before: new Date() }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" className="h-11 rounded-xl" onClick={openBlockDialog}>
              <LockKeyhole className="mr-2 h-4 w-4" />Bloquear
            </Button>
            <Button
              className="h-11 rounded-xl"
              onClick={() => {
                setError("");
                const currentToday = today();
                if (date < currentToday) setDate(currentToday);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />Novo agendamento
            </Button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Summary label="Agendamentos" value={String(total)} />
        <Summary label="Valor previsto" value={money(revenue)} />
        <Summary label="Origem online" value={String(items.filter((item) => item.source === "online").length)} />
      </div>

      {blocks.length > 0 && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 text-amber-600" />Horários bloqueados</div>
                <p className="mt-1 text-xs text-muted-foreground">Esses períodos não ficam disponíveis para novos agendamentos.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={openBlockDialog}>Novo bloqueio</Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {blocks.map((block) => {
                const fullDay = block.start_time === "00:00:00" && block.end_time.startsWith("23:59");
                return (
                  <div key={block.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-background p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{fullDay ? "Dia inteiro" : block.start_time.slice(0, 5) + " — " + block.end_time.slice(0, 5)}</p>
                      <p className="truncate text-xs text-muted-foreground">{block.reason || "Sem motivo informado"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => void removeBlock(block)} aria-label="Remover bloqueio"><X className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
        <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar cliente, telefone ou placa..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {statuses.map((status) => <button key={status.value} type="button" onClick={() => setFilter(status.value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${filter === status.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}>{status.label}</button>)}
            <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Atualizar"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[70px_1fr] border-b bg-muted/20">
              <div className="border-r p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hora</div>
              <div className="p-3 text-sm font-semibold">{filtered.length} atendimento(s)</div>
            </div>
            {hours.map((minute) => {
              const hour = Math.floor(minute / 60);
              const mins = minute % 60;
              const key = `${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
              const atTime = filtered.filter((item) => item.appointment_time.slice(0, 5) === key);
              return (
                <div key={key} className="grid min-h-[64px] grid-cols-[70px_1fr] border-b last:border-b-0">
                  <div className="border-r px-3 py-3 text-xs font-medium text-muted-foreground">{key}</div>
                  <div className="relative p-2">
                    {atTime.length === 0 ? <div className="h-10 border-t border-dashed border-border/50" /> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{atTime.map((item) => <AppointmentCard key={item.id} item={item} onStatus={changeStatus} onCancel={cancel} onWhatsApp={whatsapp} />)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="divide-y lg:hidden">
          {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Carregando agenda...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum agendamento neste dia.</div> : filtered.map((item) => <div key={item.id} className="p-3"><AppointmentCard item={item} onStatus={changeStatus} onCancel={cancel} onWhatsApp={whatsapp} /></div>)}
        </div>
      </Card>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Agenda presencial e agenda externa usam os mesmos horários, serviços e clientes.</span>
        {bookingSlug && <Link className="font-semibold text-primary" to={"/agendar/" + bookingSlug}>Abrir agenda do cliente</Link>}
      </div>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bloquear agenda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 text-sm">
              <p className="font-semibold">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
              <p className="mt-1 text-xs text-muted-foreground">O bloqueio vale somente para esta data.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setBlockMode("time")} className={`rounded-xl border p-3 text-sm font-semibold ${blockMode === "time" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Horário</button>
              <button type="button" onClick={() => setBlockMode("day")} className={`rounded-xl border p-3 text-sm font-semibold ${blockMode === "day" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Dia inteiro</button>
            </div>
            {blockMode === "time" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input className="mt-2" type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} /></div>
                <div><Label>Fim</Label><Input className="mt-2" type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} /></div>
              </div>
            )}
            <div><Label>Motivo</Label><Input className="mt-2" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex.: imprevisto, manutenção, almoço..." /></div>
            <Button className="w-full" onClick={() => void saveBlock()} disabled={savingBlock}>{savingBlock ? "Bloqueando..." : blockMode === "day" ? "Bloquear dia" : "Bloquear horário"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Label>Nome do cliente *</Label>
                <Input
                  className="mt-2"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearSelectedCustomer(); }}
                  placeholder="Digite o nome do cliente"
                  autoComplete="off"
                />
                {customerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-background shadow-lg">
                    {customerSuggestions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void selectCustomer(customer)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{customer.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{customer.phone || "Sem WhatsApp cadastrado"}</span>
                        </span>
                        <UserRound className="h-4 w-4 shrink-0 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div><Label>WhatsApp *</Label><Input className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(48) 99999-9999" /></div>
            </div>
            {selectedCustomerId && customerVehicles.length > 1 && (
              <div>
                <Label>Veículo do cliente</Label>
                <select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedVehicleId} onChange={(e) => selectVehicle(e.target.value)}>
                  <option value="">Selecione o veículo</option>
                  {customerVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {[vehicle.plate, vehicle.brand, vehicle.model].filter(Boolean).join(" · ") || "Veículo sem identificação"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Veículo</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">{["Hatch", "Sedan", "SUV/Picape"].map((value) => <button key={value} type="button" onClick={() => setVehicleCategory(value)} className={`rounded-xl border p-3 text-sm font-semibold ${vehicleCategory === value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{value}</button>)}</div>
            </div>
            <div>
              <Label>Serviços *</Label>
              <div className="mt-2 grid gap-2">{compatible.length === 0 ? <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum serviço ativo disponível para este tipo de veículo.</div> : compatible.map((service) => <label key={service.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${serviceIds.includes(service.id) ? "border-primary bg-primary/10" : "border-border"}`}><input type="checkbox" checked={serviceIds.includes(service.id)} onChange={() => setServiceIds((current) => current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id])} /><span className="flex-1 text-sm font-medium">{service.name}</span><span className="text-xs text-muted-foreground">{service.estimated_duration ?? 60} min · {money(Number(service.price))}</span></label>)}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="mt-2 h-10 w-full justify-start rounded-md px-3 font-normal">
                      <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                      {new Date((date < today() ? today() : date) + "T12:00:00").toLocaleDateString("pt-BR")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date((date < today() ? today() : date) + "T12:00:00")}
                      onSelect={(selected) => {
                        if (!selected) return;
                        const selectedDate = selected.toLocaleDateString("en-CA");
                        if (selectedDate < today()) return;
                        setDate(selectedDate);
                      }}
                      locale={ptBR}
                      disabled={isUnavailableDate}
                      hidden={{ before: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div><Label>Horário *</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={time} onChange={(e) => setTime(e.target.value)} disabled={!serviceIds.length}><option value="">Selecione um horário</option>{slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-semibold">Dados do veículo</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"><div><Label>Placa</Label><Input className="mt-2" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} /></div><div><Label>Marca</Label><Input className="mt-2" value={brand} onChange={(e) => setBrand(e.target.value)} /></div><div><Label>Modelo</Label><Input className="mt-2" value={model} onChange={(e) => setModel(e.target.value)} /></div></div>
            </div>
            <div><Label>Observações</Label><Textarea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="rounded-xl bg-primary/5 p-4 text-sm"><span className="text-muted-foreground">{serviceIds.length} serviço(s) · </span><strong>{money(serviceIds.reduce((sum, id) => sum + Number(services.find((service) => service.id === id)?.price ?? 0), 0))}</strong></div>
            <Button className="w-full" onClick={() => void save()} disabled={saving}>{saving ? "Salvando..." : "Confirmar agendamento"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppointmentCard({ item, onStatus, onCancel, onWhatsApp }: { item: Appointment; onStatus: (item: Appointment) => void; onCancel: (item: Appointment) => void; onWhatsApp: (item: Appointment) => void }) {
  const status = {
    pending: ["Aguardando", "bg-amber-500/10 text-amber-700"],
    confirmed: ["Em atendimento", "bg-blue-500/10 text-blue-700"],
    completed: ["Pronto", "bg-emerald-500/10 text-emerald-700"],
    delivered: ["Finalizado", "bg-muted text-muted-foreground"],
  }[item.status] ?? ["Cancelado", "bg-muted text-muted-foreground"];
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><UserRound className="h-4 w-4 shrink-0 text-primary" /><p className="truncate font-semibold">{item.customer_name}</p></div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.services.map((service) => service.name).join(" + ") || "Serviço"} · {item.total_duration} min</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.vehicle_plate || "Sem placa"} · {item.source === "online" ? "Online" : "Manual"}</p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${status[1]}">{status[0]}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-bold"><Clock3 className="h-3.5 w-3.5 text-primary" />{item.appointment_time.slice(0, 5)} · {money(item.total_price)}</span>
        <div className="flex gap-1">
          {item.customer_phone && <Button size="icon" variant="ghost" onClick={() => onWhatsApp(item)} aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>}
          {item.status !== "delivered" && <Button size="sm" variant="outline" onClick={() => onStatus(item)}>{item.status === "pending" ? "Iniciar" : item.status === "confirmed" ? "Pronto" : "Finalizar"}</Button>}
          {item.status === "pending" && <Button size="icon" variant="ghost" onClick={() => onCancel(item)} aria-label="Cancelar"><X className="h-4 w-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <Card className="rounded-2xl border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>;
}
