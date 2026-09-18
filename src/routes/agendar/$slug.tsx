import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agendar/$slug")({\n  ssr: false,\n  component: PublicBookingPage,\n});

type Company = { id: string; name: string; trade_name: string | null; phone: string | null };
type Service = { id: string; name: string; price: number; estimated_duration: number | null };

function PublicBookingPage() {
  const { slug } = Route.useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0,10));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const selectedServices = useMemo(() => services.filter(s => serviceIds.includes(s.id)), [services, serviceIds]);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.estimated_duration ?? 60), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const c = await supabase.from("companies").select("id,name,trade_name,phone").eq("public_booking_slug", slug).eq("public_booking_enabled", true).maybeSingle();
        if (c.error) throw c.error;
        if (!c.data) throw new Error("Página de agendamento não encontrada.");
        const s = await supabase.from("services").select("id,name,price,estimated_duration").eq("company_id", c.data.id).eq("active", true).order("name");
        if (s.error) throw s.error;
        setCompany(c.data as Company); setServices((s.data ?? []) as Service[]);
      } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a página."); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  useEffect(() => {
    if (!company || !serviceIds.length || !date) { setSlots([]); setTime(""); return; }
    void (async () => {
      setSlotsLoading(true); setError(""); setTime("");
      const result = await (supabase as any).rpc("get_public_available_slots_multi", { _slug: slug, _date: date, _service_ids: serviceIds });
      if (result.error) setError(result.error.message);
      else setSlots((result.data ?? []).map((row: { slot: string }) => row.slot.slice(0,5)));
      setSlotsLoading(false);
    })();
  }, [company, serviceIds, date, slug]);

  const submit = async () => {
    if (!company || !name.trim() || phone.replace(/\D/g, "").length < 8 || !serviceIds.length || !date || !time) return setError("Preencha nome, WhatsApp, serviço, data e horário.");
    try {
      setSaving(true); setError("");
      const result = await (supabase as any).rpc("create_public_booking_multi", {
        _slug: slug, _name: name.trim(), _phone: phone.trim(), _service_ids: serviceIds, _date: date, _time: time,
        _vehicle_plate: plate.trim() || null, _vehicle_brand: brand.trim() || null, _vehicle_model: model.trim() || null, _notes: notes.trim() || null,
      });
      if (result.error) throw result.error;
      setDone(true);
    } catch (err) { setError(err instanceof Error ? (err.message.includes("no longer available") ? "Esse horário acabou de ser ocupado. Escolha outro horário." : err.message) : "Não foi possível concluir o agendamento."); }
    finally { setSaving(false); }
  };

  const whatsappMessage = encodeURIComponent(`Olá! Solicitei um agendamento na ${company?.trade_name ?? company?.name ?? ""}.\nNome: ${name}\nWhatsApp: ${phone}\nServiços: ${selectedServices.map(s => s.name).join(", ")}\nValor total: R$ ${totalPrice.toFixed(2).replace(".", ",")}\nData: ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}\nHorário: ${time}\nAguardo a confirmação.`);
  if (loading) return <div className="flex min-h-screen items-center justify-center p-6 text-muted-foreground">Carregando...</div>;
  if (!company) return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md"><CardContent className="p-6 text-center text-destructive">{error || "Página não encontrada."}</CardContent></Card></div>;

  return <main className="min-h-screen bg-muted/30 px-4 py-8">
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">LP</div><h1 className="text-2xl font-bold">{company.trade_name ?? company.name}</h1><p className="mt-1 text-sm text-muted-foreground">Escolha o serviço e veja somente os horários realmente disponíveis.</p></div>
      {done ? <Card><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" /><h2 className="text-xl font-bold">Agendamento solicitado!</h2><p className="mt-2 text-sm text-muted-foreground">O horário foi reservado e já entrou na agenda da empresa.</p><Button className="mt-6 w-full" asChild><a href={"https://wa.me/?text=" + whatsappMessage} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Enviar no WhatsApp</a></Button></CardContent></Card> :
      <Card><CardHeader><h2 className="font-semibold">Agendar atendimento</h2></CardHeader><CardContent className="space-y-5">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" /></div><div className="space-y-2"><Label>WhatsApp *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(48) 99999-9999" /></div></div>
        <div className="space-y-2"><Label>Serviços *</Label><div className="grid gap-2">{services.map(s => <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => { setServiceIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]); setTime(""); }} className="h-4 w-4" /><span className="flex-1 text-sm font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.estimated_duration ?? 60} min · R$ {Number(s.price).toFixed(2).replace(".", ",")}</span></label>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Data *</Label><div className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e => setDate(e.target.value)} /></div></div><div className="space-y-2"><Label>Horário *</Label><Select value={time} onValueChange={setTime} disabled={!serviceIds.length || slotsLoading}><SelectTrigger><SelectValue placeholder={slotsLoading ? "Calculando..." : slots.length ? "Horários disponíveis" : "Nenhum horário"} /></SelectTrigger><SelectContent>{slots.map(s => <SelectItem key={s} value={s}><Clock3 className="mr-2 inline h-3.5 w-3.5" />{s}</SelectItem>)}</SelectContent></Select></div></div>
        {selectedServices.length > 0 && <div className="rounded-xl bg-muted/50 p-4 text-sm"><strong>{selectedServices.map(s => s.name).join(" + ")}</strong><br />Duração total: {totalDuration} minutos · Valor total: R$ {totalPrice.toFixed(2).replace(".", ",")}</div>}
        <div className="rounded-xl border p-4"><p className="mb-3 font-medium">Veículo</p><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Placa</Label><Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" /></div><div className="space-y-2"><Label>Marca</Label><Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Honda" /></div><div className="space-y-2"><Label>Modelo</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="Civic" /></div></div></div>
        <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" /></div>
        <Button className="w-full" size="lg" onClick={() => void submit()} disabled={saving || !time}>{saving ? "Enviando..." : "Solicitar horário"}</Button>
        <p className="text-center text-xs text-muted-foreground">Funcionamento considerado pelo sistema: 08:00 às 18:00. Os horários são recalculados conforme a duração de cada serviço.</p>
      </CardContent></Card>}
    </div>
  </main>;
}
