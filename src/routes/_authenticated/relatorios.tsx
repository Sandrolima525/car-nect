import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — LavaPro Gestão" },
      { name: "description", content: "Indicadores e análises do desempenho da empresa." },
      { property: "og:title", content: "Relatórios — LavaPro Gestão" },
      { property: "og:description", content: "Indicadores e análises do desempenho da empresa." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={BarChart3}
      title="Relatórios"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Faturamento por período e por forma de pagamento",
        "Serviços mais vendidos e ticket médio",
        "Produtividade da equipe",
      ]}
    />
  ),
});
