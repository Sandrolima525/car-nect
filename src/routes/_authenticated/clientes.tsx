import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — LavaPro Gestão" },
      { name: "description", content: "Cadastro e gerenciamento dos clientes da empresa." },
      { property: "og:title", content: "Clientes — LavaPro Gestão" },
      { property: "og:description", content: "Cadastro e gerenciamento dos clientes da empresa." },
    ],
  }),
  component: ClientesPage,
});

const MOCK_CLIENTES = [
  { id: "1", name: "João Silva", phone: "(11) 98765-4321", email: "joao@email.com", vehicles: 2 },
  { id: "2", name: "Maria Oliveira", phone: "(11) 91234-5678", email: "maria@email.com", vehicles: 1 },
];

function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground">Gerencie os clientes da sua empresa.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pl-4 pr-4 pb-0 pt-4 sm:pl-6 sm:pr-6 sm:pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por nome, telefone..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Veículos</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CLIENTES.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">{cliente.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{cliente.phone}</span>
                      <span className="text-xs text-muted-foreground">{cliente.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{cliente.vehicles}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver histórico</DropdownMenuItem>
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
