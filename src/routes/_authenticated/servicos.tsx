import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — LavaPro Gestão" },
      { name: "description", content: "Catálogo de serviços, preços e duração estimada." },
      { property: "og:title", content: "Serviços — LavaPro Gestão" },
      { property: "og:description", content: "Catálogo de serviços, preços e duração estimada." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={Sparkles}
      title="Serviços"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Catálogo próprio de serviços por empresa",
        "Preço e duração estimada de cada serviço",
        "Categorias para organizar o atendimento",
      ]}
    />
  ),
});
