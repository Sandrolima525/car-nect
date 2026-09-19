import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock3, LogOut, UserRound, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/meus-agendamentos")({ component: MyAppointmentsPage });
type Appointment={id:string;company_id:string;customer_name:string;appointment_date:string;appointment_time:string;status:string;vehicle_plate:string|null;notes:string|null;services:string[]};
const labels:Record<string,string>={pending:"Pendente",confirmed:"Confirmado",completed:"Concluído",cancelled:"Cancelado"};

function MyAppointmentsPage(){
 const navigate=useNavigate(); const [bookingSlug,setBookingSlug]=useState(""); const [appointments,setAppointments]=useState<Appointment[]>([]); const [email,setEmail]=useState(""); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{void (async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session){void navigate({to:"/login",search:{redirect:"/meus-agendamentos"} as any,replace:true});return;}setEmail(session.user.email??"");
 const {data,error:e}=await supabase.from("appointments").select("id,company_id,customer_name,appointment_date,appointment_time,status,vehicle_plate,notes").eq("customer_user_id",session.user.id).order("appointment_date",{ascending:false}).order("appointment_time",{ascending:false});
 if(e){setError(e.message);setLoading(false);return;}const rows=data??[];if(!rows.length){setLoading(false);return;}const company=await supabase.from("companies").select("public_booking_slug").eq("id",rows[0].company_id).maybeSingle();if(company.error){setError(company.error.message);setLoading(false);return;}setBookingSlug(company.data?.public_booking_slug??"");
 const {data:links,error:le}=await (supabase as any).from("appointment_services").select("appointment_id,service_id").in("appointment_id",rows.map(r=>r.id));if(le){setError(le.message);setLoading(false);return;}
 const ids=Array.from(new Set<string>((links??[]).map((x:{service_id:string})=>x.service_id)));const {data:services,error:se}=ids.length?await supabase.from("services").select("id,name").in("id",ids):{data:[],error:null};if(se){setError(se.message);setLoading(false);return;}
 const map=new Map((services??[]).map(s=>[s.id,s.name]));const lm=new Map<string,string[]>();for(const l of links??[])lm.set(l.appointment_id,[...(lm.get(l.appointment_id)??[]),map.get(l.service_id)??"Serviço"]);
 setAppointments(rows.map(r=>({...r,services:lm.get(r.id)??[]})));setLoading(false);})();},[navigate]);
 const signOut=async()=>{await supabase.auth.signOut();void navigate({to:"/login",replace:true});};
 return <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/[0.06] px-4 py-8 sm:py-12"><div className="mx-auto max-w-3xl space-y-5">
 <Card className="overflow-hidden rounded-3xl border-border/60 shadow-lg"><CardHeader className="flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.08] via-background to-muted/20 p-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-5 w-5"/></div><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Minha conta</p><h1 className="text-xl font-bold">Meus agendamentos</h1><p className="text-xs text-muted-foreground">{email}</p></div></div><Button variant="ghost" size="sm" onClick={()=>void signOut()}><LogOut className="mr-2 h-4 w-4"/>Sair</Button></CardHeader>
 <CardContent className="p-4 sm:p-6"><div className="mb-5"><Button asChild className="rounded-xl">{bookingSlug&&<Link to="/agendar/$slug" params={{slug:bookingSlug}}>Novo agendamento</Link>}</Button></div>{error&&<div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
 {loading?<p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>:appointments.length===0?<div className="rounded-2xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto mb-3 h-9 w-9 text-muted-foreground"/><p className="font-medium">Você ainda não possui agendamentos.</p><p className="mt-1 text-sm text-muted-foreground">Escolha um horário para começar.</p></div>:
 <div className="space-y-3">{appointments.map(a=><div key={a.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{new Date(a.appointment_date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {a.appointment_time.slice(0,5)}</p><p className="mt-1 font-semibold">{a.services.join(" + ")||"Serviço"}</p><p className="text-sm text-muted-foreground">{a.vehicle_plate?"Veículo: "+a.vehicle_plate:"Veículo não informado"}</p></div><Status status={a.status}/></div>{a.notes&&<p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">{a.notes}</p>}</div>)}</div>}
 </CardContent></Card></div></main>;
}
function Status({status}:{status:string}){const Icon=status==="completed"?CheckCircle2:status==="cancelled"?XCircle:Clock3;return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Icon className="h-3.5 w-3.5"/>{labels[status]??status}</span>;}
