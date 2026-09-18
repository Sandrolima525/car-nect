import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Car, CheckCircle2, Clock3, Copy, ExternalLink, MessageCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

type Appointment = {
  id: string; customer_id: string | null; customer_name: string; customer_phone: string; appointment_date: string;
  appointment_time: string; status: string; notes: string | null; vehicle_plate: string | null;
  service: { name: string; price: number } | null;
  vehicle: { plate: string; brand: string | null; model: string | null } | null;
};

function AgendaPage() {
  const [companyId, setCompanyId] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const id = companyId || await getCurrentCompanyId(); setCompanyId(id);
      const [companyRes, appointmentsRes] = await Promise.all([
        supabase.from("companies").select("public_booking_slug").eq("id", id).single(),
        supabase.from("appointments").select("id,customer_id,customer_name,customer_phone,appointment_date,appointment_time,status,notes,vehicle_plate,service:services(name,price),vehicle:vehicles(plate,brand,model)").eq("company_id", id).eq("appointment_date", date).order("appointment_time"),
      ]);
      if (companyRes.error) throw companyRes.error; if (appointmentsRes.error) throw appointmentsRes.error;
      setSlug(companyRes.data.public_booking_slug ?? ""); setAppointments((appointmentsRes.data ?? []) as unknown as Appointment[]);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a agenda."); }
  };
  useEffect(() => { void load(); }, [date]);
  const link = slug ? window.location.origin + "/agendar/" + slug : "";
  const pending = useMemo(() => appointments.filter(a => a.status !== "converted").length, [appointments]);
  const copyLink = async () => { if (link) await navigator.clipboard.writeText(link); };
  const confirmWhatsApp = (a: Appointment) => {
    const msg = encodeURIComponent("Olá, " + a.customer_name + "! Confirmamos seu agendamento para " + new Date(a.appointment_date + "T12:00:00").toLocaleDateString("pt-BR") + " às " + a.appointment_time.slice(0,5) + " para " + (a.service?.name ?? "seu serviço") + ". Até lá!");
    window.open("https://wa.me/?text=" + msg, "_blank", "noopener,noreferrer");
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-2xl font-bold tracking-tight">Agenda</h2><p className="text-muted-foreground">Agendamentos do dia e acesso rápido às ordens de serviço.</p></div>
      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" /></div>
    </div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Agendamentos</p><p className="mt-1 text-2xl font-semibold">{appointments.length}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Aguardando OS</p><p className="mt-1 text-2xl font-semibold">{pending}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Concluídos/convertidos</p><p className="mt-1 text-2xl font-semibold">{appointments.length - pending}</p></CardContent></Card>
    </div>
    <Card><CardHeader><h3 className="font-semibold">Seu link de agendamento</h3></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><input readOnly value={link} className="h-10 flex-1 rounded-md border bg-muted px-3 text-sm" /><Button variant="outline" onClick={() => void copyLink()} disabled={!link}><Copy className="mr-2 h-4 w-4" />Copiar</Button><Button asChild disabled={!link}><a href={link} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir</a></Button></div></CardContent></Card>
    <Card><CardHeader><h3 className="font-semibold">Agenda do dia</h3></CardHeader><CardContent className="p-0">
      {appointments.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento para esta data.</div> :
      <div className="divide-y">{appointments.map(item => <div key={item.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3"><div className="min-w-16 rounded-lg bg-muted px-2 py-2 text-center text-sm font-semibold">{item.appointment_time.slice(0,5)}</div><div>
          <p className="font-semibold">{item.customer_name}</p><p className="text-sm text-muted-foreground"><UserRound className="mr-1 inline h-3.5 w-3.5" />{item.customer_phone}</p>
          <p className="text-sm text-muted-foreground"><Car className="mr-1 inline h-3.5 w-3.5" />{item.vehicle ? [item.vehicle.plate,item.vehicle.brand,item.vehicle.model].filter(Boolean).join(" · ") : item.vehicle_plate || "Veículo não informado"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.service?.name ?? "Serviço"} · R$ {Number(item.service?.price ?? 0).toFixed(2).replace(".", ",")}{item.notes ? " · " + item.notes : ""}</p>
        </div></div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs">{item.status === "pending" ? "Pendente" : item.status === "converted" ? "OS criada" : item.status}</span>
          {item.status !== "converted" && <Button variant="outline" size="sm" onClick={() => confirmWhatsApp(item)}><MessageCircle className="mr-2 h-4 w-4" />Confirmar WhatsApp</Button>}
          {item.customer_id && <Link to="/clientes" className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm"><UserRound className="h-4 w-4" />Cliente</Link>}
          {item.status !== "converted" && <Link to="/ordens" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"><CheckCircle2 className="h-4 w-4" />Criar OS</Link>}
        </div>
      </div>)}</div>}
    </CardContent></Card>
  </div>;
}