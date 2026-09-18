import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos — LavaPro Gestão" },
      { name: "description", content: "Veículos vinculados aos clientes e seu histórico." },
      { property: "og:title", content: "Veículos — LavaPro Gestão" },
      { property: "og:description", content: "Veículos vinculados aos clientes e seu histórico." },
    ],
  }),
  component: VeiculosPage,
});

const MOCK_VEICULOS = [
  { id: "1", placa: "ABC-1234", modelo: "Honda Civic", cliente: "João Silva", cor: "Prata" },
  { id: "2", placa: "XYZ-9876", modelo: "Toyota Corolla", cliente: "Maria Oliveira", cor: "Preto" },
];

function VeiculosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Veículos</h2>
          <p className="text-muted-foreground">Gerencie a frota de veículos dos seus clientes.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <Card>
        <CardHeader className="pl-4 pr-4 pb-0 pt-4 sm:pl-6 sm:pr-6 sm:pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar placa, modelo..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_VEICULOS.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">{veiculo.placa}</TableCell>
                  <TableCell>{veiculo.modelo}</TableCell>
                  <TableCell>{veiculo.cor}</TableCell>
                  <TableCell>{veiculo.cliente}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
