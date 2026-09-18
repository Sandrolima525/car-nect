import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — LavaPro Gestão" },
      { name: "description", content: "Agendamentos e organização do dia da equipe." },
      { property: "og:title", content: "Agenda — LavaPro Gestão" },
      { property: "og:description", content: "Agendamentos e organização do dia da equipe." },
    ],
  }),
  component: AgendaPage,
});

const MOCK_AGENDA = [
  { id: "1", time: "09:00", service: "Lavagem Completa", client: "João Silva", status: "Confirmado" },
  { id: "2", time: "10:30", service: "Polimento", client: "Maria Oliveira", status: "Pendente" },
  { id: "3", time: "14:00", service: "Ducha Simples", client: "Carlos Sousa", status: "Em andamento" },
];

function AgendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Agenda</h2>
          <p className="text-muted-foreground">Gerencie os agendamentos do dia.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="md:order-1">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_AGENDA.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold w-16">{item.time}</div>
                  <div>
                    <h4 className="font-medium">{item.client}</h4>
                    <p className="text-sm text-muted-foreground">{item.service}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'Confirmado' ? 'default' : item.status === 'Em andamento' ? 'secondary' : 'outline'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
             <CardHeader>
               <CardTitle>Calendário</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="p-8 border rounded-md text-center text-sm text-muted-foreground bg-muted/50">
                 Selecione uma data para ver ou criar agendamentos.
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
