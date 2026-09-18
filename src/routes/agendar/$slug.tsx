import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agendar/$slug")({ component: PublicBookingPage });

type Company = { id: string; name: string; trade_name: string | null; phone: string | null };
type Service = { id: string; name: string; price: number; estimated_duration: number | null };

function PublicBookingPage() {
  const { slug } = Route.useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const { data: companyData, error: companyError } = await supabase.from("companies").select("id,name,trade_name,phone").eq("public_booking_slug", slug).eq("public_booking_enabled", true).maybeSingle();
        if (companyError) throw companyError;
        if (!companyData) throw new Error("Página de agendamento não encontrada.");
        const { data: serviceData, error: serviceError } = await supabase.from("services").select("id,name,price,estimated_duration").eq("company_id", companyData.id).eq("active", true).order("name");
        if (serviceError) throw serviceError;
        setCompany(companyData);
        setServices((serviceData ?? []) as Service[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o agendamento.");
      } finally { setLoading(false); }
    })();
  }, [slug]);

  const selectedService = useMemo(() => services.find((item) => item.id === serviceId), [services, serviceId]);

  const submit = async () => {
    if (!company || !name.trim() || !phone.trim() || !serviceId || !date || !time) {
      setError("Preencha nome, WhatsApp, serviço, data e horário.");
      return;
    }
    try {
      setSaving(true); setError("");
      const { error: bookingError } = await supabase.rpc("create_public_booking", {
        _slug: slug,
        _name: name.trim(),
        _phone: phone.trim(),
        _service_id: serviceId,
        _date: date,
        _time: time,
        _vehicle_plate: plate.trim() || null,
        _vehicle_brand: brand.trim() || null,
        _vehicle_model: model.trim() || null,
        _notes: notes.trim() || null,
      });
      if (bookingError) throw bookingError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o agendamento.");
    } finally { setSaving(false); }
  };

  const whatsappMessage = encodeURIComponent(
    "Olá! Acabei de solicitar um agendamento na " + (company?.trade_name ?? company?.name ?? "LavaPro") + ".\n" +
    "Nome: " + name + "\nWhatsApp: " + phone + "\nServiço: " + (selectedService?.name ?? "") + "\n" +
    (plate ? "Veículo: " + [plate, brand, model].filter(Boolean).join(" · ") + "\n" : "") +
    "Data: " + (date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR") : "") +
    "\nHorário: " + time + "\nAguardo a confirmação. Obrigado!"
  );

  if (loading) return <div className="flex min-h-screen items-center justify-center p-6 text-muted-foreground">Carregando...</div>;
  if (!company) return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md"><CardContent className="p-6 text-center text-destructive">{error || "Página não encontrada."}</CardContent></Card></div>;

  return <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">LP</div>
        <h1 className="text-2xl font-bold">{company.trade_name ?? company.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Agende seu serviço de forma rápida e fácil.</p>
      </div>
      {done ? <Card><CardContent className="p-7 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
        <h2 className="text-xl font-bold">Agendamento solicitado!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Seus dados foram salvos e o atendimento já aparece na agenda da empresa.</p>
        <Button className="mt-6 w-full" asChild><a href={"https://wa.me/?text=" + whatsappMessage} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Enviar confirmação no WhatsApp</a></Button>
        <p className="mt-3 text-xs text-muted-foreground">A confirmação final depende da disponibilidade da empresa.</p>
      </CardContent></Card> :
      <Card><CardHeader><h2 className="font-semibold">Agendar atendimento</h2></CardHeader><CardContent className="space-y-4">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="space-y-2"><Label>Seu nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" /></div>
        <div className="space-y-2"><Label>WhatsApp *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(48) 99999-9999" /></div>
        <div className="space-y-2"><Label>Serviço *</Label><Select value={serviceId} onValueChange={setServiceId}><SelectTrigger><SelectValue placeholder="Escolha o serviço" /></SelectTrigger><SelectContent>{services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name} · R$ {Number(service.price).toFixed(2).replace(".", ",")}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-3 rounded-xl border p-4"><div><p className="font-medium">Seu veículo</p><p className="text-xs text-muted-foreground">Opcional, mas ajuda a empresa a identificar seu atendimento.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1"><Label>Placa</Label><Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" /></div>
            <div className="space-y-2"><Label>Marca</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Honda" /></div>
            <div className="space-y-2"><Label>Modelo</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Civic" /></div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Data *</Label><Input type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="space-y-2"><Label>Horário *</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div></div>
        <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma informação importante? (opcional)" /></div>
        {selectedService && <div className="rounded-xl bg-muted/60 p-4 text-sm"><div className="flex justify-between"><span>Serviço</span><strong>{selectedService.name}</strong></div><div className="mt-1 flex justify-between"><span>Valor estimado</span><strong>R$ {Number(selectedService.price).toFixed(2).replace(".", ",")}</strong></div></div>}
        <Button className="w-full" onClick={() => void submit()} disabled={saving}>{saving ? "Agendando..." : "Confirmar agendamento"}</Button>
      </CardContent></Card>}
    </div>
  </main>;
}
