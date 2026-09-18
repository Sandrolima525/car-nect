import { CalendarDays, LayoutDashboard, Settings, Sparkles, type LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";

export type NavItem = {
  label: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  ready: boolean;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, ready: true, description: "Resumo do dia." },
  { label: "Agendamentos", to: "/agenda", icon: CalendarDays, ready: true, description: "Clientes e horários." },
  { label: "Serviços", to: "/servicos", icon: Sparkles, ready: true, description: "Serviços, duração e preços." },
  { label: "Configurações", to: "/configuracoes", icon: Settings, ready: true, description: "Empresa e agendamento público." },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(item.to + "/"));
}
