import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CarFront, Check, ChevronLeft, ChevronRight, Clock3, Droplets, Plus, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

type Appointment={id:string;customer_name:string;customer_phone:string;vehicle_plate:string|null;appointment_time:string;status:string;total_price:number;total_duration:number;services:{id:string;name:string}[]};

const today=()=>new Date().toLocaleDateString("en-CA");
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const statuses=[
 {key:"pending",label:"Aguardando",icon:Clock3},
 {key:"confirmed",label:"Em lavagem",icon:Droplets},
 {key:"completed",label:"Pronto",icon:Check},
 {key:"delivered",label:"Concluído",icon:CarFront},
] as const;

function AgendaPage(){
 const [date,setDate]=useState(today()); const [items,setItems]=useState<Appointment[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const load=async()=>{
  try{setLoading(true);setError("");const companyId=await getCurrentCompanyId();
   const r=await supabase.from("appointments").select("id,customer_name,customer_phone,vehicle_plate,appointment_time,status,total_price,total_duration,service:services(id,name)").eq("company_id",companyId).eq("appointment_date",date).neq("status","cancelled").order("appointment_time");
   if(r.error)throw r.error;const rows=r.data??[];const ids=rows.map(x=>x.id);
   const links=ids.length?await (supabase as any).from("appointment_services").select("appointment_id,service_id,price,duration_minutes,service:services(id,name)").in("appointment_id",ids):{data:[],error:null};
   if(links.error)throw links.error;
   const grouped=new Map<string,any[]>();for(const x of links.data??[])grouped.set(x.appointment_id,[...(grouped.get(x.appointment_id)??[]),x]);
   setItems(rows.map((x:any)=>{const ls=grouped.get(x.id)??[];const fallback=x.service?[x.service]:[];return {...x,total_price:ls.length?ls.reduce((s:number,y:any)=>s+Number(y.price),0):Number(x.total_price??0),total_duration:ls.length?ls.reduce((s:number,y:any)=>s+Number(y.duration_minutes??60),0):Number(x.total_duration??0),services:ls.length?ls.map(y=>y.service).filter(Boolean):fallback}}));
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar a agenda.");}finally{setLoading(false)}
 };
 useEffect(()=>{void load()},[date]);
 const move=async(a:Appointment)=>{
  const next=a.status==="pending"?"confirmed":a.status==="confirmed"?"completed":a.status==="completed"?"delivered":null;if(!next)return;
  const now=new Date().toISOString();const patch:any={status:next,updated_at:now};if(next==="confirmed")patch.washing_at=now;if(next==="completed")patch.ready_at=now;if(next==="delivered")patch.completed_at=now;
  const r=await supabase.from("appointments").update(patch).eq("id",a.id);if(r.error)setError(r.error.message);else void load();
 };
 const cancel=async(a:Appointment)=>{if(!window.confirm("Cancelar este atendimento?"))return;const r=await supabase.from("appointments").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",a.id);if(r.error)setError(r.error.message);else void load()};
 const whatsapp=(a:Appointment)=>{const phone=(a.customer_phone||"").replace(/\D/g,"");if(phone.length<8)return;const msg=encodeURIComponent(`Olá, ${a.customer_name}! Seu veículo está pronto para retirada na LavaPro. 🚗✨`);window.open(`https://wa.me/${phone.startsWith("55")?phone:"55"+phone}?text=${msg}`,"_blank","noopener,noreferrer")};
 return <div className="mx-auto max-w-7xl space-y-5 pb-10">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Sparkles className="h-4 w-4"/>Painel de atendimento</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Operação do dia</h1><p className="text-sm capitalize text-muted-foreground">{new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" onClick={()=>setDate(d=>{const x=new Date(d+"T12:00:00");x.setDate(x.getDate()-1);return x.toLocaleDateString("en-CA")})}><ChevronLeft/></Button><Button variant="outline" onClick={()=>setDate(today())}>Hoje</Button><Button variant="outline" size="icon" onClick={()=>setDate(d=>{const x=new Date(d+"T12:00:00");x.setDate(x.getDate()+1);return x.toLocaleDateString("en-CA")})}><ChevronRight/></Button><Button asChild><Link to="/agendar/lavapro"><Plus className="mr-2 h-4 w-4"/>Novo encaixe</Link></Button></div></div>
  {error&&<div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{statuses.map(s=>{const list=items.filter(a=>a.status===s.key);const Icon=s.icon;return <Card key={s.key} className="rounded-2xl border-border/60 shadow-sm"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary"/>{s.label}</div><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{list.length}</span></div></CardHeader><CardContent className="space-y-3">{loading?<div className="h-24 animate-pulse rounded-xl bg-muted"/>:list.length===0?<p className="py-8 text-center text-xs text-muted-foreground">Nenhum veículo</p>:list.map(a=><div key={a.id} className="rounded-xl border bg-card p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{a.customer_name}</p><p className="text-xs text-muted-foreground">{a.vehicle_plate||"Placa não informada"} · {a.appointment_time.slice(0,5)}</p></div><span className="text-sm font-bold">{money(a.total_price)}</span></div><p className="mt-2 text-xs text-muted-foreground">{a.services.map(x=>x.name).join(" + ")||"Serviço"} · {a.total_duration} min</p><div className="mt-3 flex gap-2">{a.status!=="delivered"&&<Button size="sm" className="flex-1" onClick={()=>void move(a)}>{a.status==="pending"?"Iniciar":a.status==="confirmed"?"Marcar pronto":"Concluir"}</Button>}{a.status==="completed"&&<Button size="sm" variant="outline" onClick={()=>whatsapp(a)}>WhatsApp</Button>}{a.status==="pending"&&<Button size="sm" variant="ghost" onClick={()=>void cancel(a)}>Cancelar</Button>}</div></div>)}</CardContent></Card>})}</div>
  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><RotateCcw className="h-4 w-4"/>A operação usa os mesmos agendamentos do portal público.</span><Link to="/configuracoes" className="font-semibold text-primary">Configurações</Link></div>
 </div>
}