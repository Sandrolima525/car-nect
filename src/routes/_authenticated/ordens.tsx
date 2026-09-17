import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — LavaPro Gestão" },
      { name: "description", content: "Abertura e acompanhamento dos atendimentos." },
      { property: "og:title", content: "Ordens de Serviço — LavaPro Gestão" },
      { property: "og:description", content: "Abertura e acompanhamento dos atendimentos." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={ClipboardList}
      title="Ordens de Serviço"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Abertura de atendimento com cliente, veículo e serviços",
        "Acompanhamento por situação: pendente, em andamento, concluído, entregue",
        "Cálculo de subtotal, desconto e total",
      ]}
    />
  ),
});
