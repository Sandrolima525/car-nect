import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, DollarSign, MessageCircle, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

type Service = { id: string; name: string; price: number; estimated_duration: number | null };
type Appointment = {
  id: string; customer_name: string; customer_phone: string | null; appointment_date: string;
  appointment_time: string; status: string; services: Service[]; totalPrice: number; totalDuration: number;
};

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toLocaleDateString("en-CA");
const shiftDate = (base: string, days: number) => { const d = new Date(base + "T12:00:00"); d.setDate(d.getDate() + days); return d.toLocaleDateString("en-CA"); };
const startOfWeek = (base: string) => { const d = new Date(base + "T12:00:00"); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return d.toLocaleDateString("en-CA"); };
const endOfWeek = (base: string) => shiftDate(startOfWeek(base), 6);
const startOfMonth = (base: string) => base.slice(0, 8) + "01";
const endOfMonth = (base: string) => { const d = new Date(base.slice(0, 8) + "01T12:00:00"); d.setMonth(d.getMonth() + 1, 0); return d.toLocaleDateString("en-CA"); };

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [periodAppointments, setPeriodAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [periodView, setPeriodView] = useState<"week" | "month" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("Empresa");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const period = useMemo(() => ({ weekStart: startOfWeek(selectedDate), weekEnd: endOfWeek(selectedDate), monthStart: startOfMonth(selectedDate), monthEnd: endOfMonth(selectedDate) }), [selectedDate]);

  const enrich = async (rows: any[]) => {
    if (!rows.length) return [] as Appointment[];
    const ids = rows.map(r => r.id);
    const { data: links, error: linksError } = await (supabase as any).from("appointment_services").select("appointment_id,service_id,price,duration_minutes").in("appointment_id", ids);
    if (linksError) throw linksError;
    const serviceIds = [...new Set((links ?? []).map(x => x.service_id))];
    const { data: services, error: servicesError } = serviceIds.length ? await supabase.from("services").select("id,name,price,estimated_duration").in("id", serviceIds) : { data: [], error: null };
    if (servicesError) throw servicesError;
    const serviceMap = new Map((services ?? []).map(s => [s.id, s as Service]));
    const linkMap = new Map<string, any[]>();
    for (const link of links ?? []) linkMap.set(link.appointment_id, [...(linkMap.get(link.appointment_id) ?? []), link]);
    return rows.map(row => {
      const linked = linkMap.get(row.id) ?? [];
      const fallback = row.service as Service | null;
      const rowServices = linked.map(x => serviceMap.get(x.service_id)).filter(Boolean) as Service[];
      return { ...row, services: rowServices.length ? rowServices : fallback ? [fallback] : [], totalPrice: linked.length ? linked.reduce((s,x)=>s+Number(x.price),0) : Number(fallback?.price ?? 0), totalDuration: linked.length ? linked.reduce((s,x)=>s+Number(x.duration_minutes ?? 60),0) : Number(fallback?.estimated_duration ?? 60) };
    });
  };

  const load = async () => {
    try {
      setLoading(true); setError("");
      const companyId = await getCurrentCompanyId();
      const company = await supabase.from("companies").select("name,logo_url").eq("id", companyId).maybeSingle();
      if (!company.error && company.data?.name) setCompanyName(company.data.name);
      if (!company.error) setCompanyLogo(company.data?.logo_url ?? null);
      const baseSelect = "id,customer_name,customer_phone,appointment_date,appointment_time,status,service:services(id,name,price,estimated_duration)";
      const [day, periodRows, futureRows] = await Promise.all([
        supabase.from("appointments").select(baseSelect).eq("company_id", companyId).eq("appointment_date", selectedDate).order("appointment_time"),
        supabase.from("appointments").select(baseSelect).eq("company_id", companyId).gte("appointment_date", period.weekStart).lte("appointment_date", period.monthEnd).order("appointment_date").order("appointment_time"),
        supabase.from("appointments").select(baseSelect).eq("company_id", companyId).gt("appointment_date", today()).neq("status","cancelled").order("appointment_date").order("appointment_time").limit(6),
      ]);
      if (day.error) throw day.error; if (periodRows.error) throw periodRows.error; if (futureRows.error) throw futureRows.error;
      const [dayData, periodData, futureData] = await Promise.all([enrich(day.data ?? []), enrich(periodRows.data ?? []), enrich(futureRows.data ?? [])]);
      setAppointments(dayData); setPeriodAppointments(periodData); setUpcoming(futureData);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar o dashboard."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [selectedDate, period.weekStart, period.monthEnd]);

  const customers = new Set(appointments.map(a => a.customer_name.trim().toLowerCase())).size;
  const revenue = appointments.filter(a => a.status === "completed").reduce((s,a) => s + a.totalPrice, 0);
  const weekAppointments = periodAppointments.filter(a => a.appointment_date >= period.weekStart && a.appointment_date <= period.weekEnd);
  const monthAppointments = periodAppointments.filter(a => a.appointment_date >= period.monthStart && a.appointment_date <= period.monthEnd);
  const weekRevenue = weekAppointments.filter(a => a.status === "completed").reduce((s,a) => s+a.totalPrice,0);
  const monthRevenue = monthAppointments.filter(a => a.status === "completed").reduce((s,a) => s+a.totalPrice,0);
  const selectedPeriod = periodView === "week" ? weekAppointments : periodView === "month" ? monthAppointments : [];
  const selectedPeriodRevenue = periodView === "week" ? weekRevenue : monthRevenue;
  const selectedPeriodLabel = periodView === "week" ? "Esta semana" : "Este mês";

  const shareReadyOnWhatsApp = (a: Appointment) => {
    const raw = (a.customer_phone ?? "").replace(/\D/g,"");
    const phone = raw.startsWith("55") ? raw : "55" + raw;
    if (raw.length < 8) return setError("Este cliente não possui um WhatsApp cadastrado.");
    const message = encodeURIComponent(`Olá, ${a.customer_name}! 🚗✨ Seu veículo está pronto e o serviço foi concluído. Pode passar para fazer a retirada. Obrigado por escolher a ${companyName}!`);
    window.open(`https://wa.me/${phone}?text=${message}`,"_blank","noopener,noreferrer");
  };

  const deleteCompleted = async (a: Appointment) => {
    if (a.status !== "completed" || !window.confirm(`Excluir o agendamento concluído de ${a.customer_name}?`)) return;
    const { error: deleteError } = await supabase.from("appointments").delete().eq("id",a.id);
    if (deleteError) setError(deleteError.message); else { setAppointments(current => current.filter(x=>x.id!==a.id)); setPeriodAppointments(current => current.filter(x=>x.id!==a.id)); }
  };

  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});

  return <div className="mx-auto max-w-6xl space-y-5 pb-8">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-background shadow-md ring-4 ring-primary/10">
          {companyLogo ? <img src={companyLogo} alt={"Logo " + companyName} className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-primary">{companyName.slice(0, 2).toUpperCase()}</span>}
        </div>
        <div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-wider text-primary">{companyName}</p><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Olá 👋</h2><p className="text-sm text-muted-foreground capitalize">{displayDate}</p></div>
      </div>
      <Button asChild size="icon" className="h-11 w-11 rounded-full shadow-sm" title="Novo agendamento"><Link to="/agenda"><Plus className="h-5 w-5"/></Link></Button>
    </div>

    {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

    <div className="grid grid-cols-2 gap-3">
      <Metric icon={CalendarDays} label="Hoje" value={loading?"—":String(appointments.length)} compact />
      <Metric icon={DollarSign} label="Concluído" value={loading?"—":money(revenue)} compact />
    </div>

    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={()=>setSelectedDate(today())}>Hoje</Button>
          <Button variant="ghost" size="sm" onClick={()=>setSelectedDate(shiftDate(selectedDate,-1))}>‹</Button>
          <input aria-label="Escolher data" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-center text-sm font-medium"/>
          <Button variant="ghost" size="sm" onClick={()=>setSelectedDate(shiftDate(selectedDate,1))}>›</Button>
          <Button variant="outline" size="sm" onClick={()=>setSelectedDate(shiftDate(today(),1))}>Amanhã</Button>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={()=>setPeriodView(periodView==="week"?null:"week")} className="text-left">
        <Card className={`rounded-2xl transition ${periodView==="week"?"border-primary ring-1 ring-primary/20":""}`}><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Semana</span><span className="text-xs text-primary">{periodView==="week"?"Fechar":"Ver"}</span></div><p className="mt-2 text-xl font-bold">{loading?"—":weekAppointments.length}</p><p className="text-xs text-muted-foreground">agendamentos · {money(weekRevenue)}</p></CardContent></Card>
      </button>
      <button type="button" onClick={()=>setPeriodView(periodView==="month"?null:"month")} className="text-left">
        <Card className={`rounded-2xl transition ${periodView==="month"?"border-primary ring-1 ring-primary/20":""}`}><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Mês</span><span className="text-xs text-primary">{periodView==="month"?"Fechar":"Ver"}</span></div><p className="mt-2 text-xl font-bold">{loading?"—":monthAppointments.length}</p><p className="text-xs text-muted-foreground">agendamentos · {money(monthRevenue)}</p></CardContent></Card>
      </button>
    </div>

    {periodView && <Card className="rounded-2xl"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><h3 className="font-semibold">{selectedPeriodLabel}</h3><p className="text-xs text-muted-foreground">{selectedPeriod.length} agendamentos · {money(selectedPeriodRevenue)} concluído</p></div><Button variant="ghost" size="sm" onClick={()=>setPeriodView(null)}>Fechar</Button></div></CardHeader><CardContent className="p-0"><div className="divide-y">{selectedPeriod.length===0?<p className="p-5 text-sm text-muted-foreground">Nenhum agendamento neste período.</p>:selectedPeriod.slice(0,12).map(a=><div key={a.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">{new Date(a.appointment_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} · {a.appointment_time.slice(0,5)}</p><p className="truncate font-medium">{a.customer_name}</p><p className="truncate text-xs text-muted-foreground">{a.services.map(s=>s.name).join(" + ")}</p></div><span className="shrink-0 text-sm font-semibold">{money(a.totalPrice)}</span></div>)}</div></CardContent></Card>}

    <Card className="rounded-2xl"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><h3 className="font-semibold">{selectedDate===today()?"Agenda de hoje":"Agenda do dia"}</h3><p className="text-xs text-muted-foreground">{appointments.length ? `${appointments.length} agendamento${appointments.length===1?"":"s"}` : "Nenhum agendamento"}</p></div><Button variant="ghost" size="sm" asChild><Link to="/agenda">Ver tudo</Link></Button></div></CardHeader><CardContent className="p-0">{loading?<div className="p-5 text-sm text-muted-foreground">Carregando...</div>:appointments.length===0?<div className="p-8 text-center"><CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground"/><p className="text-sm text-muted-foreground">Nada agendado para este dia.</p><Button variant="outline" size="sm" className="mt-3" asChild><Link to="/agenda">Criar agendamento</Link></Button></div>:<div className="divide-y">{appointments.map(a=><div key={a.id} className="p-4"><div className="flex items-center gap-3"><span className="w-14 shrink-0 rounded-xl bg-muted px-2 py-2 text-center text-sm font-bold">{a.appointment_time.slice(0,5)}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{a.customer_name}</p><p className="truncate text-xs text-muted-foreground">{a.services.map(s=>s.name).join(" + ")||"Serviço"}</p></div><span className={`rounded-full px-2 py-1 text-[11px] ${a.status==="completed"?"bg-green-100 text-green-700":a.status==="cancelled"?"bg-red-100 text-red-700":a.status==="confirmed"?"bg-primary/10 text-primary":"bg-muted text-muted-foreground"}`}>{a.status==="completed"?"Concluído":a.status==="cancelled"?"Cancelado":a.status==="confirmed"?"Confirmado":"Pendente"}</span></div><div className="mt-3 flex items-center justify-between pl-[68px]"><span className="text-sm font-semibold">{money(a.totalPrice)}</span>{a.status==="completed"&&<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>shareReadyOnWhatsApp(a)}><MessageCircle className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>void deleteCompleted(a)}><Trash2 className="h-4 w-4"/></Button></div>}</div></div>)}</div>}</CardContent></Card>

    <Card className="rounded-2xl"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Próximos</h3><p className="text-xs text-muted-foreground">Seus próximos clientes</p></div><Button variant="ghost" size="sm" asChild><Link to="/agenda">Ver tudo</Link></Button></div></CardHeader><CardContent className="p-0">{upcoming.length===0?<p className="p-5 text-sm text-muted-foreground">Nenhum agendamento futuro.</p>:<div className="divide-y">{upcoming.map(a=><div key={a.id} className="flex items-center gap-3 p-4"><div className="w-14 shrink-0 rounded-xl bg-primary/10 px-2 py-2 text-center"><p className="text-[11px] font-semibold text-primary">{new Date(a.appointment_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</p><p className="text-sm font-bold">{a.appointment_time.slice(0,5)}</p></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{a.customer_name}</p><p className="truncate text-xs text-muted-foreground">{a.services.map(s=>s.name).join(" + ")}</p></div><span className="shrink-0 text-sm font-semibold">{money(a.totalPrice)}</span></div>)}</div>}</CardContent></Card>
  </div>;
}
function Metric({icon:Icon,label,value,compact=false}:{icon:typeof CalendarDays;label:string;value:string;compact?:boolean}){return <Card className="rounded-2xl"><CardContent className={compact?"p-4":"p-5"}><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4"/></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-xl font-bold">{value}</p></div></div></CardContent></Card>}
