import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — LavaPro Gestão" },
      { name: "description", content: "Abertura e acompanhamento dos atendimentos." },
      { property: "og:title", content: "Ordens de Serviço — LavaPro Gestão" },
      { property: "og:description", content: "Abertura e acompanhamento dos atendimentos." },
    ],
  }),
  component: OrdensPage,
});

const MOCK_ORDENS = [
  { id: "OS-001", client: "João Silva", vehicle: "Honda Civic - ABC1234", status: "em andamento", total: "R$ 150,00", date: "10/10/2023" },
  { id: "OS-002", client: "Maria Oliveira", vehicle: "Toyota Corolla - XYZ9876", status: "concluído", total: "R$ 80,00", date: "10/10/2023" },
];

function OrdensPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ordens de Serviço</h2>
          <p className="text-muted-foreground">Acompanhe os atendimentos e serviços.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      <Card>
        <CardHeader className="pl-4 pr-4 pb-0 pt-4 sm:pl-6 sm:pr-6 sm:pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar OS..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">OS</TableHead>
                <TableHead>Cliente / Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ORDENS.map((ordem) => (
                <TableRow key={ordem.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">{ordem.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{ordem.client}</span>
                      <span className="text-xs text-muted-foreground">{ordem.vehicle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ordem.status === "concluído" ? "default" : "secondary"}>
                      {ordem.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ordem.total}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
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
