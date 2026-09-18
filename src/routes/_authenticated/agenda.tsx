import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/agenda")({ component: AgendaPage });

function AgendaPage() {
  return <CrudPage table="service_orders" title="Agenda" singular="Agendamento" description="Use as ordens de serviço para organizar os atendimentos da equipe." fields={[{ key: "customer_id", label: "ID do cliente" }, { key: "vehicle_id", label: "ID do veículo" }, { key: "employee_id", label: "ID do funcionário" }, { key: "status", label: "Status", required: true }, { key: "started_at", label: "Início", type: "date" }, { key: "notes", label: "Observações" }]} columns={[{ key: "started_at", label: "Início" }, { key: "customer_id", label: "Cliente" }, { key: "vehicle_id", label: "Veículo" }, { key: "status", label: "Status" }]} searchKeys={["customer_id", "vehicle_id", "employee_id", "status"]} />;
}
