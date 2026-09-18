import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];

export type Company = Tables["companies"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Customer = Tables["customers"]["Row"];
export type Vehicle = Tables["vehicles"]["Row"];
export type Employee = Tables["employees"]["Row"];
export type Service = Tables["services"]["Row"];
export type ServiceOrder = Tables["service_orders"]["Row"];
export type ServiceOrderItem = Tables["service_order_items"]["Row"];
export type Payment = Tables["payments"]["Row"];

export type AppRole = "owner" | "admin" | "manager" | "employee";
export type ServiceOrderStatus = Database["public"]["Enums"]["service_order_status"];
export type PaymentMethod = string;
export type PaymentStatus = string;

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  employee: "Funcionário",
};
