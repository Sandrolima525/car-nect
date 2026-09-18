import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários — LavaPro Gestão" },
      { name: "description", content: "Equipe, funções e comissões da empresa." },
      { property: "og:title", content: "Funcionários — LavaPro Gestão" },
      { property: "og:description", content: "Equipe, funções e comissões da empresa." },
    ],
  }),
  component: FuncionariosPage,
});

const MOCK_FUNCIONARIOS = [
  { id: "1", name: "Pedro Santos", role: "Lavador", phone: "(11) 98888-1111", comission: "10%" },
  { id: "2", name: "Lucas Lima", role: "Polidor", phone: "(11) 97777-2222", comission: "15%" },
];

function FuncionariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Funcionários</h2>
          <p className="text-muted-foreground">Gerencie a equipe e comissões.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader className="pl-4 pr-4 pb-0 pt-4 sm:pl-6 sm:pr-6 sm:pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar membro da equipe..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-6">Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FUNCIONARIOS.map((func) => (
                <TableRow key={func.id}>
                  <TableCell className="pl-4 sm:pl-6 font-medium">{func.name}</TableCell>
                  <TableCell>{func.role}</TableCell>
                  <TableCell>{func.phone}</TableCell>
                  <TableCell>{func.comission}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
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
