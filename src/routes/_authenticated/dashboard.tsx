import { createFileRoute } from "@tanstack/react-router";

import { CompanySetup } from "@/components/onboarding/company-setup";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/database";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — LavaPro Gestão" },
      { name: "description", content: "Visão geral da operação do seu lava-jato." },
      { property: "og:title", content: "Painel — LavaPro Gestão" },
      { property: "og:description", content: "Visão geral da operação do seu lava-jato." },
    ],
  }),
  component: DashboardPage,
});

const NEXT_MODULES = [
  "Clientes",
  "Veículos",
  "Serviços",
  "Ordens de serviço",
  "Agenda",
  "Funcionários",
  "Financeiro",
  "Relatórios",
];

function DashboardPage() {
  const { profile, company, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando dados da conta...</p>;
  }

  if (profile && !company) {
    return <CompanySetup />;
  }


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {profile?.full_name ?? "usuário"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {company
            ? `Você está operando em ${company.trade_name ?? company.name}.`
            : "Sua conta ainda não está vinculada a uma empresa."}
        </p>
      </header>

      {!company && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          Nenhuma empresa vinculada a este usuário. Enquanto isso, nenhum dado operacional fica
          visível. Peça à administração para vincular sua conta a uma empresa.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Empresa" value={company?.name ?? "—"} />
        <InfoCard label="Nível de acesso" value={profile ? ROLE_LABELS[profile.role] : "—"} />
        <InfoCard label="Situação" value={profile?.active ? "Ativo" : "Inativo"} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Próximos módulos
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {NEXT_MODULES.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-medium text-card-foreground">{value}</p>
    </div>
  );
}
