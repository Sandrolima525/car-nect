import { createFileRoute } from "@tanstack/react-router";

import { CompanySetup } from "@/components/onboarding/company-setup";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/database";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics, fetchRecentOrders, currencyFormatter } from "@/services/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

      {company && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <InfoCard label="Empresa" value={company.name} />
            <InfoCard label="Nível de acesso" value={profile ? ROLE_LABELS[profile.role] : "—"} />
            <InfoCard label="Situação" value={profile?.active ? "Ativo" : "Inativo"} />
          </section>

          <DashboardMetricsSection />
          <DashboardRecentOrdersSection />
        </>
      )}
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

function DashboardMetricsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <InfoCard label="Ordens Hoje" value={data.todayOrders.toString()} />
      <InfoCard label="Em Andamento" value={data.inProgress.toString()} />
      <InfoCard label="Faturamento Hoje" value={currencyFormatter.format(data.revenueToday)} />
      <InfoCard label="Faturamento no Mês" value={currencyFormatter.format(data.revenueMonth)} />
    </section>
  );
}

function DashboardRecentOrdersSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: () => fetchRecentOrders(5),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-wide text-foreground">
        Últimas Ordens de Serviço
      </h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.vehicleLabel}
                  {order.plate !== "—" && (
                    <>
                      <br />
                      <span className="text-xs text-muted-foreground">{order.plate}</span>
                    </>
                  )}
                </TableCell>
                <TableCell>{order.serviceLabel}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{currencyFormatter.format(order.total)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {order.status === "in_progress"
                      ? "Em Andamento"
                      : order.status === "completed"
                        ? "Concluído"
                        : order.status === "delivered"
                          ? "Entregue"
                          : order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
