import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — LavaPro Gestão" },
      { name: "description", content: "Dados da empresa e preferências do sistema." },
      { property: "og:title", content: "Configurações — LavaPro Gestão" },
      { property: "og:description", content: "Dados da empresa e preferências do sistema." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={Settings}
      title="Configurações"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Dados cadastrais e logo da empresa",
        "Usuários da empresa e níveis de acesso",
        "Preferências de atendimento e financeiro",
      ]}
    />
  ),
});
