import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/ordens")({ component: OrdensPage });

function OrdensPage() {
  return <CrudPage table="service_orders" title="Ordens de Serviço" singular="OS" description="Abra, acompanhe e atualize as ordens de serviço." fields={[{ key: "customer_id", label: "ID do cliente" }, { key: "vehicle_id", label: "ID do veículo" }, { key: "employee_id", label: "ID do funcionário" }, { key: "status", label: "Status", required: true }, { key: "subtotal", label: "Subtotal", type: "number" }, { key: "discount", label: "Desconto", type: "number" }, { key: "total", label: "Total", type: "number" }, { key: "mileage", label: "Quilometragem", type: "number" }, { key: "notes", label: "Observações" }]} columns={[{ key: "id", label: "ID" }, { key: "customer_id", label: "Cliente" }, { key: "vehicle_id", label: "Veículo" }, { key: "status", label: "Status" }, { key: "total", label: "Total" }]} searchKeys={["id", "customer_id", "vehicle_id", "status"]} />;
}
