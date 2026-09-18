import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpToLine, DollarSign, Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — LavaPro Gestão" },
      { name: "description", content: "Pagamentos e movimentações financeiras da empresa." },
      { property: "og:title", content: "Financeiro — LavaPro Gestão" },
      { property: "og:description", content: "Pagamentos e movimentações financeiras da empresa." },
    ],
  }),
  component: FinanceiroPage,
});

const MOCK_LANCAMENTOS = [
  { id: "1", description: "Lavagem Completa (João Silva)", date: "10/10/2023", value: "R$ 80,00", type: "entrada", method: "PIX" },
  { id: "2", description: "Produtos de Limpeza", date: "09/10/2023", value: "R$ 150,00", type: "saida", method: "Cartão de Crédito" },
  { id: "3", description: "Ducha Simples (Carlos Sousa)", date: "09/10/2023", value: "R$ 40,00", type: "entrada", method: "Dinheiro" },
];

function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h2>
          <p className="text-muted-foreground">Controle de receitas e despesas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 2.450,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <ArrowUpToLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 3.100,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ 650,00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Meio de pagamento</TableHead>
                <TableHead className="text-right pr-4 sm:pr-6">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LANCAMENTOS.map((lanc) => (
                <TableRow key={lanc.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">
                    <div className="flex items-center gap-2">
                     {lanc.type === 'entrada' ? <ArrowUpToLine className="h-4 w-4 text-green-500"/> : <ArrowDownToLine className="h-4 w-4 text-red-500"/>}
                     {lanc.description}
                    </div>
                  </TableCell>
                  <TableCell>{lanc.date}</TableCell>
                  <TableCell><Badge variant="secondary">{lanc.method}</Badge></TableCell>
                  <TableCell className={`text-right pr-4 sm:pr-6 font-semibold ${lanc.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {lanc.type === 'entrada' ? '+' : '-'}{lanc.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
