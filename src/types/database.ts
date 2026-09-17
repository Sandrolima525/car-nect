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

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ServiceOrderStatus = Database["public"]["Enums"]["service_order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  employee: "Funcionário",
};
