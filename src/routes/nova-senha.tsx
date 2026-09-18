import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nova-senha")({ component: NewPasswordPage });

function NewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setError("");
    if (!ready) { setError("O link de recuperação é inválido ou expirou. Solicite um novo link."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); return; }
    setSaved(true);
    await supabase.auth.signOut();
  };

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/[0.07] p-4">
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/60 shadow-2xl shadow-black/[0.08]">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.09] via-background to-muted/20 p-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5"/></div>
        <h1 className="text-2xl font-bold tracking-tight">{saved ? "Senha alterada" : "Criar nova senha"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{saved ? "Sua senha foi atualizada com sucesso." : "Escolha uma nova senha para sua conta."}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {saved ? <><div className="rounded-2xl bg-primary/10 p-4"><CheckCircle2 className="mb-2 h-5 w-5 text-primary"/><p className="font-semibold">Tudo certo!</p><p className="mt-1 text-sm text-muted-foreground">Agora você pode entrar usando sua nova senha.</p></div><Button className="w-full rounded-xl" size="lg" onClick={()=>void navigate({to:"/login"})}>Ir para o login</Button></> : <>
          <div className="space-y-2"><Label>Nova senha</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></div>
          <div className="space-y-2"><Label>Confirmar senha</Label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Digite novamente"/></div>
          <Button className="w-full rounded-xl" size="lg" onClick={()=>void submit()}>Salvar nova senha</Button>
        </>}
      </CardContent>
    </Card>
  </main>;
}
