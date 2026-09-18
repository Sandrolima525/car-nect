import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/common/crud-page";

export const Route = createFileRoute("/_authenticated/veiculos")({ component: VeiculosPage });

function VeiculosPage() {
  return <CrudPage table="vehicles" title="Veículos" singular="Veículo" description="Gerencie os veículos cadastrados para seus clientes." fields={[{ key: "customer_id", label: "ID do cliente", required: true }, { key: "plate", label: "Placa", required: true }, { key: "brand", label: "Marca" }, { key: "model", label: "Modelo" }, { key: "year", label: "Ano", type: "number" }, { key: "color", label: "Cor" }, { key: "current_mileage", label: "Quilometragem atual", type: "number" }, { key: "notes", label: "Observações" }]} columns={[{ key: "plate", label: "Placa" }, { key: "brand", label: "Marca" }, { key: "model", label: "Modelo" }, { key: "year", label: "Ano" }, { key: "customer_id", label: "Cliente" }]} searchKeys={["plate", "brand", "model", "customer_id"]} />;
}
