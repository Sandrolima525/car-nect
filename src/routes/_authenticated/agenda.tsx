import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

type Appointment = {
  id: string; customer_name: string; customer_phone: string; appointment_date: string;
  appointment_time: string; status: string; notes: string | null;
  service: { name: string } | null;
};

function AgendaPage() {
  const [companyId, setCompanyId] = useState("");
  const [slug, setSlug] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const id = companyId || await getCurrentCompanyId(); setCompanyId(id);
      const [companyRes, appointmentsRes] = await Promise.all([
        supabase.from("companies").select("public_booking_slug").eq("id", id).single(),
        supabase.from("appointments").select("id,customer_name,customer_phone,appointment_date,appointment_time,status,notes,service:services(name)").eq("company_id", id).order("appointment_date").order("appointment_time"),
      ]);
      if (companyRes.error) throw companyRes.error;
      if (appointmentsRes.error) throw appointmentsRes.error;
      setSlug(companyRes.data.public_booking_slug ?? "");
      setAppointments((appointmentsRes.data ?? []) as unknown as Appointment[]);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a agenda."); }
  };
  useEffect(() => { void load(); }, []);
  const link = slug ? window.location.origin + "/agendar/" + slug : "";
  const copyLink = async () => { if (link) await navigator.clipboard.writeText(link); };
  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold tracking-tight">Agenda</h2><p className="text-muted-foreground">Receba agendamentos dos clientes por um link público.</p></div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <Card><CardHeader><h3 className="font-semibold">Seu link de agendamento</h3></CardHeader><CardContent>
      <div className="flex flex-col gap-3 sm:flex-row"><input readOnly value={link} className="h-10 flex-1 rounded-md border bg-muted px-3 text-sm" /><Button variant="outline" onClick={() => void copyLink()} disabled={!link}><Copy className="mr-2 h-4 w-4" />Copiar</Button><Button asChild disabled={!link}><a href={link} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir</a></Button></div>
      <p className="mt-2 text-xs text-muted-foreground">Compartilhe esse link no Instagram, Google ou WhatsApp para seus clientes agendarem.</p>
    </CardContent></Card>
    <Card><CardHeader><h3 className="font-semibold">Solicitações de agendamento</h3></CardHeader><CardContent className="p-0">
      {appointments.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento recebido.</div> :
      <div className="divide-y">{appointments.map((item) => <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold">{item.customer_name}</p><p className="text-sm text-muted-foreground">{item.service?.name ?? "Serviço"} · {item.customer_phone}</p>{item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}</div>
        <div className="text-left sm:text-right"><p className="font-semibold">{new Date(item.appointment_date + "T12:00:00").toLocaleDateString("pt-BR")} às {item.appointment_time.slice(0,5)}</p><span className="text-xs text-muted-foreground">{item.status === "pending" ? "Pendente" : item.status}</span></div>
      </div>)}</div>}
    </CardContent></Card>
  </div>;
}
