import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

export const Route = createFileRoute("/_authenticated/ordens")({
  component: OrdensPage,
});

type Customer = { id: string; name: string; phone: string | null };
type Vehicle = { id: string; customer_id: string; plate: string; brand: string | null; model: string | null };
type Employee = { id: string; name: string; role: string | null };
type Service = { id: string; name: string; price: number; estimated_duration: number | null };
type Order = {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  status: string;
  total: number;
  created_at: string;
};

type Item = { serviceId: string; quantity: number };

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function OrdensPage() {
  const [companyId, setCompanyId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("pending");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const id = companyId || (await getCurrentCompanyId());
      setCompanyId(id);

      const [customerRes, vehicleRes, employeeRes, serviceRes, orderRes] =
        await Promise.all([
          supabase.from("customers").select("id,name,phone").eq("company_id", id).order("name"),
          supabase.from("vehicles").select("id,customer_id,plate,brand,model").eq("company_id", id).order("plate"),
          supabase.from("employees").select("id,name,role").eq("company_id", id).eq("active", true).order("name"),
          supabase.from("services").select("id,name,price,estimated_duration").eq("company_id", id).eq("active", true).order("name"),
          supabase.from("service_orders").select("id,customer_id,vehicle_id,status,total,created_at").eq("company_id", id).order("created_at", { ascending: false }),
        ]);

      for (const result of [customerRes, vehicleRes, employeeRes, serviceRes, orderRes]) {
        if (result.error) throw result.error;
      }

      setCustomers((customerRes.data ?? []) as Customer[]);
      setVehicles((vehicleRes.data ?? []) as Vehicle[]);
      setEmployees((employeeRes.data ?? []) as Employee[]);
      setServices((serviceRes.data ?? []) as Service[]);
      setOrders((orderRes.data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as ordens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const customerVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.customer_id === customerId),
    [vehicles, customerId],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => {
      const service = services.find((entry) => entry.id === item.serviceId);
      return sum + (service?.price ?? 0) * item.quantity;
    }, 0),
    [items, services],
  );

  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  const addService = () => {
    if (!services.length) return;
    setItems((current) => [...current, { serviceId: services[0].id, quantity: 1 }]);
  };

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const resetForm = () => {
    setCustomerId("");
    setVehicleId("");
    setEmployeeId("");
    setStatus("pending");
    setMileage("");
    setNotes("");
    setItems([]);
    setDiscount("");
  };

  const save = async () => {
    if (!customerId) {
      setError("Selecione o cliente.");
      return;
    }
    if (!vehicleId) {
      setError("Selecione o veículo.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um serviço.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data: order, error: orderError } = await supabase
        .from("service_orders")
        .insert({
          company_id: companyId,
          customer_id: customerId,
          vehicle_id: vehicleId,
          employee_id: employeeId || null,
          status,
          subtotal,
          discount: discountValue,
          total,
          mileage: mileage ? Number(mileage) : null,
          notes: notes.trim() || null,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from("service_order_items")
        .insert(
          items.map((item) => {
            const service = services.find((entry) => entry.id === item.serviceId)!;
            return {
              company_id: companyId,
              service_order_id: order.id,
              service_id: service.id,
              quantity: item.quantity,
              unit_price: service.price,
              total: service.price * item.quantity,
            };
          }),
        );

      if (itemsError) {
        await supabase.from("service_orders").delete().eq("id", order.id);
        throw itemsError;
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a ordem.");
    } finally {
      setSaving(false);
    }
  };

  const customerName = (id: string | null) =>
    customers.find((customer) => customer.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h2>
        <p className="text-muted-foreground">Abra uma OS em poucos passos.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Nova OS</h3>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={customerId} onValueChange={(value) => {
                setCustomerId(value);
                setVehicleId("");
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId} disabled={!customerId}>
                <SelectTrigger><SelectValue placeholder={customerId ? "Selecione o veículo" : "Escolha o cliente primeiro"} /></SelectTrigger>
                <SelectContent>
                  {customerVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} · {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Serviços *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addService} disabled={!services.length}>
                <Plus className="mr-2 h-4 w-4" />Adicionar serviço
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                Nenhum serviço adicionado.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const service = services.find((entry) => entry.id === item.serviceId);
                  return (
                    <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_110px_auto_auto] md:items-end">
                      <div className="space-y-2">
                        <Label>Serviço</Label>
                        <Select value={item.serviceId} onValueChange={(value) => updateItem(index, { serviceId: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {services.map((entry) => (
                              <SelectItem key={entry.id} value={entry.id}>
                                {entry.name} · {money(entry.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Qtd.</Label>
                        <Input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Math.max(1, Number(event.target.value) || 1) })} />
                      </div>
                      <div className="pb-2 text-sm font-medium">{money((service?.price ?? 0) * item.quantity)}</div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Desconto</Label>
              <Input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Quilometragem</Label>
              <Input type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observações da OS (opcional)" />
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total da OS</p>
              <p className="text-2xl font-bold">{money(total)}</p>
              {discountValue > 0 && <p className="text-xs text-muted-foreground">Subtotal {money(subtotal)} · Desconto {money(discountValue)}</p>}
            </div>
            <Button onClick={() => void save()} disabled={saving || !customerId || !vehicleId || items.length === 0}>
              {saving ? "Salvando..." : "Abrir OS"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Últimas ordens</h3></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhuma ordem cadastrada.</div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{customerName(order.customer_id)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{order.status}</span>
                    <span className="font-semibold">{money(Number(order.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
