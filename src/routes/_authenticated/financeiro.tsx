import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

import { ModulePlaceholder } from "@/components/common/module-placeholder";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — LavaPro Gestão" },
      { name: "description", content: "Pagamentos e movimentações financeiras da empresa." },
      { property: "og:title", content: "Financeiro — LavaPro Gestão" },
      { property: "og:description", content: "Pagamentos e movimentações financeiras da empresa." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon={Wallet}
      title="Financeiro"
      description="Este módulo será liberado no próximo passo do desenvolvimento."
      planned={[
        "Registro de pagamentos por atendimento",
        "Formas de pagamento: dinheiro, pix, débito, crédito e outras",
        "Movimentações e fechamento por período",
      ]}
    />
  ),
});
