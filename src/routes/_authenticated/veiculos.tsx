import { createFileRoute } from "@tanstack/react-router";
import { Car } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos — LavaPro Gestão" },
      { name: "description", content: "Veículos vinculados aos clientes e seu histórico." },
      { property: "og:title", content: "Veículos — LavaPro Gestão" },
      { property: "og:description", content: "Veículos vinculados aos clientes e seu histórico." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={Car}
      title="Veículos"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Veículos vinculados a cada cliente",
        "Placa padronizada e sem duplicidade na empresa",
        "Quilometragem e histórico de serviços do veículo",
      ]}
    />
  ),
});
