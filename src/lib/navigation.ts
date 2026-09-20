import { CalendarDays, LayoutDashboard, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  ready: boolean;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, ready: true, description: "Faturamento e visão geral." },
  { label: "Agenda", to: "/agenda", icon: CalendarDays, ready: true, description: "Agenda inteligente de atendimentos." },
  { label: "Clientes", to: "/clientes", icon: Users, ready: true, description: "Clientes e histórico." },
  { label: "Serviços", to: "/servicos", icon: Sparkles, ready: true, description: "Serviços, duração e valores." },
  { label: "Configurações", to: "/configuracoes", icon: Settings, ready: true, description: "Empresa e agenda pública." },
];

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(item.to + "/"));
}
