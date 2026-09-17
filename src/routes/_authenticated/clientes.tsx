import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — LavaPro Gestão" },
      { name: "description", content: "Cadastro e gerenciamento dos clientes da empresa." },
      { property: "og:title", content: "Clientes — LavaPro Gestão" },
      { property: "og:description", content: "Cadastro e gerenciamento dos clientes da empresa." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={Users}
      title="Clientes"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Cadastro de clientes com telefone, e-mail e documento",
        "Busca rápida por nome, telefone ou placa",
        "Histórico de atendimentos por cliente",
      ]}
    />
  ),
});
