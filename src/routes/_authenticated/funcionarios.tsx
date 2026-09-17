import { createFileRoute } from "@tanstack/react-router";
import { UserSquare2 } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários — LavaPro Gestão" },
      { name: "description", content: "Equipe, funções e comissões da empresa." },
      { property: "og:title", content: "Funcionários — LavaPro Gestão" },
      { property: "og:description", content: "Equipe, funções e comissões da empresa." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={UserSquare2}
      title="Funcionários"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Cadastro da equipe com função e contato",
        "Percentual de comissão por funcionário",
        "Produção e comissões por período",
      ]}
    />
  ),
});
