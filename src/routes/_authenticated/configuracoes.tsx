import { createFileRoute } from "@tanstack/react-router";
import { Building2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — LavaPro Gestão" },
      { name: "description", content: "Dados da empresa e preferências do sistema." },
      { property: "og:title", content: "Configurações — LavaPro Gestão" },
      { property: "og:description", content: "Dados da empresa e preferências do sistema." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h2>
        <p className="text-muted-foreground">Gerencie os dados e preferências do sistema.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
               <Building2 className="h-5 w-5"/>
               <CardTitle>Dados da Empresa</CardTitle>
            </div>
            <CardDescription>
              Informações que aparecerão nas Ordens de Serviço emitidas aos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input id="tradeName" defaultValue="LavaPro Gestão" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ / CPF</Label>
                <Input id="cnpj" defaultValue="00.000.000/0001-00" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input id="address" defaultValue="Rua Central, 120 - Bairro das Indústrias" />
              </div>
            </div>
            <Button className="mt-4 gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
