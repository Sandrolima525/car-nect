import { supabase } from "@/integrations/supabase/client";

export type ReportGranularity = "daily" | "weekly" | "monthly" | "custom";

export type ReportPoint = {
  label: string;
  date: string;
  revenue: number;
  orders: number;
  completed: number;
};

export type PopularService = {
  name: string;
  quantity: number;
  revenue: number;
};

export type ReportsData = {
  points: ReportPoint[];
  revenue: number;
  orders: number;
  completed: number;
  customers: number;
  averageTicket: number;
  popularServices: PopularService[];
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function startOfWeek(date: Date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function keyFor(date: Date, granularity: Exclude<ReportGranularity, "custom">) {
  if (granularity === "daily") return startOfDay(date).getTime();
  if (granularity === "weekly") return startOfWeek(date).getTime();
  return startOfMonth(date).getTime();
}

function formatLabel(date: Date, granularity: ReportGranularity) {
  if (granularity === "daily") {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
  }
  if (granularity === "weekly") {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
}

function buildBuckets(start: Date, end: Date, granularity: Exclude<ReportGranularity, "custom">) {
  const buckets: ReportPoint[] = [];
  let cursor =
    granularity === "daily"
      ? startOfDay(start)
      : granularity === "weekly"
        ? startOfWeek(start)
        : startOfMonth(start);

  const limit = granularity === "daily" ? startOfDay(end) : granularity === "weekly" ? startOfWeek(end) : startOfMonth(end);

  while (cursor <= limit) {
    buckets.push({
      label: formatLabel(cursor, granularity),
      date: cursor.toISOString(),
      revenue: 0,
      orders: 0,
      completed: 0,
    });
    cursor =
      granularity === "daily"
        ? addDays(cursor, 1)
        : granularity === "weekly"
          ? addDays(cursor, 7)
          : addMonths(cursor, 1);
  }

  return buckets;
}

export async function fetchReportsData(
  startDate: string,
  endDate: string,
  granularity: ReportGranularity,
): Promise<ReportsData> {
  const start = startOfDay(new Date(`${startDate}T00:00:00`));
  const end = endOfDay(new Date(`${endDate}T00:00:00`));

  const [ordersResult, paymentsResult] = await Promise.all([
    supabase
      .from("service_orders")
      .select(
        "id, created_at, completed_at, status, total, customer_id, service_order_items(quantity, total, services(name))",
      )
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("id, amount, paid_at, status")
      .eq("status", "paid")
      .gte("paid_at", start.toISOString())
      .lte("paid_at", end.toISOString())
      .order("paid_at", { ascending: true }),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const effectiveGranularity = granularity === "custom" ? "daily" : granularity;
  const points = buildBuckets(start, end, effectiveGranularity);
  const bucketMap = new Map(points.map((point) => [new Date(point.date).getTime(), point]));

  for (const order of orders) {
    const key = keyFor(new Date(order.created_at), effectiveGranularity);
    const point = bucketMap.get(key);
    if (!point) continue;
    point.orders += 1;
    if (order.status === "completed" || order.status === "delivered") point.completed += 1;
  }

  for (const payment of payments) {
    if (!payment.paid_at) continue;
    const key = keyFor(new Date(payment.paid_at), effectiveGranularity);
    const point = bucketMap.get(key);
    if (point) point.revenue += Number(payment.amount ?? 0);
  }

  const serviceMap = new Map<string, PopularService>();
  for (const order of orders) {
    for (const item of order.service_order_items ?? []) {
      const name = item.services?.name ?? "Serviço sem nome";
      const current = serviceMap.get(name) ?? { name, quantity: 0, revenue: 0 };
      current.quantity += Number(item.quantity ?? 0);
      current.revenue += Number(item.total ?? 0);
      serviceMap.set(name, current);
    }
  }

  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const customers = new Set(orders.map((order) => order.customer_id).filter(Boolean)).size;

  return {
    points,
    revenue,
    orders: orders.length,
    completed: orders.filter((order) => order.status === "completed" || order.status === "delivered").length,
    customers,
    averageTicket: orders.length ? revenue / orders.length : 0,
    popularServices: [...serviceMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6),
  };
}

export function getReportRange(granularity: ReportGranularity, reference = new Date()) {
  const end = endOfDay(reference);

  if (granularity === "daily") {
    return { start: addDays(startOfDay(reference), -29), end };
  }

  if (granularity === "weekly") {
    return { start: addDays(startOfWeek(reference), -7 * 11), end };
  }

  if (granularity === "monthly") {
    return { start: startOfMonth(addMonths(reference, -11)), end };
  }

  return { start: addDays(startOfDay(reference), -29), end };
}

export function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
