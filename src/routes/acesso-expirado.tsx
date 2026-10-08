import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT = "48988368288";

export const Route = createFileRoute("/acesso-expirado")({
  ssr: false,
  component: AccessExpiredPage,
});

function AccessExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/[0.06] p-6">
      <section className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><Clock3 className="h-8 w-8" /></div>
        <h1 className="mt-5 text-2xl font-bold">Acesso temporariamente indisponível</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">O período de acesso desta empresa ao LavaPro terminou ou a empresa está bloqueada. Para renovar o acesso e voltar a utilizar o painel, entre em contato conosco.</p>
        <Button className="mt-6 w-full" asChild><a href={`https://wa.me/55${CONTACT}?text=${encodeURIComponent("Olá! Gostaria de renovar o acesso ao LavaPro da minha empresa.")}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Falar pelo WhatsApp</a></Button>
        <Button variant="outline" className="mt-3 w-full" asChild><Link to="/auth">Voltar para o login</Link></Button>
      </section>
    </main>
  );
}
