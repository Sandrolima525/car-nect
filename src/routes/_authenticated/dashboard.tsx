import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Car, CheckCircle2, Clock3, DollarSign, Plus, RefreshCw, Users, Wrench } from "lucide-react";

import { CompanySetup } from "@/components/onboarding/company-setup";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { currencyFormatter, fetchDashboardMetrics, fetchRecentOrders } from "@/services/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/common/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Car-Nect" },
      { name: "description", content: "Visão geral da operação do seu lava-jato." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, company, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (profile && !company) return <CompanySetup />;

  return (
    <div className="space-y-7">
      <DashboardHeader companyName={company?.trade_name ?? company?.name} />

      {!company && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          Nenhuma empresa vinculada a este usuário. Peça à administração para vincular sua conta.
        </div>
      )}

      {company && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Empresa" value={company.trade_name ?? company.name} />
            <InfoCard label="Nível de acesso" value={profile ? ROLE_LABELS[profile.role] : "—"} />
            <InfoCard label="Situação" value={profile?.active ? "Ativo" : "Inativo"} />
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ações rápidas</p>
              <div className="mt-3 flex gap-2">
                <Link to="/ordens" className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                  <Plus className="h-4 w-4" /> Nova ordem
                </Link>
                <Link to="/clientes" className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted">
                  Clientes
                </Link>
              </div>
            </div>
          </section>
          <DashboardOverview />
        </>
      )}
    </div>
  );
}

function DashboardHeader({ companyName }: { companyName?: string }) {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "usuário";

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Visão geral</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Olá, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {companyName ? "Acompanhe a operação de " + companyName + " em um só lugar." : "Sua conta ainda não está vinculada a uma empresa."}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-success" /> Sistema operacional
      </div>
    </header>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

function DashboardOverview() {
  const { company } = useAuth();
  const metrics = useQuery({
    queryKey: ["dashboard-metrics", company?.id],
    queryFn: fetchDashboardMetrics,
    enabled: Boolean(company?.id),
    staleTime: 30_000,
  });
  const orders = useQuery({
    queryKey: ["dashboard-recent-orders", company?.id],
    queryFn: () => fetchRecentOrders(6),
    enabled: Boolean(company?.id),
    staleTime: 15_000,
  });

  const isRefreshing = metrics.isFetching || orders.isFetching;

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Resumo da operação</h2>
            <p className="text-sm text-muted-foreground">Indicadores atualizados automaticamente.</p>
          </div>
          <button type="button" onClick={() => { void metrics.refetch(); void orders.refetch(); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted" aria-label="Atualizar dashboard">
            <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Atualizar
          </button>
        </div>

        {metrics.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
          </div>
        ) : metrics.error || !metrics.data ? <ErrorCard /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ordens hoje" value={metrics.data.todayOrders.toString()} hint={metrics.data.completedToday + " concluída(s) hoje"} icon={Wrench} accent />
            <StatCard label="Em andamento" value={metrics.data.inProgress.toString()} hint="Serviços ativos agora" icon={Clock3} />
            <StatCard label="Faturamento hoje" value={currencyFormatter.format(metrics.data.revenueToday)} hint="Pagamentos confirmados" icon={DollarSign} accent />
            <StatCard label="Faturamento no mês" value={currencyFormatter.format(metrics.data.revenueMonth)} hint="Total recebido no mês" icon={CheckCircle2} accent />
          </div>
        )}
      </section>

      {metrics.data && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">Status das ordens</h3><p className="text-xs text-muted-foreground">Acompanhamento do dia</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <ProgressRow label="Concluídas" value={metrics.data.completedToday} total={metrics.data.todayOrders} />
              <ProgressRow label="Em andamento" value={metrics.data.inProgress} total={metrics.data.todayOrders} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">Base de clientes</h3><p className="text-xs text-muted-foreground">Cadastros no sistema</p></div>
            </div>
            <p className="mt-5 text-3xl font-semibold">{metrics.data.customers}</p>
            <Link to="/_authenticated/clientes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver clientes <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Car className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">Veículos cadastrados</h3><p className="text-xs text-muted-foreground">Frota atendida pela empresa</p></div>
            </div>
            <p className="mt-5 text-3xl font-semibold">{metrics.data.vehicles}</p>
            <Link to="/veiculos" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver veículos <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-foreground">Últimas ordens de serviço</h2><p className="text-sm text-muted-foreground">Os atendimentos mais recentes.</p></div>
          <Link to="/_authenticated/ordens" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">Ver todas <ArrowRight className="h-4 w-4" /></Link>
        </div>

        {orders.isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : orders.error ? <ErrorCard /> : !orders.data?.length ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhuma ordem encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie a primeira ordem para começar a acompanhar a operação.</p>
            <Link to="/_authenticated/ordens" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Criar ordem</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Veículo</TableHead><TableHead>Serviço</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {orders.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.vehicleLabel}<span className="block text-xs font-normal text-muted-foreground">{order.plate !== "—" ? order.plate : ""}</span></TableCell>
                      <TableCell>{order.serviceLabel}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="font-medium">{currencyFormatter.format(order.total)}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: percentage + "%" }} /></div>
    </div>
  );
}

function ErrorCard() {
  return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">Não foi possível carregar os dados do dashboard. Tente atualizar novamente.</div>;
}
