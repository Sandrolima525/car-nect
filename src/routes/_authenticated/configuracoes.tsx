import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [companyId, setCompanyId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const id = await getCurrentCompanyId();
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("company_id", id).maybeSingle();
        if (profileError) throw profileError;
        if (profile?.role !== "owner") throw new Error("Somente o dono da empresa pode acessar estas configurações.");
        const { data, error: companyError } = await (supabase as any).from("companies").select("logo_url,whatsapp_number,phone").eq("id", id).single();
        if (companyError) throw companyError;
        setCompanyId(id);
        setLogoUrl(data?.logo_url ?? "");
        setWhatsapp(data?.whatsapp_number ?? data?.phone ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true); setError(""); setMessage("");
      const { error: updateError } = await (supabase as any).from("companies").update({
        logo_url: logoUrl.trim() || null,
        whatsapp_number: whatsapp.replace(/\D/g, "") || null,
        updated_at: new Date().toISOString(),
      }).eq("id", companyId);
      if (updateError) throw updateError;
      setMessage("Configurações salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!companyId) return;
    if (!file.type.startsWith("image/")) return setError("Escolha uma imagem.");
    if (file.size > 2 * 1024 * 1024) return setError("A logo deve ter no máximo 2 MB.");
    try {
      setUploading(true); setError(""); setMessage("");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = companyId + "/logo." + ext;
      const upload = await supabase.storage.from("company-logos").upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) throw upload.error;
      const publicUrl = supabase.storage.from("company-logos").getPublicUrl(path).data.publicUrl;
      setLogoUrl(publicUrl);
      const { error: updateError } = await (supabase as any).from("companies").update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", companyId);
      if (updateError) throw updateError;
      setMessage("Logo atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a logo.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <div><h2 className="text-2xl font-bold">Configurações</h2><p className="text-sm text-muted-foreground">Configurações da empresa e do agendamento público.</p></div>
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700">{message}</div>}
    <Card>
      <CardHeader><h3 className="font-semibold">Identidade da empresa</h3></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2"><Label>Logo</Label><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border bg-muted">{logoUrl ? <img src={logoUrl} alt="Logo da empresa" className="h-full w-full object-contain" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}</div><div><Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadLogo(file); }} disabled={uploading} /><p className="mt-2 text-xs text-muted-foreground">PNG, JPG, WEBP ou SVG · máximo 2 MB.</p></div></div></div>
        <div className="space-y-2"><Label>WhatsApp para receber agendamentos *</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(48) 99999-9999" /><p className="text-xs text-muted-foreground">Quando um cliente finalizar um agendamento público, o botão de confirmação abrirá o WhatsApp deste número.</p></div>
        <Button onClick={() => void save()} disabled={saving || uploading}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar configurações"}</Button>
      </CardContent>
    </Card>
  </div>;
}
