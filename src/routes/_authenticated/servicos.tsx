import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/servicos")({ component: ServicosPage });

function ServicosPage() {
  return <CrudPage table="services" title="Serviços" singular="Serviço" description="Gerencie o catálogo, os preços e a duração dos serviços." fields={[{ key: "name", label: "Nome", required: true }, { key: "description", label: "Descrição" }, { key: "category", label: "Categoria" }, { key: "price", label: "Preço", type: "number", required: true }, { key: "estimated_duration", label: "Duração estimada (minutos)", type: "number" }]} columns={[{ key: "name", label: "Serviço" }, { key: "category", label: "Categoria" }, { key: "price", label: "Preço" }, { key: "estimated_duration", label: "Duração (min)" }]} />;
}
