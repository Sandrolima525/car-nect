import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/clientes")({ component: ClientesPage });

function ClientesPage() {
  return <CrudPage table="customers" title="Clientes" singular="Cliente" description="Cadastre e gerencie os clientes da sua empresa." fields={[{ key: "name", label: "Nome", required: true }, { key: "phone", label: "Telefone" }, { key: "email", label: "E-mail", type: "email" }, { key: "document", label: "Documento" }, { key: "notes", label: "Observações" }]} columns={[{ key: "name", label: "Nome" }, { key: "phone", label: "Telefone" }, { key: "email", label: "E-mail" }, { key: "document", label: "Documento" }]} />;
}
