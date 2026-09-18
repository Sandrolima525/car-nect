import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({ component: RecoverPasswordPage });

function RecoverPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      if (!email.trim()) throw new Error("Informe seu e-mail.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/nova-senha",
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
    } finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/[0.07] p-4">
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/60 shadow-2xl shadow-black/[0.08]">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.09] via-background to-muted/20 p-6">
        <Link to="/login" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5"/>Voltar para o login</Link>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-5 w-5"/></div>
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {sent ? <div className="space-y-4">
          <div className="rounded-2xl bg-primary/10 p-4"><CheckCircle2 className="mb-2 h-5 w-5 text-primary"/><p className="font-semibold">E-mail enviado</p><p className="mt-1 text-sm text-muted-foreground">Confira sua caixa de entrada e também a pasta de spam. O link permitirá definir uma nova senha.</p></div>
          <Button variant="outline" className="w-full rounded-xl" onClick={()=>void navigate({to:"/login"})}>Voltar ao login</Button>
        </div> : <>
          <div className="space-y-2"><Label>E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" onKeyDown={e=>{if(e.key==="Enter")void submit();}}/></div></div>
          <Button className="w-full rounded-xl" size="lg" onClick={()=>void submit()} disabled={loading}>{loading?"Enviando...":"Enviar link de recuperação"}</Button>
        </>}
      </CardContent>
    </Card>
  </main>;
}
