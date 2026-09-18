import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — LavaPro Gestão" },
      { name: "description", content: "Catálogo de serviços, preços e duração estimada." },
      { property: "og:title", content: "Serviços — LavaPro Gestão" },
      { property: "og:description", content: "Catálogo de serviços, preços e duração estimada." },
    ],
  }),
  component: ServicosPage,
});

const MOCK_SERVICOS = [
  { id: "1", name: "Ducha Simples", category: "Lavagem", price: "R$ 40,00", duration: "30 min" },
  { id: "2", name: "Lavagem Completa", category: "Lavagem", price: "R$ 80,00", duration: "1h" },
  { id: "3", name: "Polimento", category: "Estética", price: "R$ 250,00", duration: "3h" },
];

function ServicosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Serviços</h2>
          <p className="text-muted-foreground">Gerencie o catálogo e os preços dos seus serviços.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader className="pl-4 pr-4 pb-0 pt-4 sm:pl-6 sm:pr-6 sm:pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar serviço..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duração Estimada</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SERVICOS.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">{servico.name}</TableCell>
                  <TableCell>{servico.category}</TableCell>
                  <TableCell>{servico.duration}</TableCell>
                  <TableCell>{servico.price}</TableCell>
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
