import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, DollarSign, MessageCircle, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  service: { name: string; price: number; estimated_duration: number | null } | null;
};

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toLocaleDateString("en-CA");
const shiftDate = (base: string, days: number) => {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};
const startOfWeek = (base: string) => {
  const d = new Date(base + "T12:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toLocaleDateString("en-CA");
};
const endOfWeek = (base: string) => shiftDate(startOfWeek(base), 6);
const startOfMonth = (base: string) => base.slice(0, 8) + "01";
const endOfMonth = (base: string) => {
  const d = new Date(base.slice(0, 8) + "01T12:00:00");
  d.setMonth(d.getMonth() + 1, 0);
  return d.toLocaleDateString("en-CA");
};

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [periodAppointments, setPeriodAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const period = useMemo(() => ({
    weekStart: startOfWeek(selectedDate),
    weekEnd: endOfWeek(selectedDate),
    monthStart: startOfMonth(selectedDate),
    monthEnd: endOfMonth(selectedDate),
  }), [selectedDate]);

  const load = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentCompanyId();
      const { data, error: queryError } = await supabase
        .from("appointments")
        .select("id,customer_name,customer_id,customer_phone,appointment_date,appointment_time,status,service:services(name,price,estimated_duration)")
        .eq("company_id", companyId)
        .eq("appointment_date", selectedDate)
        .order("appointment_time");
      if (queryError) throw queryError;

      const { data: periodData, error: periodError } = await supabase
        .from("appointments")
        .select("id,customer_name,customer_phone,appointment_date,appointment_time,status,service:services(name,price,estimated_duration)")
        .eq("company_id", companyId)
        .gte("appointment_date", period.weekStart)
        .lte("appointment_date", period.monthEnd)
        .order("appointment_date")
        .order("appointment_time");
      if (periodError) throw periodError;

      const { data: futureData, error: futureError } = await supabase
        .from("appointments")
        .select("id,customer_name,customer_phone,appointment_date,appointment_time,status,service:services(name,price,estimated_duration)")
        .eq("company_id", companyId)
        .gt("appointment_date", today())
        .neq("status", "cancelled")
        .order("appointment_date")
        .order("appointment_time")
        .limit(5);
      if (futureError) throw futureError;

      setAppointments((data ?? []) as unknown as Appointment[]);
      setPeriodAppointments((periodData ?? []) as unknown as Appointment[]);
      setUpcoming((futureData ?? []) as unknown as Appointment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [selectedDate, period.weekStart, period.monthEnd]);

  const customers = new Set(appointments.map((a) => a.customer_name.trim().toLowerCase())).size;
  const revenue = appointments.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
  const weekAppointments = periodAppointments.filter((a) => a.appointment_date >= period.weekStart && a.appointment_date <= period.weekEnd);
  const monthAppointments = periodAppointments;
  const weekRevenue = weekAppointments.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
  const monthRevenue = monthAppointments.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);

  const shareReadyOnWhatsApp = (a: Appointment) => {
    const phone = (a.customer_phone ?? "").replace(/\\D/g, "");
    if (!phone) {
      setError("Este cliente não possui um WhatsApp cadastrado.");
      return;
    }
    const message = encodeURIComponent(\`Olá, \${a.customer_name}! 🚗✨ Seu veículo está pronto e o serviço foi concluído. Pode passar para fazer a retirada. Obrigado por escolher a LavaPro!\`);
    window.open(\`https://wa.me/55\${phone}?text=\${message}\`, "_blank", "noopener,noreferrer");
  };

  const deleteCompleted = async (a: Appointment) => {
    if (a.status !== "completed") return;
    const confirmed = window.confirm(\`Excluir o agendamento concluído de \${a.customer_name}? Essa ação remove o registro da agenda.\`);
    if (!confirmed) return;
    try {
      setError("");
      const { error: deleteError } = await supabase.from("appointments").delete().eq("id", a.id);
      if (deleteError) throw deleteError;
      setAppointments((current) => current.filter((item) => item.id !== a.id));
      setPeriodAppointments((current) => current.filter((item) => item.id !== a.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o agendamento.");
    }
  };

  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15">Visão geral</div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground capitalize">{displayDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDate(today())}>Hoje</Button>
          <Button type="button" variant={selectedDate === shiftDate(today(), 1) ? "default" : "outline"} size="sm" onClick={() => setSelectedDate(shiftDate(today(), 1))}>Amanhã</Button>
          <input aria-label="Escolher outro dia" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" />
          <Button asChild><Link to="/agenda"><Plus className="mr-2 h-4 w-4" />Novo agendamento</Link></Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={CalendarDays} label={\`Agendamentos · \${selectedDate === today() ? "hoje" : "dia"}\`} value={loading ? "—" : String(appointments.length)} />
        <Metric icon={Users} label="Clientes no dia" value={loading ? "—" : String(customers)} />
        <Metric icon={DollarSign} label="Faturamento do dia" value={loading ? "—" : money(revenue)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PeriodCard label="Esta semana" value={loading ? "—" : \`\${weekAppointments.length} agendamentos\`} detail={loading ? "" : money(weekRevenue)} onClick={() => setSelectedDate(period.weekStart)} />
        <PeriodCard label="Este mês" value={loading ? "—" : \`\${monthAppointments.length} agendamentos\`} detail={loading ? "" : money(monthRevenue)} onClick={() => setSelectedDate(period.monthStart)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><h3 className="font-semibold">Agenda do dia</h3><p className="text-sm text-muted-foreground">Altere a data acima para consultar outro dia.</p></div>
            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Carregando...</div> :
            appointments.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento para este dia.</div> :
            <div className="divide-y">{appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="min-w-14 rounded-lg bg-muted px-2 py-1 text-center text-sm font-bold">{a.appointment_time.slice(0, 5)}</span>
                  <div className="min-w-0"><p className="truncate font-medium">{a.customer_name}</p><p className="text-xs text-muted-foreground">{a.service?.name ?? "Serviço"} · {a.service?.estimated_duration ?? 60} min</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={\`rounded-full px-2.5 py-1 text-xs \${a.status === "completed" ? "bg-green-100 text-green-700" : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}\`}>{a.status === "completed" ? "Concluído" : a.status === "cancelled" ? "Cancelado" : "Agendado"}</span>
                  <span className="hidden font-semibold sm:block">{money(Number(a.service?.price ?? 0))}</span>
                  {a.status === "completed" && (
                    <>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" onClick={() => shareReadyOnWhatsApp(a)} title={a.customer_phone ? "Avisar cliente pelo WhatsApp" : "Cliente sem WhatsApp cadastrado"}><MessageCircle className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void deleteCompleted(a)} title="Excluir serviço concluído"><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </div>
            ))}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="font-semibold">Próximos agendamentos</h3><p className="text-sm text-muted-foreground">Feitos pela agenda interna ou pelo link público.</p></div>
            <Button variant="outline" size="sm" asChild><Link to="/agenda">Ver agenda completa</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-sm text-muted-foreground">Carregando...</div> :
            upcoming.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento futuro.</div> :
            <div className="divide-y">{upcoming.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-primary/10 px-3 py-2 text-center"><p className="text-xs font-semibold text-primary">{new Date(a.appointment_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p><p className="text-sm font-bold">{a.appointment_time.slice(0, 5)}</p></div>
                  <div className="min-w-0"><p className="truncate font-medium">{a.customer_name}</p><p className="text-xs text-muted-foreground">{a.service?.name ?? "Serviço"} · {a.status === "pending" ? "Pendente" : "Confirmado"}</p></div>
                </div>
                <Button variant="outline" size="sm" asChild><Link to="/agenda">Abrir agenda</Link></Button>
              </div>
            ))}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm shadow-black/[0.03]"><CardContent className="flex items-center gap-4 rounded-2xl p-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10"><Icon className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>;
}

function PeriodCard({ label, value, detail, onClick }: { label: string; value: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="text-left"><Card className="h-full transition-colors hover:border-primary/40"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{label}</p><span className="text-xs text-primary">Ver período</span></div><p className="mt-2 text-xl font-bold">{value}</p><p className="mt-1 text-sm text-muted-foreground">Concluído: {detail}</p></CardContent></Card></button>;
}
