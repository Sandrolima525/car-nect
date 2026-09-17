import { supabase } from "@/integrations/supabase/client";
import type { ServiceOrderStatus } from "@/types/database";

export type DashboardMetrics = {
  todayOrders: number;
  inProgress: number;
  completedToday: number;
  revenueToday: number;
  revenueMonth: number;
  customers: number;
  vehicles: number;
};

export type RecentOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  serviceLabel: string;
  employeeName: string;
  total: number;
  status: ServiceOrderStatus;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Todas as consultas usam o cliente autenticado do navegador.
 * O isolamento por empresa é garantido pelas políticas RLS no banco.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const dayStart = startOfToday();
  const monthStart = startOfMonth();

  const [todayOrders, inProgress, completedToday, paymentsToday, paymentsMonth, customers, vehicles] =
    await Promise.all([
      supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart),
      supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "delivered"])
        .gte("completed_at", dayStart),
      supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", dayStart),
      supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", monthStart),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("vehicles").select("id", { count: "exact", head: true }),
    ]);

  const results = [
    todayOrders,
    inProgress,
    completedToday,
    paymentsToday,
    paymentsMonth,
    customers,
    vehicles,
  ];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;

  const sum = (rows: { amount: number | string }[] | null) =>
    (rows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

  return {
    todayOrders: todayOrders.count ?? 0,
    inProgress: inProgress.count ?? 0,
    completedToday: completedToday.count ?? 0,
    revenueToday: sum(paymentsToday.data),
    revenueMonth: sum(paymentsMonth.data),
    customers: customers.count ?? 0,
    vehicles: vehicles.count ?? 0,
  };
}

export async function fetchRecentOrders(limit = 8): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from("service_orders")
    .select(
      `id, created_at, status, total,
       customers ( name ),
       vehicles ( plate, brand, model ),
       employees ( name ),
       service_order_items ( id, services ( name ) )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((order) => {
    const items = order.service_order_items ?? [];
    const names = items.map((item) => item.services?.name).filter(Boolean) as string[];
    const serviceLabel =
      names.length === 0
        ? "—"
        : names.length === 1
          ? names[0]!
          : `${names[0]} +${names.length - 1}`;

    const vehicle = order.vehicles;

    return {
      id: order.id,
      createdAt: order.created_at,
      customerName: order.customers?.name ?? "Cliente não informado",
      vehicleLabel: [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "—",
      plate: vehicle?.plate ?? "—",
      serviceLabel,
      employeeName: order.employees?.name ?? "—",
      total: Number(order.total ?? 0),
      status: order.status,
    };
  });
}

export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});
