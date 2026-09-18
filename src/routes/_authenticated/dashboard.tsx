import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CarFront, CheckCircle2, Clock3, Droplets, Gauge, ListOrdered, Plus, Sparkles, Timer, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

type Service = {
  id: string;
  name: string;
  price: number;
  estimated_duration: number | null;
  category: string | null;
};

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  services: Service[];
  totalPrice: number;
  totalDuration: number;
};



const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toLocaleDateString("en-CA");

function categoryName(service: Service) {
  const raw = (service.category || service.name || "").toLowerCase();
  if (raw.includes("higien")) return "Higienização interna";
  if (raw.includes("poliment")) return "Polimento";
  if (raw.includes("detalh") || raw.includes("detail")) return "Detalhamento";
  if (raw.includes("complet")) return "Lavagem completa";
  return "Lavagem simples";
}

function statusLabel(status: string) {
  if (status === "pending") return "Na fila";
  if (status === "confirmed") return "Em lavagem";
  if (status === "completed") return "Pronto";
  return "Cancelado";
}

function statusClass(status: string) {
  if (status === "pending") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "confirmed") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (status === "completed") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return "bg-muted text-muted-foreground";
}

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("LavaPro");
  const [maxCapacity, setMaxCapacity] = useState(2);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const enrich = async (rows: any[]) => {
    if (!rows.length) return [] as Appointment[];

    const ids = rows.map((r) => r.id);
    const { data: links, error: linksError } = await (supabase as any)
      .from("appointment_services")
      .select("appointment_id,service_id,price,duration_minutes")
      .in("appointment_id", ids);
    if (linksError) throw linksError;

    const serviceIds = Array.from(new Set<string>((links ?? []).map((x: { service_id: string }) => x.service_id)));
    const { data: services, error: servicesError } = serviceIds.length
      ? await supabase.from("services").select("id,name,price,estimated_duration,category").in("id", serviceIds)
      : { data: [], error: null };
    if (servicesError) throw servicesError;

    const serviceMap = new Map((services ?? []).map((s) => [s.id, s as Service]));
    const linkMap = new Map<string, any[]>();

    for (const link of links ?? []) {
      linkMap.set(link.appointment_id, [...(linkMap.get(link.appointment_id) ?? []), link]);
    }

    return rows.map((row) => {
      const linked = linkMap.get(row.id) ?? [];
      const fallback = row.service as Service | null;
      const rowServices = linked.map((x) => serviceMap.get(x.service_id)).filter(Boolean) as Service[];

      return {
        ...row,
        services: rowServices.length ? rowServices : fallback ? [fallback] : [],
        totalPrice: linked.length ? linked.reduce((sum, x) => sum + Number(x.price), 0) : Number(fallback?.price ?? 0),
        totalDuration: linked.length
          ? linked.reduce((sum, x) => sum + Number(x.duration_minutes ?? 60), 0)
          : Number(fallback?.estimated_duration ?? 60),
      };
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const companyId = await getCurrentCompanyId();
      const company = await supabase.from("companies").select("name,simultaneous_capacity").eq("id", companyId).maybeSingle();
      if (!company.error) { if (company.data?.name) setCompanyName(company.data.name); setMaxCapacity(Math.max(1, Number(company.data?.simultaneous_capacity ?? 2))); }

      const { data, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id,customer_name,customer_phone,appointment_date,appointment_time,status,created_at,updated_at,service:services(id,name,price,estimated_duration,category)")
        .eq("company_id", companyId)
        .eq("appointment_date", selectedDate)
        .neq("status", "cancelled")
        .order("appointment_time");

      if (appointmentsError) throw appointmentsError;

      setAppointments(await enrich(data ?? []));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a operação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(interval);
  }, [selectedDate]);

  const queue = appointments.filter((a) => a.status === "pending");
  const washing = appointments.filter((a) => a.status === "confirmed");
  const ready = appointments.filter((a) => a.status === "completed");
  const patio = [...queue, ...washing, ...ready];

  const capacity = Math.min(100, Math.round((patio.length / maxCapacity) * 100));

  const averageService = useMemo(() => {
    if (!appointments.length) return 0;
    return Math.round(appointments.reduce((sum, a) => sum + a.totalDuration, 0) / appointments.length);
  }, [appointments]);

  const averageWait = useMemo(() => {
    const now = Date.now();
    const active = [...queue, ...washing];
    if (!active.length) return 0;

    const minutes = active.map((a) => {
      const scheduled = new Date(a.appointment_date + "T" + a.appointment_time).getTime();
      return Math.max(0, Math.round((now - scheduled) / 60000));
    });

    return Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length);
  }, [queue, washing, lastUpdated]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const appointment of appointments) {
      const seen = new Set<string>();
      for (const service of appointment.services) {
        const category = categoryName(service);
        if (!seen.has(category)) {
          map.set(category, (map.get(category) ?? 0) + 1);
          seen.add(category);
        }
      }
    }
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, percent: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [appointments]);

  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const advanceStatus = async (appointment: Appointment) => {
    const next = appointment.status === "pending" ? "confirmed" : appointment.status === "confirmed" ? "completed" : null;
    if (!next) return;

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", appointment.id);

    if (updateError) setError(updateError.message);
    else void load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-4 w-4" />
            Operação & Pátio
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{companyName}</h1>
          <p className="text-sm capitalize text-muted-foreground">{displayDate} · atualização automática a cada 15s</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            aria-label="Escolher data"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary"
          />
          <Button asChild className="rounded-xl">
            <Link to="/agenda">
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Link>
          </Button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Pátio agora</h2>
            <p className="text-sm text-muted-foreground">Visão operacional dos veículos do dia</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {patio.length}/{maxCapacity} veículos
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <OperationalCard icon={ListOrdered} label="Fila de espera" value={queue.length} helper="aguardando início" className="border-amber-500/20" />
          <OperationalCard icon={Droplets} label="Em lavagem" value={washing.length} helper="serviço em andamento" className="border-blue-500/20" />
          <OperationalCard icon={CheckCircle2} label="Prontos para retirada" value={ready.length} helper="aguardando cliente" className="border-emerald-500/20" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Capacidade de atendimento</h3>
                <p className="text-xs text-muted-foreground">Ocupação operacional do pátio</p>
              </div>
              <Gauge className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black tracking-tight">{loading ? "—" : capacity}%</span>
              <span className="text-sm text-muted-foreground">{patio.length} de {maxCapacity} vagas operacionais</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: capacity + "%" }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Metric icon={Timer} label="Espera média atual" value={loading ? "—" : averageWait + " min"} helper="atraso médio dos veículos ativos" />
          <Metric icon={Clock3} label="Tempo médio de serviço" value={loading ? "—" : averageService + " min"} helper="duração prevista dos serviços" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.35fr]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Serviços por categoria</h3>
                <p className="text-xs text-muted-foreground">Distribuição da operação</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado neste dia.</p>
            ) : (
              categories.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.count} · {item.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: item.percent + "%" }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Fluxo do pátio</h3>
                <p className="text-xs text-muted-foreground">Acompanhe e avance cada veículo</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/agenda">Abrir agenda</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Carregando operação...</div>
            ) : patio.length === 0 ? (
              <div className="p-8 text-center">
                <CarFront className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Pátio vazio</p>
                <p className="mt-1 text-xs text-muted-foreground">Nenhum veículo em operação neste dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {patio.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-14 shrink-0 rounded-xl bg-muted px-2 py-2 text-center text-sm font-bold">
                        {appointment.appointment_time.slice(0, 5)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{appointment.customer_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.services.map((service) => service.name).join(" + ") || "Serviço"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{appointment.totalDuration} min previstos</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={"rounded-full px-3 py-1 text-xs font-semibold " + statusClass(appointment.status)}>
                        {statusLabel(appointment.status)}
                      </span>
                      {appointment.status !== "completed" && (
                        <Button size="sm" variant="outline" onClick={() => void advanceStatus(appointment)}>
                          {appointment.status === "pending" ? "Iniciar lavagem" : "Marcar como pronto"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Operação acompanhada em tempo real</span>
        <span>{lastUpdated ? "Atualizado às " + lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Atualizando..."}</span>
      </div>
    </div>
  );
}

function OperationalCard({
  icon: Icon,
  label,
  value,
  helper,
  className = "",
}: {
  icon: typeof ListOrdered;
  label: string;
  value: number;
  helper: string;
  className?: string;
}) {
  return (
    <Card className={"rounded-2xl border-2 shadow-sm " + className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-4xl font-black tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-black">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
