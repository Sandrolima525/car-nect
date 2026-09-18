import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { BarChart3, CalendarDays, CircleDollarSign, ClipboardList, Users, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchReportsData,
  getReportRange,
  toInputDate,
  type ReportGranularity,
} from "@/services/reports";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — LavaPro Gestão" },
      { name: "description", content: "Indicadores e análises do desempenho da empresa." },
      { property: "og:title", content: "Relatórios — LavaPro Gestão" },
      { property: "og:description", content: "Indicadores e análises do desempenho da empresa." },
    ],
  }),
  component: RelatoriosPage,
});

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const number = new Intl.NumberFormat("pt-BR");

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

const serviceColors = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

function RelatoriosPage() {
  const [granularity, setGranularity] = useState<ReportGranularity>("daily");
  const initialRange = useMemo(() => getReportRange("daily"), []);
  const [startDate, setStartDate] = useState(toInputDate(initialRange.start));
  const [endDate, setEndDate] = useState(toInputDate(initialRange.end));

  const range = useMemo(() => {
    if (granularity === "custom") {
      return { start: startDate, end: endDate };
    }

    const preset = getReportRange(granularity);
    return { start: toInputDate(preset.start), end: toInputDate(preset.end) };
  }, [granularity, startDate, endDate]);

  const validRange = range.start <= range.end;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["reports", granularity, range.start, range.end],
    queryFn: () => fetchReportsData(range.start, range.end, granularity),
    enabled: validRange,
    staleTime: 60_000,
  });

  function changeGranularity(value: ReportGranularity) {
    setGranularity(value);
    if (value !== "custom") {
      const preset = getReportRange(value);
      setStartDate(toInputDate(preset.start));
      setEndDate(toInputDate(preset.end));
    }
  }

  const periodLabel =
    granularity === "daily"
      ? "Últimos 30 dias"
      : granularity === "weekly"
        ? "Últimas 12 semanas"
        : granularity === "monthly"
          ? "Últimos 12 meses"
          : "Período personalizado";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">Análise de desempenho</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">
            Visualize faturamento, ordens, clientes e serviços com dados reais do sistema.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="granularity" className="text-xs font-medium text-muted-foreground">
              Período
            </label>
            <select
              id="granularity"
              value={granularity}
              onChange={(event) => changeGranularity(event.target.value as ReportGranularity)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="custom">Período personalizado</option>
            </select>
          </div>

          {granularity === "custom" && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
                  De
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
                  Até
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>{periodLabel}</span>
        {isFetching && <span className="text-primary">• atualizando…</span>}
      </div>

      {!validRange && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">
            A data inicial precisa ser anterior ou igual à data final.
          </CardContent>
        </Card>
      )}

      {error && validRange && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os dados do relatório. Tente novamente.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Faturamento"
          value={isLoading ? "—" : currency.format(data?.revenue ?? 0)}
          helper="Pagamentos recebidos no período"
          icon={CircleDollarSign}
        />
        <MetricCard
          title="Ordens"
          value={isLoading ? "—" : number.format(data?.orders ?? 0)}
          helper="Ordens abertas no período"
          icon={ClipboardList}
        />
        <MetricCard
          title="Clientes atendidos"
          value={isLoading ? "—" : number.format(data?.customers ?? 0)}
          helper="Clientes únicos com ordem"
          icon={Users}
        />
        <MetricCard
          title="Ticket médio"
          value={isLoading ? "—" : currency.format(data?.averageTicket ?? 0)}
          helper="Faturamento ÷ ordens"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-7">
        <Card className="overflow-hidden xl:col-span-4">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Faturamento ao longo do tempo</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Passe o mouse sobre o gráfico para consultar cada período.
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <CircleDollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-[330px]">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.points ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} minTickGap={18} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { notation: "compact" })}`}
                      width={62}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => [currency.format(Number(value)), "Faturamento"]}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#revenueFill)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden xl:col-span-3">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Ordens por período</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Abertas x concluídas.</p>
              </div>
              <div className="rounded-xl bg-muted p-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-[330px]">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.points ?? []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} minTickGap={18} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="orders" name="Ordens" fill="hsl(var(--chart-2))" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="completed" name="Concluídas" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Serviços mais realizados</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ranking por quantidade dentro do período selecionado.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.popularServices.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.popularServices}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value, name) =>
                        name === "quantity"
                          ? [number.format(Number(value)), "Quantidade"]
                          : [currency.format(Number(value)), "Faturamento"]
                      }
                    />
                    <Bar dataKey="quantity" name="quantity" fill="hsl(var(--chart-3))" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="Nenhum serviço registrado neste período." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Distribuição dos serviços</CardTitle>
            <p className="text-xs text-muted-foreground">Participação por quantidade.</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.popularServices.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.popularServices}
                      dataKey="quantity"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={98}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.popularServices.map((service, index) => (
                        <Cell key={service.name} fill={serviceColors[index % serviceColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => [number.format(Number(value)), "Serviços"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="Sem dados para exibir." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="relative p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-125" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-end gap-3 rounded-xl bg-muted/20 p-5">
      {[38, 58, 42, 72, 54, 84, 62, 76].map((height, index) => (
        <div key={index} className="w-full animate-pulse rounded-t-md bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
