import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, DollarSign, Plus, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

type Appointment = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  total_price: number;
  source: string;
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iso = (date: Date) => date.toLocaleDateString("en-CA");

function DashboardPage() {
  const [companyId, setCompanyId] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("en-CA").slice(0, 7);
  });
  const [items, setItems] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const start = month + "-01";
      const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0);
      const end = iso(endDate);

      const [appointments, customerResult, serviceResult] = await Promise.all([
        supabase.from("appointments").select("id,customer_id,customer_name,appointment_date,appointment_time,status,total_price,source").eq("company_id", id).gte("appointment_date", start).lte("appointment_date", end).neq("status", "cancelled").order("appointment_date").order("appointment_time"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("company_id", id).eq("active", true),
      ]);
      if (appointments.error) throw appointments.error;
      if (customerResult.error) throw customerResult.error;
      if (serviceResult.error) throw serviceResult.error;
      setItems((appointments.data ?? []).map((item) => ({ ...item, total_price: Number(item.total_price ?? 0) })));
      setCustomers(customerResult.count ?? 0);
      setServicesCount(serviceResult.count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [month]);

  const finished = items.filter((item) => item.status === "completed" || item.status === "delivered");
  const projected = items.reduce((sum, item) => sum + item.total_price, 0);
  const billed = finished.reduce((sum, item) => sum + item.total_price, 0);
  const online = items.filter((item) => item.source === "online").length;

  const today = iso(new Date());
  const todayItems = items.filter((item) => item.appointment_date === today);
  const todayBilled = todayItems.filter((item) => item.status === "completed" || item.status === "delivered").reduce((sum, item) => sum + item.total_price, 0);

  const days = useMemo(() => {
    const year = Number(month.slice(0, 4));
    const monthNumber = Number(month.slice(5, 7));
    const count = new Date(year, monthNumber, 0).getDate();
    return Array.from({ length: count }, (_, index) => {
      const date = iso(new Date(year, monthNumber - 1, index + 1));
      const revenue = items.filter((item) => item.appointment_date === date && (item.status === "completed" || item.status === "delivered")).reduce((sum, item) => sum + item.total_price, 0);
      return { date, day: index + 1, revenue };
    });
  }, [items, month]);

  const maxDay = Math.max(1, ...days.map((day) => day.revenue));

  const moveMonth = (offset: number) => {
    const [year = new Date().getFullYear(), monthNumber = new Date().getMonth() + 1] = month.split("-").map(Number);
    const next = new Date(year, monthNumber - 1 + offset, 1);
    setMonth(iso(next).slice(0, 7));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-6 sm:space-y-6 sm:pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><TrendingUp className="h-4 w-4" />Visão financeira</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1><p className="text-sm text-muted-foreground">Acompanhe faturamento, agenda e crescimento em um só lugar.</p></div>
        <div className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] gap-2 sm:flex sm:w-auto"><Button variant="outline" size="icon" className="w-full sm:w-10" onClick={() => moveMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button><div className="flex h-10 min-w-0 items-center justify-center rounded-xl border bg-background px-2 text-xs font-semibold capitalize sm:px-3 sm:text-sm">{new Date(month + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div><Button variant="outline" size="icon" className="w-full sm:w-10" onClick={() => moveMonth(1)}><ChevronRight className="h-4 w-4" /></Button><Button asChild className="col-span-3 sm:col-span-1"><Link to="/agenda"><Plus className="mr-2 h-4 w-4" />Agendar</Link></Button></div>
      </header>

      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Faturamento realizado" value={loading ? "—" : money(billed)} helper={finished.length + " atendimento(s) finalizado(s)"} />
        <Kpi icon={TrendingUp} label="Faturamento previsto" value={loading ? "—" : money(projected)} helper={items.length + " agendamento(s) no mês"} />
        <Kpi icon={CalendarDays} label="Hoje" value={loading ? "—" : String(todayItems.length)} helper={money(todayBilled) + " realizado hoje"} />
        <Kpi icon={Users} label="Clientes" value={loading ? "—" : String(customers)} helper={online + " agendamento(s) online no mês"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold sm:text-lg">Faturamento por dia</h2><p className="text-xs text-muted-foreground">Atendimentos concluídos no mês</p></div><span className="hidden shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">{money(billed)}</span></div>
            <div className="mb-4 grid grid-cols-3 gap-2 sm:hidden">
              <div className="rounded-xl bg-muted/50 p-2.5"><p className="text-[10px] text-muted-foreground">Realizado</p><p className="mt-1 text-sm font-bold">{money(billed)}</p></div>
              <div className="rounded-xl bg-muted/50 p-2.5"><p className="text-[10px] text-muted-foreground">Média/dia</p><p className="mt-1 text-sm font-bold">{money(days.length ? billed / days.length : 0)}</p></div>
              <div className="rounded-xl bg-muted/50 p-2.5"><p className="text-[10px] text-muted-foreground">Melhor dia</p><p className="mt-1 text-sm font-bold">{money(Math.max(...days.map((d) => d.revenue), 0))}</p></div>
            </div>
            <div className="relative h-56 overflow-x-auto pb-1 sm:h-64 sm:overflow-visible">
              <div className="flex h-full min-w-[560px] items-end gap-1 px-1 sm:min-w-0 sm:gap-1.5">
                {days.map((day) => <div key={day.date} className="group flex h-full min-w-[15px] flex-1 flex-col justify-end">
                  <div className="relative flex-1">
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary/65 transition-all duration-200 group-hover:bg-primary" style={{ height: Math.max(day.revenue ? 6 : 1, (day.revenue / maxDay) * 100) + "%" }} title={day.day + " · " + money(day.revenue)} />
                  </div>
                  <span className="mt-2 text-center text-[9px] font-medium text-muted-foreground">{day.day}</span>
                </div>)}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground sm:hidden"><span>← deslize para ver os dias</span><span>{days.length} dias</span></div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4"><h2 className="text-base font-bold sm:text-lg">Resumo do negócio</h2><p className="text-xs text-muted-foreground">Indicadores atuais</p></div>
            <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-4">
              <MiniMetric label="Serviços ativos" value={String(servicesCount)} />
              <MiniMetric label="Clientes" value={String(customers)} />
              <MiniMetric label="Online no mês" value={String(online)} />
              <MiniMetric label="Ticket médio" value={finished.length ? money(billed / finished.length) : money(0)} />
            </div>
            <div className="mt-4 rounded-xl bg-primary/5 p-3 sm:mt-6">
              <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Conversão em atendimentos</span><strong className="text-sm">{items.length ? Math.round((finished.length / items.length) * 100) : 0}%</strong></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: (items.length ? Math.round((finished.length / items.length) * 100) : 0) + "%" }} /></div>
            </div>
            <Button variant="outline" className="mt-4 h-10 w-full" asChild><Link to="/configuracoes">Configurar agenda pública</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Próximos atendimentos</h2><p className="text-xs text-muted-foreground">A partir de hoje</p></div><Button variant="ghost" size="sm" asChild><Link to="/agenda">Ver agenda</Link></Button></div>
            <div className="divide-y">{items.filter((item) => item.appointment_date >= today).slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><div className="w-14 rounded-xl bg-muted p-2 text-center"><p className="text-xs font-bold">{item.appointment_time.slice(0, 5)}</p><p className="text-[9px] text-muted-foreground">{new Date(item.appointment_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.customer_name}</p><p className="text-xs text-muted-foreground">{item.source === "online" ? "Agenda online" : "Agendamento interno"}</p></div><span className="font-semibold">{money(item.total_price)}</span></div>)}</div>
            {items.filter((item) => item.appointment_date >= today).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum próximo atendimento.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-5">
            <div className="mb-4"><h2 className="font-bold">Leitura rápida</h2><p className="text-xs text-muted-foreground">Pontos para acompanhar</p></div>
            <div className="space-y-3">
              <Insight icon={Clock3} text={items.length + " agendamentos registrados no período."} />
              <Insight icon={Users} text={online + " clientes chegaram pela agenda externa."} />
              <Insight icon={DollarSign} text={"Ticket médio de " + money(finished.length ? billed / finished.length : 0) + " nos atendimentos concluídos."} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, helper }: { icon: typeof DollarSign; label: string; value: string; helper: string }) {
  return <Card className="rounded-2xl border-border/60 shadow-sm"><CardContent className="h-full p-3.5 sm:p-5"><div className="flex items-start justify-between gap-2"><p className="min-w-0 text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-wider">{label}</p><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div></div><p className="mt-3 break-words text-lg font-black tracking-tight sm:mt-4 sm:text-2xl">{value}</p><p className="mt-1 line-clamp-2 text-[10px] leading-tight text-muted-foreground sm:text-xs">{helper}</p></CardContent></Card>;
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"><span className="block truncate text-[10px] text-muted-foreground sm:inline sm:text-sm">{label}</span><strong className="mt-1 block text-base sm:mt-0 sm:text-inherit">{value}</strong></div>; }
function Insight({ icon: Icon, text }: { icon: typeof DollarSign; text: string }) { return <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm"><Icon className="h-4 w-4 shrink-0 text-primary" /><span>{text}</span></div>; }
