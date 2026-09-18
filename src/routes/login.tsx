import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Chrome, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/meus-agendamentos";

  useEffect(() => { void supabase.auth.getSession().then(({data}) => { if (data.session) void navigate({to: redirectTo as any, replace:true}); }); }, [navigate, redirectTo]);

  const submit = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      if (!email.trim() || !password) throw new Error("Informe e-mail e senha.");
      if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
      if (mode === "signup" && !name.trim()) throw new Error("Informe seu nome.");
      if (mode === "signup") {
        const {data,error:signUpError}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:window.location.origin+redirectTo}});
        if (signUpError) throw signUpError;
        if (data.session) void navigate({to:redirectTo as any,replace:true});
        else setMessage("Conta criada. Verifique seu e-mail para confirmar o cadastro e depois entre na sua conta.");
      } else {
        const {error:signInError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if (signInError) throw signInError;
        void navigate({to:redirectTo as any,replace:true});
      }
    } catch(err){setError(err instanceof Error?err.message:"Não foi possível continuar.");}
    finally{setLoading(false);}
  };
  const google=async()=>{setLoading(true);setError("");const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+redirectTo}});if(error){setError(error.message);setLoading(false);}};
  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/[0.07] p-4">
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/60 shadow-2xl shadow-black/[0.08]">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.09] via-background to-muted/20 p-6">
        <Link to="/meus-agendamentos" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5"/>Voltar</Link>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5"/></div>
        <h1 className="text-2xl font-bold tracking-tight">{mode==="login"?"Entrar na sua conta":"Criar sua conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode==="login"?"Acompanhe seus agendamentos e marque novos horários.":"Crie sua conta para reservar e acompanhar seus atendimentos."}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {error&&<div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message&&<div className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</div>}
        {mode==="signup"&&<div className="space-y-2"><Label>Nome</Label><div className="relative"><UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo"/></div></div>}
        <div className="space-y-2"><Label>E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></div></div>
        <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></div>
        <Button className="w-full rounded-xl" size="lg" onClick={()=>void submit()} disabled={loading}>{loading?"Aguarde...":mode==="login"?"Entrar":"Criar conta"}</Button>
        <div className="relative py-1"><div className="border-t"/><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">ou</span></div>
        <Button variant="outline" className="w-full rounded-xl" size="lg" onClick={()=>void google()} disabled={loading}><Chrome className="mr-2 h-4 w-4"/>Continuar com Google</Button>
        <button type="button" className="w-full text-sm font-semibold text-primary hover:underline" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}}>{mode==="login"?"Ainda não tenho conta":"Já tenho uma conta"}</button>
      </CardContent>
    </Card>
  </main>;
}
