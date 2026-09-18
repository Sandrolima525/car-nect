import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h2>
        <p className="text-muted-foreground">Acompanhe os resultados da sua empresa.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 15.231,89</div>
            <p className="text-xs text-muted-foreground">+20.1% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23</div>
            <p className="text-xs text-muted-foreground">+18.1% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Serviços Feitos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+124</div>
            <p className="text-xs text-muted-foreground">+19% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 54,00</div>
            <p className="text-xs text-muted-foreground">+7% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
             <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground bg-muted/20 border-dashed border-2 rounded-md">
                Gráfico de Desempenho Visual
             </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
             <CardTitle>Serviços mais populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 mt-4">
              <div className="flex justify-between items-center">
                 <span className="font-medium">Lavagem Completa</span>
                 <span>45%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="font-medium">Ducha Simples</span>
                 <span>30%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="font-medium">Polimento</span>
                 <span>15%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="font-medium">Higienização Interna</span>
                 <span>10%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
