import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, DollarSign, Eye, EyeOff, Plus, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  component: DashboardPage,
});

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

const localIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function DashboardPage() {
  const initialDate = localIsoDate();
  const [companyId, setCompanyId] = useState("");
  const [periodMode, setPeriodMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [periodStart, setPeriodStart] = useState(initialDate);
  const [periodEnd, setPeriodEnd] = useState(initialDate);
  const [showTodayRevenue, setShowTodayRevenue] = useState(false);
  const [selectedRevenueDate, setSelectedRevenueDate] = useState(initialDate);
  const [showRevenueDatePicker, setShowRevenueDatePicker] = useState(false);
  const [items, setItems] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const id = companyId || await getCurrentCompanyId();
      setCompanyId(id);
      const orderedDates = [periodStart, selectedRevenueDate, periodEnd].sort();
      const start = orderedDates[0];
      const end = orderedDates[orderedDates.length - 1];

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

  useEffect(() => { void load(); }, [periodStart, periodEnd, selectedRevenueDate]);

  const finished = items.filter((item) => item.status === "completed" || item.status === "delivered");
  const projected = items.reduce((sum, item) => sum + item.total_price, 0);
  const billed = finished.reduce((sum, item) => sum + item.total_price, 0);
  const online = items.filter((item) => item.source === "online").length;

  const today = localIsoDate();
  const todayItems = items.filter((item) => item.appointment_date === today);
  const todayBilled = todayItems.filter((item) => item.status === "completed" || item.status === "delivered").reduce((sum, item) => sum + item.total_price, 0);
  const selectedRevenueItems = items.filter((item) => item.appointment_date === selectedRevenueDate);
  const selectedRevenue = selectedRevenueItems.filter((item) => item.status === "completed" || item.status === "delivered").reduce((sum, item) => sum + item.total_price, 0);
  const selectedRevenueLabel = new Date(selectedRevenueDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", "");

  const revenueData = useMemo(() => {
    const completed = items.filter((item) => item.status === "completed" || item.status === "delivered");
    const start = new Date(periodStart + "T12:00:00");
    const end = new Date(periodEnd + "T12:00:00");
    const points: { key: string; label: string; revenue: number }[] = [];

    if (periodMode === "daily") {
      for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const date = localIsoDate(cursor);
        points.push({
          key: date,
          label: cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          revenue: completed.filter((item) => item.appointment_date === date).reduce((sum, item) => sum + item.total_price, 0),
        });
      }
    } else if (periodMode === "weekly") {
      for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
        const chunkStart = new Date(cursor);
        const chunkEnd = new Date(cursor);
        chunkEnd.setDate(chunkEnd.getDate() + 6);
        if (chunkEnd > end) chunkEnd.setTime(end.getTime());
        const chunkStartIso = localIsoDate(chunkStart);
        const chunkEndIso = localIsoDate(chunkEnd);
        points.push({
          key: chunkStartIso,
          label: chunkStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          revenue: completed.filter((item) => item.appointment_date >= chunkStartIso && item.appointment_date <= chunkEndIso).reduce((sum, item) => sum + item.total_price, 0),
        });
      }
    } else {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12);
      while (cursor <= end) {
        const monthStart = new Date(cursor);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12);
        const from = monthStart < start ? start : monthStart;
        const to = monthEnd > end ? end : monthEnd;
        const fromIso = localIsoDate(from);
        const toIso = localIsoDate(to);
        points.push({
          key: fromIso,
          label: cursor.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          revenue: completed.filter((item) => item.appointment_date >= fromIso && item.appointment_date <= toIso).reduce((sum, item) => sum + item.total_price, 0),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    return points;
  }, [items, periodMode, periodStart, periodEnd]);

  const maxRevenue = Math.max(1, ...revenueData.map((point) => point.revenue));
  const serviceRanking = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const item of items) {
      const name = item.customer_name ? "Atendimento" : "Serviço";
      const current = map.get(name) ?? { count: 0, value: 0 };
      current.count += 1; current.value += item.total_price; map.set(name, current);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, ...value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [items]);

  const applyPeriodMode = (mode: "daily" | "weekly" | "monthly") => {
    const anchor = new Date(periodStart + "T12:00:00");
    if (mode === "daily") {
      setPeriodStart(localIsoDate(anchor));
      setPeriodEnd(localIsoDate(anchor));
    } else if (mode === "weekly") {
      const weekStart = new Date(anchor);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      setPeriodStart(localIsoDate(weekStart));
      setPeriodEnd(localIsoDate(weekEnd));
    } else {
      const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
      const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
      setPeriodStart(localIsoDate(monthStart));
      setPeriodEnd(localIsoDate(monthEnd));
    }
    setPeriodMode(mode);
  };

  const periodLabel = periodStart === periodEnd
    ? new Date(periodStart + "T12:00:00").toLocaleDateString("pt-BR")
    : new Date(periodStart + "T12:00:00").toLocaleDateString("pt-BR") + " — " + new Date(periodEnd + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-6 sm:space-y-6 sm:pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><TrendingUp className="h-4 w-4" />Visão financeira</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1><p className="text-sm text-muted-foreground">Acompanhe faturamento, agenda e crescimento em um só lugar.</p></div>
        <Button asChild><Link to="/agenda"><Plus className="mr-2 h-4 w-4" />Agendar</Link></Button>
      </header>
      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Faturamento realizado" value={loading ? "—" : money(billed)} helper={finished.length + " atendimento(s) finalizado(s)"} />
        <Kpi icon={TrendingUp} label="Faturamento previsto" value={loading ? "—" : money(projected)} helper={items.length + " agendamento(s) no mês"} />
        <Kpi icon={CalendarDays} label="Hoje" value={loading ? "—" : String(todayItems.length)} helper={money(todayBilled) + " realizado hoje"} />
        <Kpi icon={Users} label="Clientes" value={loading ? "—" : String(customers)} helper={online + " agendamento(s) online no mês"} />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card className="min-w-0 w-full overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <CardContent className="min-w-0 p-4 sm:p-5">
            <div className="rounded-2xl border bg-muted/30 p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex rounded-xl border bg-background p-1">
                  {(["daily", "weekly", "monthly"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => applyPeriodMode(mode)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${periodMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {mode === "daily" ? "Diário" : mode === "weekly" ? "Semanal" : "Mensal"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-medium text-muted-foreground">De<input type="date" value={periodStart} max={periodEnd} onChange={(event) => setPeriodStart(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-xs font-semibold text-foreground" /></label>
                  <label className="text-[11px] font-medium text-muted-foreground">Até<input type="date" value={periodEnd} min={periodStart} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-xs font-semibold text-foreground" /></label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-primary p-4 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wider opacity-75">Receita de hoje</p><button type="button" onClick={() => setShowTodayRevenue((visible) => !visible)} className="rounded-md p-1 opacity-80 transition hover:bg-primary-foreground/10 hover:opacity-100" aria-label={showTodayRevenue ? "Ocultar receita de hoje" : "Exibir receita de hoje"} title={showTodayRevenue ? "Ocultar receita" : "Exibir receita"}>{showTodayRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="mt-1 text-3xl font-black tracking-tight">{showTodayRevenue ? money(todayBilled) : "R$ •••••"}</p><p className="mt-1 text-xs opacity-75">{todayItems.length} atendimento(s) hoje</p></div>
              <div className="relative">
                <button type="button" onClick={() => setShowRevenueDatePicker((open) => !open)} className="w-full rounded-xl bg-primary-foreground/10 px-3 py-2 text-left transition hover:bg-primary-foreground/15 sm:text-right" aria-expanded={showRevenueDatePicker}>
                  <p className="text-[11px] opacity-75">Período analisado</p><p className="text-sm font-bold">{periodLabel}</p><p className="mt-1 text-[10px] opacity-70">Clique para ver outra data</p>
                </button>
                {showRevenueDatePicker && <div className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background p-3 text-foreground shadow-xl">
                  <p className="mb-2 text-xs font-semibold">Faturamento por data</p>
                  <input type="date" value={selectedRevenueDate} onChange={(event) => { setSelectedRevenueDate(event.target.value); setShowRevenueDatePicker(false); }} className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-semibold" />
                  <div className="mt-3 rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{selectedRevenueLabel}</p><p className="mt-1 text-lg font-black">{showTodayRevenue || selectedRevenueDate === today ? money(selectedRevenue) : "R$ •••••"}</p><p className="text-[10px] text-muted-foreground">{selectedRevenueItems.length} atendimento(s)</p></div>
                </div>}
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div><h2 className="font-bold">Faturamento {periodMode === "daily" ? "diário" : periodMode === "weekly" ? "semanal" : "mensal"}</h2><p className="text-xs text-muted-foreground">Somente atendimentos concluídos</p></div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{money(billed)}</span>
            </div>
            <div className="mt-4 grid h-60 min-w-0 items-end gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(revenueData.length, 1)}, minmax(0, 1fr))` }}>
              {revenueData.map((point) => (
                <div key={point.key} className="group flex h-full min-w-0 flex-col justify-end">
                  <div className="mb-2 text-center text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{money(point.revenue)}</div>
                  <div className="relative min-h-0 flex-1 rounded-t-xl bg-muted/50"><div className="absolute bottom-0 left-1 right-1 rounded-t-lg bg-primary/75 transition-all group-hover:bg-primary" style={{ height: Math.max(point.revenue ? 8 : 2, (point.revenue / maxRevenue) * 100) + "%" }} title={point.label + " · " + money(point.revenue)} /></div>
                  <span className="mt-2 truncate text-center text-[10px] font-medium text-muted-foreground">{point.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 w-full overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <CardContent className="min-w-0 p-4 sm:p-5">
            <div className="mb-5"><h2 className="font-bold">Resumo do negócio</h2><p className="text-xs text-muted-foreground">Indicadores atuais</p></div>
            <div className="min-w-0 space-y-4">
              <Line label="Serviços ativos" value={String(servicesCount)} />
              <Line label="Clientes cadastrados" value={String(customers)} />
              <Line label="Agendamentos online" value={String(online)} />
              <Line label="Ticket médio realizado" value={finished.length ? money(billed / finished.length) : money(0)} />
            </div>
            <Button variant="outline" className="mt-6 w-full" asChild><Link to="/configuracoes">Configurar agenda pública</Link></Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-2xl border-border/60"><CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Próximos atendimentos</h2><p className="text-xs text-muted-foreground">A partir de hoje</p></div><Button variant="ghost" size="sm" asChild><Link to="/agenda">Ver agenda</Link></Button></div>
          <div className="divide-y">{items.filter((item) => item.appointment_date >= today).slice(0, 6).map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><div className="w-14 rounded-xl bg-muted p-2 text-center"><p className="text-xs font-bold">{item.appointment_time.slice(0, 5)}</p><p className="text-[9px] text-muted-foreground">{new Date(item.appointment_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.customer_name}</p><p className="text-xs text-muted-foreground">{item.source === "online" ? "Agenda online" : "Agendamento interno"}</p></div><span className="font-semibold">{money(item.total_price)}</span></div>)}</div>
          {items.filter((item) => item.appointment_date >= today).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum próximo atendimento.</p>}
        </CardContent></Card>
        <Card className="rounded-2xl border-border/60"><CardContent className="p-5">
          <div className="mb-4"><h2 className="font-bold">Leitura rápida</h2><p className="text-xs text-muted-foreground">Pontos para acompanhar</p></div>
          <div className="space-y-3"><Insight icon={Clock3} text={items.length + " agendamentos registrados no período."} /><Insight icon={Users} text={online + " clientes chegaram pela agenda externa."} /><Insight icon={DollarSign} text={"Ticket médio de " + money(finished.length ? billed / finished.length : 0) + " nos atendimentos concluídos."} /></div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, helper }: { icon: typeof DollarSign; label: string; value: string; helper: string }) {
  return <Card className="rounded-2xl border-border/60 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>; }
function Insight({ icon: Icon, text }: { icon: typeof DollarSign; text: string }) { return <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm"><Icon className="h-4 w-4 shrink-0 text-primary" /><span>{text}</span></div>; }
