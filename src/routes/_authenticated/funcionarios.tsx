import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/funcionarios")({ component: FuncionariosPage });

function FuncionariosPage() {
  return <CrudPage table="employees" title="Funcionários" singular="Funcionário" description="Gerencie a equipe, os cargos e as comissões." fields={[{ key: "name", label: "Nome", required: true }, { key: "phone", label: "Telefone" }, { key: "email", label: "E-mail", type: "email" }, { key: "role", label: "Cargo" }, { key: "commission_percentage", label: "Comissão (%)", type: "number" }]} columns={[{ key: "name", label: "Nome" }, { key: "role", label: "Cargo" }, { key: "phone", label: "Telefone" }, { key: "commission_percentage", label: "Comissão (%)" }]} />;
}
