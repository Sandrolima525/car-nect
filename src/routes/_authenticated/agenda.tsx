import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — LavaPro Gestão" },
      { name: "description", content: "Agendamentos e organização do dia da equipe." },
      { property: "og:title", content: "Agenda — LavaPro Gestão" },
      { property: "og:description", content: "Agendamentos e organização do dia da equipe." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={CalendarDays}
      title="Agenda"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Agendamentos por dia e por funcionário",
        "Visão de horários livres e ocupados",
        "Conversão do agendamento em ordem de serviço",
      ]}
    />
  ),
});
