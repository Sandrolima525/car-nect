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
import { brandCssVariables, DEFAULT_BRAND, type BrandColors } from "@/lib/branding";

export const Route = createFileRoute("/agendar/$slug")({
  ssr: false,
  component: PublicBookingPage,
});

type Company = { id: string; name: string; trade_name: string | null; phone: string | null; whatsapp_number: string | null; logo_url: string | null; brand_colors: BrandColors | null };
type Service = { id: string; name: string; price: number; estimated_duration: number | null; vehicle_category: string | null };

function PublicBookingPage() {
  const { slug } = Route.useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [themeBrand, setThemeBrand] = useState<BrandColors>(DEFAULT_BRAND);
  const [services, setServices] = useState<Service[]>([]); const [vehicleCategory, setVehicleCategory] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [model, setModel] = useState("");
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toLocaleDateString("en-CA"));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const compatibleServices = useMemo(() => services.filter(s => !vehicleCategory || !s.vehicle_category || s.vehicle_category === "all" || s.vehicle_category === vehicleCategory), [services, vehicleCategory]);
  const selectedServices = useMemo(() => services.filter(s => serviceIds.includes(s.id)), [services, serviceIds]);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.estimated_duration ?? 60), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  useEffect(() => { setServiceIds(prev => prev.filter(id => compatibleServices.some(s => s.id === id))); setTime(""); }, [vehicleCategory, compatibleServices]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const c = await supabase.from("companies").select("id,name,trade_name,phone,whatsapp_number,logo_url,brand_colors").eq("public_booking_slug", slug).eq("public_booking_enabled", true).maybeSingle();
        if (c.error) throw c.error;
        if (!c.data) throw new Error("Página de agendamento não encontrada.");
        const s = await supabase.from("services").select("id,name,price,estimated_duration,vehicle_category").eq("company_id", c.data.id).eq("active", true).order("name");
        if (s.error) throw s.error;
        setCompany(c.data as Company); setThemeBrand({ ...DEFAULT_BRAND, ...((c.data.brand_colors as Partial<BrandColors> | null) ?? {}) }); setServices((s.data ?? []) as Service[]);
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
    if (!company || !vehicleCategory || !name.trim() || phone.replace(/\D/g, "").length < 8 || !serviceIds.length || !date || !time) return setError("Preencha nome, WhatsApp, serviço, data e horário.");
    try {
      setSaving(true); setError("");
      const result = await (supabase as any).rpc("create_public_booking_multi", {
        _slug: slug, _name: name.trim(), _phone: phone.trim(), _service_ids: serviceIds, _date: date, _time: time,
        _vehicle_plate: plate.trim() || null, _vehicle_brand: vehicleBrand.trim() || null, _vehicle_model: model.trim() || null, _notes: notes.trim() || null,
      });
      if (result.error) throw result.error;
      setDone(true);
    } catch (err) { setError(err instanceof Error ? (err.message.includes("no longer available") ? "Esse horário acabou de ser ocupado. Escolha outro horário." : err.message) : "Não foi possível concluir o agendamento."); }
    finally { setSaving(false); }
  };

  const rawWhatsapp = (company?.whatsapp_number ?? company?.phone ?? "").replace(/\D/g, "");
  const whatsappNumber = rawWhatsapp.startsWith("55") ? rawWhatsapp : rawWhatsapp ? "55" + rawWhatsapp : "";
  const companyDisplayName = company?.name ?? company?.trade_name ?? "empresa";
  const whatsappMessage = encodeURIComponent(`Olá! Recebi um novo agendamento pela agenda online da ${companyDisplayName}.\n\nCliente: ${name}\nWhatsApp: ${phone}\nVeículo: ${[vehicleBrand, model].filter(Boolean).join(" " ) || "Não informado"}\nPlaca: ${plate || "Não informada"}\nServiços: ${selectedServices.map(s => s.name).join(", ")}\nData: ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}\nHorário: ${time}\nValor total: R$ ${totalPrice.toFixed(2).replace(".", ",")}\n\nAguardo a confirmação.`);

  if (loading) return <div className="flex min-h-screen items-center justify-center p-6 text-muted-foreground">Carregando...</div>;
  if (!company) return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md"><CardContent className="p-6 text-center text-destructive">{error || "Página não encontrada."}</CardContent></Card></div>;

  return <main style={brandCssVariables(themeBrand)} className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/[0.06] px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-5 text-center shadow-lg backdrop-blur sm:p-7">{company.logo_url ? <img src={company.logo_url} alt={"Logo " + (company.trade_name ?? company.name)} className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-primary/20 bg-background object-cover p-1 shadow-lg ring-4 ring-primary/10" /> : <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">{company.name.slice(0, 2).toUpperCase()}</div>}<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{company.name}</h1><p className="mt-1 text-sm text-muted-foreground">Escolha o serviço e veja somente os horários realmente disponíveis.</p><div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground"></div>{whatsappNumber && <Button variant="outline" size="sm" className="mt-4" asChild><a href={"https://wa.me/"+whatsappNumber} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4"/>Falar pelo WhatsApp</a></Button>}</div>
      {done ? <Card className="overflow-hidden border-border/60 shadow-2xl shadow-primary/[0.06] backdrop-blur"><CardContent className="p-8 text-center sm:p-10"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" /><h2 className="text-xl font-bold">Agendamento solicitado!</h2><p className="mt-2 text-sm text-muted-foreground">O horário foi reservado e já entrou na agenda da empresa.</p><Button className="mt-6 w-full" asChild disabled={!whatsappNumber}><a href={(whatsappNumber ? "https://wa.me/" + whatsappNumber + "?text=" : "https://wa.me/?text=") + whatsappMessage} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />{whatsappNumber ? "Enviar confirmação no WhatsApp" : "WhatsApp não configurado"}</a></Button></CardContent></Card> :
      <Card className="overflow-hidden border-border/60 shadow-xl shadow-black/[0.06]"><CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.08] via-muted/20 to-background p-6"><h2 className="text-lg font-semibold">Agendar atendimento</h2><p className="text-sm text-muted-foreground">Preencha seus dados e escolha os serviços.</p></CardHeader><CardContent className="space-y-5">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" /></div><div className="space-y-2"><Label>WhatsApp *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(48) 99999-9999" /></div></div>
        <div className="space-y-2"><Label>Categoria do veículo *</Label><div className="grid grid-cols-3 gap-2">{["Hatch","Sedan","SUV/Picape"].map(v => <button type="button" key={v} onClick={() => setVehicleCategory(v)} className={`rounded-xl border p-3 text-sm font-semibold ${vehicleCategory === v ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{v}</button>)}</div></div><div className="space-y-2"><Label>Serviços *</Label><div className="grid gap-2">{compatibleServices.map(s => <label key={s.id} className={`group flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${serviceIds.includes(s.id) ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "border-border/70 bg-background/60 hover:border-primary/40 hover:bg-primary/[0.035]"}`}><input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => { setServiceIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]); setTime(""); }} className="h-4 w-4 accent-primary" /><span className="flex-1 text-sm font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.estimated_duration ?? 60} min · R$ {Number(s.price).toFixed(2).replace(".", ",")}</span></label>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Data *</Label><div className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e => setDate(e.target.value)} /></div></div><div className="space-y-2"><Label>Horário *</Label><Select value={time} onValueChange={setTime} disabled={!serviceIds.length || slotsLoading}><SelectTrigger><SelectValue placeholder={slotsLoading ? "Calculando..." : slots.length ? "Horários disponíveis" : "Nenhum horário"} /></SelectTrigger><SelectContent>{slots.map(s => <SelectItem key={s} value={s}><Clock3 className="mr-2 inline h-3.5 w-3.5" />{s}</SelectItem>)}</SelectContent></Select></div></div>
        {selectedServices.length > 0 && <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] to-background p-4 text-sm shadow-sm"><strong>{selectedServices.map(s => s.name).join(" + ")}</strong><br />Duração total: {totalDuration} minutos · Valor total: R$ {totalPrice.toFixed(2).replace(".", ",")}</div>}
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-4 shadow-inner"><p className="mb-3 font-medium">Veículo</p><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Placa</Label><Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" /></div><div className="space-y-2"><Label>Marca</Label><Input value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} placeholder="Honda" /></div><div className="space-y-2"><Label>Modelo</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="Civic" /></div></div></div>
        <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" /></div>
        <Button className="w-full rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/25" size="lg" onClick={() => void submit()} disabled={saving || !time}>{saving ? "Enviando..." : "Solicitar horário"}</Button>
        <p className="text-center text-xs text-muted-foreground">Os horários exibidos seguem o funcionamento configurado pela empresa e são recalculados conforme a duração de cada serviço.</p>
      </CardContent></Card>}
    </div>
  </main>;
}
